import { ClassRepository } from "../repositories/class.repository.js";
import { AuthorizationError, NotFoundError } from "./authorization.service.js";
export class ClassService {
    prisma;
    repo;
    constructor(prisma) {
        this.prisma = prisma;
        this.repo = new ClassRepository(prisma);
    }
    // Use Case: Get all active class memberships for the currently authenticated student
    async getMyClasses(userId) {
        const memberships = await this.repo.getClassesForStudent(userId);
        return memberships.map((m) => ({
            id: m.id,
            classId: m.class.id,
            className: m.class.name,
            courseId: m.class.courseId,
            courseTitle: m.class.course?.title ?? m.class.name,
            teacherName: m.class.teacher?.fullName ?? null,
            isActive: m.class.isActive,
            membershipStatus: "ACTIVE",
            joinedAt: m.createdAt,
        }));
    }
    // Use Case: List Classes with Role & Teacher filtering
    async listClasses(user, query) {
        const { page = 1, limit = 10, search, isActive } = query;
        const skip = (page - 1) * limit;
        const where = {};
        const isAdmin = user.roles.includes("admin");
        const isTeacher = user.roles.includes("teacher");
        if (isTeacher && !isAdmin) {
            where.teacherId = user.id;
        }
        else if (!isAdmin && !isTeacher) {
            where.students = { some: { studentId: user.id } };
        }
        if (isActive !== undefined) {
            where.isActive = isActive === "true" || isActive === true;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }
        const [data, total] = await Promise.all([
            this.repo.findMany(where, skip, limit),
            this.repo.count(where),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Use Case: Get Class Details with Ownership Check
    async getClassById(user, id) {
        const classData = await this.repo.findById(id);
        if (!classData) {
            throw new NotFoundError("Không tìm thấy lớp học");
        }
        const isAdmin = user.roles.includes("admin");
        const isTeacher = user.roles.includes("teacher");
        if (isTeacher && !isAdmin && classData.teacherId !== user.id) {
            throw new AuthorizationError("Từ chối truy cập - lớp không thuộc quyền quản lý của bạn", 403);
        }
        if (!isAdmin && !isTeacher) {
            const isEnrolled = classData.students.some((s) => s.studentId === user.id);
            if (!isEnrolled) {
                throw new AuthorizationError("Từ chối truy cập - bạn không phải thành viên của lớp này", 403);
            }
        }
        return classData;
    }
    // Use Case: Create Class (Admin or Teacher)
    async createClass(user, data) {
        const isAdmin = user.roles.includes("admin");
        const isTeacher = user.roles.includes("teacher");
        if (!isAdmin && !isTeacher) {
            throw new AuthorizationError("Chỉ giáo viên hoặc admin mới có quyền tạo lớp", 403);
        }
        const teacherId = isAdmin ? (data.teacherId || user.id) : user.id;
        let courseId = data.courseId;
        if (!courseId) {
            const firstCourse = await this.prisma.course.findFirst();
            courseId = firstCourse?.id || "default";
        }
        return this.repo.create({
            name: data.name,
            description: data.description,
            course: { connect: { id: courseId } },
            teacher: teacherId ? { connect: { id: teacherId } } : undefined,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            isActive: data.isActive !== undefined ? data.isActive : true,
        });
    }
    // Use Case: Update Class with Ownership Guard
    async updateClass(user, id, data) {
        const classData = await this.repo.findById(id);
        if (!classData) {
            throw new NotFoundError("Không tìm thấy lớp học");
        }
        const isAdmin = user.roles.includes("admin");
        if (!isAdmin && classData.teacherId !== user.id) {
            throw new AuthorizationError("Từ chối truy cập - bạn không có quyền sửa lớp này", 403);
        }
        const updatePayload = {};
        if (data.name !== undefined)
            updatePayload.name = data.name;
        if (data.description !== undefined)
            updatePayload.description = data.description;
        if (data.startDate !== undefined)
            updatePayload.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined)
            updatePayload.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.isActive !== undefined)
            updatePayload.isActive = data.isActive;
        if (isAdmin && data.teacherId !== undefined)
            updatePayload.teacherId = data.teacherId;
        return this.repo.update(id, updatePayload);
    }
    // Use Case: Add Student to Class
    async addStudent(user, classId, studentId) {
        const classData = await this.repo.findById(classId);
        if (!classData) {
            throw new NotFoundError("Không tìm thấy lớp học");
        }
        const isAdmin = user.roles.includes("admin");
        if (!isAdmin && classData.teacherId !== user.id) {
            throw new AuthorizationError("Từ chối truy cập - bạn không có quyền thêm học viên vào lớp này", 403);
        }
        const alreadyIn = await this.repo.isStudentInClass(classId, studentId);
        if (alreadyIn) {
            throw new AuthorizationError("Học viên đã có trong lớp học này", 409);
        }
        return this.repo.addStudentToClass(classId, studentId);
    }
    // Use Case: Remove Student from Class
    async removeStudent(user, classId, studentId) {
        const classData = await this.repo.findById(classId);
        if (!classData) {
            throw new NotFoundError("Không tìm thấy lớp học");
        }
        const isAdmin = user.roles.includes("admin");
        if (!isAdmin && classData.teacherId !== user.id) {
            throw new AuthorizationError("Từ chối truy cập - bạn không có quyền xóa học viên khỏi lớp này", 403);
        }
        return this.repo.removeStudentFromClass(classId, studentId);
    }
    // Use Case: Record Attendance
    async recordAttendance(user, classId, records) {
        const classData = await this.repo.findById(classId);
        if (!classData) {
            throw new NotFoundError("Không tìm thấy lớp học");
        }
        const isAdmin = user.roles.includes("admin");
        if (!isAdmin && classData.teacherId !== user.id) {
            throw new AuthorizationError("Từ chối truy cập - bạn không có quyền điểm danh lớp này", 403);
        }
        const results = [];
        for (const r of records) {
            const sDate = r.sessionDate ? new Date(r.sessionDate) : new Date();
            const recorded = await this.repo.recordAttendance({
                classId,
                studentId: r.studentId,
                sessionDate: sDate,
                markedBy: user.id,
                status: r.status,
                note: r.note,
            });
            results.push(recorded);
        }
        return { success: true, count: results.length, data: results };
    }
}
