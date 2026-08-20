import { PrismaClient, Prisma } from "@prisma/client";

export class ClassRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, include?: any) {
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

  async findMany(where: any, skip?: number, take?: number, orderBy?: any) {
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

  async count(where: any) {
    return this.prisma.class.count({ where });
  }

  async create(data: Prisma.ClassCreateInput) {
    return this.prisma.class.create({ data });
  }

  async update(id: string, data: Prisma.ClassUpdateInput) {
    return this.prisma.class.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.class.delete({
      where: { id },
    });
  }

  async isTeacherOfClass(classId: string, teacherId: string): Promise<boolean> {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, teacherId },
    });
    return !!cls;
  }

  async isStudentInClass(classId: string, studentId: string): Promise<boolean> {
    const cs = await this.prisma.classStudent.findFirst({
      where: { classId, studentId },
    });
    return !!cs;
  }

  async addStudent(classId: string, studentId: string) {
    return this.prisma.classStudent.create({
      data: { classId, studentId },
    });
  }

  async addStudentToClass(classId: string, studentId: string) {
    return this.addStudent(classId, studentId);
  }

  async removeStudent(classId: string, studentId: string) {
    return this.prisma.classStudent.deleteMany({
      where: { classId, studentId },
    });
  }

  async removeStudentFromClass(classId: string, studentId: string) {
    return this.removeStudent(classId, studentId);
  }

  async getClassesForStudent(studentId: string) {
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

  async recordAttendance(data: {
    classId: string;
    studentId: string;
    sessionDate: Date;
    markedBy: string;
    status: any;
    note?: string;
  }) {
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
