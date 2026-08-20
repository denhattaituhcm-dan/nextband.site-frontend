import { PrismaClient, EnrollmentStatus } from '@prisma/client';

export class WorkspaceService {
  constructor(private prisma: PrismaClient) {}

  async getStudentWorkspace(studentId: string) {
    // 1. Fetch Student Profile
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!student) {
      throw new Error('Học viên không tồn tại.');
    }

    // 2. Fetch Class Enrollments (excluding soft-deleted)
    const classStudents = await this.prisma.classStudent.findMany({
      where: {
        studentId,
        deletedAt: null,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            courseId: true,
            teacherId: true,
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Case 1: No Class Enrollments at all
    if (classStudents.length === 0) {
      return {
        state: 'NO_ENROLLMENT',
        student,
        classes: [],
        nextAction: null,
        announcements: [],
        notifications: [],
      };
    }

    // Map formatted classes with status
    const formattedClasses = classStudents.map((cs) => ({
      id: cs.class.id,
      name: cs.class.name,
      description: cs.class.description,
      courseTitle: cs.class.course?.title || '',
      status: cs.status as EnrollmentStatus,
      joinedAt: cs.joinedAt,
    }));

    const activeClasses = classStudents.filter(
      (cs) => (cs.status as string) === 'ACTIVE'
    );
    const suspendedClasses = classStudents.filter(
      (cs) => (cs.status as string) === 'SUSPENDED'
    );

    // Case 2: Has classes but none are ACTIVE
    if (activeClasses.length === 0) {
      const state =
        suspendedClasses.length > 0
          ? 'SUSPENDED_STUDENT'
          : 'PENDING_ACTIVATION';

      return {
        state,
        student,
        classes: formattedClasses,
        nextAction: null,
        announcements: [],
        notifications: [],
      };
    }

    // Case 3: Has ACTIVE class(es) -> Determine priority nextAction
    let nextAction: {
      type: 'LESSON' | 'EXAM';
      targetId: string;
      title: string;
      classId: string;
    } | null = null;

    if (activeClasses.length > 0) {
      nextAction = {
        type: 'LESSON',
        targetId: activeClasses[0].classId,
        title: `Vào lớp ${activeClasses[0].class.name}`,
        classId: activeClasses[0].classId,
      };
    }

    return {
      state: 'ACTIVE_STUDENT',
      student,
      classes: formattedClasses,
      nextAction,
      announcements: [],
      notifications: [],
    };
  }
}
