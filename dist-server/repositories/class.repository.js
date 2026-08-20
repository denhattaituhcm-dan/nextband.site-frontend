export class ClassRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id, include) {
        return this.prisma.class.findUnique({
            where: { id },
            include: include || {
                course: true,
                teacher: {
                    select: { id: true, fullName: true, email: true },
                },
                students: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: "desc" },
                },
            },
        });
    }
    async findMany(where, skip, take, orderBy) {
        return this.prisma.class.findMany({
            where,
            skip,
            take,
            orderBy: orderBy || { createdAt: "desc" },
            include: {
                teacher: {
                    select: { id: true, fullName: true, email: true },
                },
                _count: {
                    select: { students: true },
                },
            },
        });
    }
    async count(where) {
        return this.prisma.class.count({ where });
    }
    async create(data) {
        return this.prisma.class.create({ data });
    }
    async update(id, data) {
        return this.prisma.class.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        return this.prisma.class.delete({
            where: { id },
        });
    }
    async isTeacherOfClass(classId, teacherId) {
        const cls = await this.prisma.class.findFirst({
            where: { id: classId, teacherId },
        });
        return !!cls;
    }
    async isStudentInClass(classId, studentId) {
        const cs = await this.prisma.classStudent.findFirst({
            where: { classId, studentId },
        });
        return !!cs;
    }
    async addStudent(classId, studentId) {
        return this.prisma.classStudent.create({
            data: { classId, studentId },
        });
    }
    async addStudentToClass(classId, studentId) {
        return this.addStudent(classId, studentId);
    }
    async removeStudent(classId, studentId) {
        return this.prisma.classStudent.deleteMany({
            where: { classId, studentId },
        });
    }
    async removeStudentFromClass(classId, studentId) {
        return this.removeStudent(classId, studentId);
    }
    async getClassesForStudent(studentId) {
        return this.prisma.classStudent.findMany({
            where: {
                studentId,
            },
            include: {
                class: {
                    include: {
                        course: {
                            select: { id: true, title: true, description: true },
                        },
                        teacher: {
                            select: { id: true, fullName: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async recordAttendance(data) {
        return this.prisma.classAttendance.upsert({
            where: {
                classId_studentId_sessionDate: {
                    classId: data.classId,
                    studentId: data.studentId,
                    sessionDate: data.sessionDate,
                },
            },
            update: {
                status: data.status,
                markedBy: data.markedBy,
                note: data.note,
            },
            create: {
                classId: data.classId,
                studentId: data.studentId,
                sessionDate: data.sessionDate,
                markedBy: data.markedBy,
                status: data.status,
                note: data.note,
            },
        });
    }
}
