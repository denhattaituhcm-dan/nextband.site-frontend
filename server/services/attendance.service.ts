import { PrismaClient } from '@prisma/client';
import { ClassRepository } from '../repositories/class.repository.js';
import { AuthorizationService, AuthorizationError, NotFoundError } from './authorization.service.js';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'UNMARKED';

export const ClassSessionStatus = {
  SCHEDULED: 'SCHEDULED',
  PLANNED: 'PLANNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type ClassSessionStatus = (typeof ClassSessionStatus)[keyof typeof ClassSessionStatus];

export interface MarkAttendanceItemDTO {
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
  notes?: string | null;
}

export class AttendanceService {
  private classRepo: ClassRepository;
  private authService: AuthorizationService;

  constructor(private prisma: PrismaClient) {
    this.classRepo = new ClassRepository(prisma);
    this.authService = new AuthorizationService(prisma);
  }

  // 1. Fetch Session Attendance & Summary Projection (Object-Level Authorization)
  async getSessionAttendance(classId: string, sessionId: string, userId: string, userRoles: string[] = ['student']) {
    const classData = await this.classRepo.findById(classId);
    if (!classData) throw new NotFoundError('Lớp học không tồn tại.');

    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.classId !== classId) throw new NotFoundError('Buổi học không hợp lệ hoặc không thuộc lớp này.');

    const isAdmin = userRoles.includes('admin');
    const isClassTeacher = userRoles.includes('teacher') && classData.teacherId === userId;
    const isOtherTeacher = userRoles.includes('teacher') && classData.teacherId !== userId;

    if (isOtherTeacher && !isAdmin) {
      throw new AuthorizationError('Từ chối truy cập: Bạn không phải giáo viên phụ trách lớp học này.', 403);
    }

    const isStudent = !isAdmin && !isClassTeacher;

    if (isStudent) {
      // Check if student belongs to this class
      const isEnrolled = await this.authService.isStudentEnrolledInClass(userId, classId);
      if (!isEnrolled) {
        throw new AuthorizationError('Từ chối truy cập: Bạn không thuộc danh sách học viên của lớp này.', 403);
      }

      // Student only gets their OWN record
      const studentRecord = await this.prisma.classAttendance.findUnique({
        where: {
          classId_studentId_sessionDate: {
            classId,
            studentId: userId,
            sessionDate: session.plannedDate,
          },
        },
        include: {
          student: {
            select: { id: true, fullName: true, email: true, avatarUrl: true },
          },
        },
      });

      const studentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, avatarUrl: true },
      });

      return {
        classId,
        className: classData.name,
        sessionId,
        sessionNumber: session.sessionNumber,
        sessionTitle: `Buổi ${session.sessionNumber}`,
        sessionDate: session.plannedDate,
        status: session.status,
        summary: null, // Students do not get whole class summary
        students: [
          {
            studentId: userId,
            studentName: studentUser?.fullName || studentUser?.email || '',
            avatarUrl: studentUser?.avatarUrl || null,
            status: studentRecord ? studentRecord.status : 'UNMARKED',
            note: studentRecord?.note || null,
          },
        ],
      };
    }

    // Admin & Class Teacher get full class attendance
    const classStudents = await this.prisma.classStudent.findMany({
      where: { classId, deletedAt: null },
      include: { student: true },
    });

    const attendanceRecords = await this.prisma.classAttendance.findMany({
      where: {
        classId,
        sessionDate: session.plannedDate,
      },
    });

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;

    const studentsAttendance = classStudents.map((cs) => {
      const record = attendanceRecords.find((r) => r.studentId === cs.studentId);
      const status = (record ? record.status : 'UNMARKED') as AttendanceStatus;

      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;
      else if (status === 'LATE') lateCount++;
      else if (status === 'EXCUSED') excusedCount++;
      else unmarkedCount++;

      return {
        studentId: cs.studentId,
        studentName: cs.student.fullName || cs.student.email,
        avatarUrl: cs.student.avatarUrl,
        status,
        note: record?.note || null,
      };
    });

    return {
      classId,
      className: classData.name,
      sessionId,
      sessionNumber: session.sessionNumber,
      sessionTitle: `Buổi ${session.sessionNumber}`,
      sessionDate: session.plannedDate,
      status: session.status,
      summary: {
        total: classStudents.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        unmarked: unmarkedCount,
      },
      students: studentsAttendance,
    };
  }

  // 2. Mark Session Attendance (Bulk Upsert Transaction + Strict Authorization Guard + Read-only Guard for COMPLETED sessions)
  async markSessionAttendance(classId: string, sessionId: string, teacherId: string, userRoles: string[], items: MarkAttendanceItemDTO[]) {
    // 1. Authoritative Gate Check (Admin or Class Teacher only)
    await this.authService.requireClassTeacherOrAdmin({
      userId: teacherId,
      userRoles,
      classId,
    });

    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session || session.classId !== classId) throw new NotFoundError('Buổi học không hợp lệ hoặc không thuộc lớp này.');

    const isAdmin = userRoles.includes('admin');

    // Immutability Guard: If session is already COMPLETED, only Admin can edit
    if (session.status === ClassSessionStatus.COMPLETED && !isAdmin) {
      throw new AuthorizationError(
        'SESSION_ALREADY_COMPLETED: Buổi học đã chốt điểm danh (COMPLETED). Bạn không có quyền chỉnh sửa ngoại trừ Admin.',
        403,
      );
    }

    // Guard 1: Active Enrollment Validation (Must verify ALL studentIds before any DB writes)
    const requestedStudentIds = [...new Set(items.map((i) => i.studentId))];
    const activeClassStudents = await this.prisma.classStudent.findMany({
      where: {
        classId,
        studentId: { in: requestedStudentIds },
        deletedAt: null,
      },
      select: { studentId: true },
    });

    const activeSet = new Set(activeClassStudents.map((cs) => cs.studentId));
    const invalidStudentIds = requestedStudentIds.filter((id) => !activeSet.has(id));

    if (invalidStudentIds.length > 0) {
      throw new AuthorizationError(
        `INVALID_ENROLLMENT_STUDENT: Phát hiện học viên (${invalidStudentIds.join(', ')}) không thuộc danh sách học viên đang hoạt động của lớp học này.`,
        400,
      );
    }

    await this.prisma.$transaction(
      items.map((item) => {
        const itemNote = item.note || item.notes || null;
        return this.prisma.classAttendance.upsert({
          where: {
            classId_studentId_sessionDate: {
              classId,
              studentId: item.studentId,
              sessionDate: session.plannedDate,
            },
          },
          update: {
            status: item.status,
            markedBy: teacherId,
            note: itemNote,
          },
          create: {
            classId,
            studentId: item.studentId,
            sessionDate: session.plannedDate,
            markedBy: teacherId,
            status: item.status,
            note: itemNote,
          },
        });
      }),
    );

    return { success: true, message: `Đã lưu điểm danh cho ${items.length} học viên.` };
  }

  // 3. Complete Session Guard: Chốt buổi học (Khóa 100% điểm danh)
  async completeSession(classId: string, sessionId: string, userId: string, userRoles: string[]) {
    // 1. Authoritative Gate Check (Admin or Class Teacher only)
    await this.authService.requireClassTeacherOrAdmin({
      userId,
      userRoles,
      classId,
    });

    const session = await this.prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session || session.classId !== classId) throw new NotFoundError('Buổi học không hợp lệ hoặc không thuộc lớp này.');

    // Check active class students
    const activeStudents = await this.prisma.classStudent.findMany({
      where: { classId, deletedAt: null },
      select: { studentId: true },
    });

    const attendanceRecords = await this.prisma.classAttendance.findMany({
      where: {
        classId,
        sessionDate: session.plannedDate,
      },
    });

    const unmarkedStudentIds = activeStudents
      .map((s) => s.studentId)
      .filter((studentId) => {
        const record = attendanceRecords.find((r) => r.studentId === studentId);
        return !record || record.status === 'UNMARKED';
      });

    if (unmarkedStudentIds.length > 0) {
      throw new AuthorizationError(
        `COMPLETION_GUARD_FAILED: Còn ${unmarkedStudentIds.length} học viên chưa được điểm danh (trạng thái UNMARKED). Bạn phải điểm danh 100% học viên trước khi hoàn thành buổi học.`,
        400,
      );
    }

    const updated = await this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: ClassSessionStatus.COMPLETED,
      },
    });

    return {
      success: true,
      message: 'Đã hoàn tất chốt buổi học thành công. Trạng thái điểm danh đã được khóa.',
      session: {
        id: updated.id,
        sessionNumber: updated.sessionNumber,
        status: updated.status,
      },
    };
  }

  // 4. Attendance Matrix Projection
  async getAttendanceMatrix(classId: string, userId: string, userRoles: string[] = ['student']) {
    const classData = await this.classRepo.findById(classId);
    if (!classData) throw new NotFoundError('Lớp học không tồn tại.');

    const isAdmin = userRoles.includes('admin');
    const isClassTeacher = userRoles.includes('teacher') && classData.teacherId === userId;
    const isOtherTeacher = userRoles.includes('teacher') && classData.teacherId !== userId;

    if (isOtherTeacher && !isAdmin) {
      throw new AuthorizationError('Từ chối truy cập: Bạn không phải giáo viên phụ trách lớp học này.', 403);
    }

    const isStudent = !isAdmin && !isClassTeacher;

    if (isStudent) {
      const isEnrolled = await this.authService.isStudentEnrolledInClass(userId, classId);
      if (!isEnrolled) {
        throw new AuthorizationError('Từ chối truy cập: Bạn không thuộc danh sách học viên của lớp này.', 403);
      }
    }

    const sessions = await this.prisma.classSession.findMany({
      where: { classId },
      orderBy: { sessionNumber: 'asc' },
    });

    const classStudents = await this.prisma.classStudent.findMany({
      where: {
        classId,
        deletedAt: null,
        ...(isStudent ? { studentId: userId } : {}),
      },
      include: { student: true },
      orderBy: { joinedAt: 'asc' },
    });

    const allAttendance = await this.prisma.classAttendance.findMany({
      where: {
        classId,
        ...(isStudent ? { studentId: userId } : {}),
      },
    });

    const completedSessions = sessions.filter((s) => s.status === ClassSessionStatus.COMPLETED);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const matrix = classStudents.map((cs) => {
      const studentId = cs.studentId;
      const studentAttendance = allAttendance.filter((a) => a.studentId === studentId);

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let excusedCount = 0;

      sessions.forEach((s) => {
        const att = studentAttendance.find(
          (a) => new Date(a.sessionDate).toISOString().slice(0, 10) === new Date(s.plannedDate).toISOString().slice(0, 10),
        );
        if (s.status === ClassSessionStatus.COMPLETED && att) {
          if (att.status === 'PRESENT') presentCount++;
          else if (att.status === 'LATE') lateCount++;
          else if (att.status === 'ABSENT') absentCount++;
          else if (att.status === 'EXCUSED') excusedCount++;
        }
      });

      const eligibleSessions = Math.max(0, completedSessions.length - excusedCount);
      const attendedCount = presentCount + lateCount;
      const attendanceRate = eligibleSessions > 0 ? Math.round((attendedCount / eligibleSessions) * 1000) / 10 : 100;

      const sessionRecords = sessions.map((s) => {
        const att = studentAttendance.find(
          (a) => new Date(a.sessionDate).toISOString().slice(0, 10) === new Date(s.plannedDate).toISOString().slice(0, 10),
        );
        const sDate = new Date(s.plannedDate);
        const isFuture = s.status === 'SCHEDULED' && sDate > today;
        const isOverdueUnmarked = s.status === 'SCHEDULED' && sDate <= today;

        return {
          sessionId: s.id,
          sessionNumber: s.sessionNumber,
          sessionDate: s.plannedDate,
          status: s.status,
          attendanceStatus: att ? att.status : 'UNMARKED',
          isFuture,
          isOverdueUnmarked,
          note: att?.note || null,
        };
      });

      return {
        studentId,
        studentName: cs.student.fullName || cs.student.email,
        avatarUrl: cs.student.avatarUrl,
        email: cs.student.email,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        eligibleSessions,
        attendanceRate,
        sessions: sessionRecords,
      };
    });

    const sessionCoverage = sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 1000) / 10 : 0;
    const totalExpectedRecords = completedSessions.length * classStudents.length;
    const actualMarkedRecords = allAttendance.filter((a) => {
      const isCompletedDate = completedSessions.some(
        (cs) => new Date(cs.plannedDate).toISOString().slice(0, 10) === new Date(a.sessionDate).toISOString().slice(0, 10),
      );
      return isCompletedDate && a.status !== 'UNMARKED';
    }).length;
    const recordCoverage = totalExpectedRecords > 0 ? Math.round((actualMarkedRecords / totalExpectedRecords) * 1000) / 10 : 100;

    return {
      classId,
      className: classData.name,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      sessionCoverage,
      recordCoverage,
      attendanceCoverage: sessionCoverage,
      sessions: sessions.map((s) => ({
        id: s.id,
        sessionNumber: s.sessionNumber,
        sessionDate: s.plannedDate,
        title: s.note || `Buổi ${s.sessionNumber}`,
        lessonTitle: s.note || `Buổi ${s.sessionNumber}`,
        status: s.status,
      })),
      students: matrix,
    };
  }
}
