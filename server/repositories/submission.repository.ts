import { PrismaClient, Prisma } from "@prisma/client";

export class SubmissionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, include?: any, select?: any) {
    if (select) {
      return this.prisma.examSubmission.findUnique({
        where: { id },
        select,
      });
    }
    return this.prisma.examSubmission.findUnique({
      where: { id },
      include,
    });
  }

  async findFirst(where: any, include?: any, select?: any, orderBy?: any) {
    if (select) {
      return this.prisma.examSubmission.findFirst({
        where,
        select,
        orderBy,
      });
    }
    return this.prisma.examSubmission.findFirst({
      where,
      include,
      orderBy,
    });
  }

  async findMany(where: any, skip?: number, take?: number, orderBy?: any, select?: any, include?: any) {
    if (select) {
      return this.prisma.examSubmission.findMany({
        where,
        skip,
        take,
        orderBy,
        select,
      });
    }
    return this.prisma.examSubmission.findMany({
      where,
      skip,
      take,
      orderBy,
      include,
    });
  }

  async count(where: any) {
    return this.prisma.examSubmission.count({ where });
  }

  async countAttempts(studentId: string, examId: string) {
    return this.prisma.examSubmission.count({
      where: {
        studentId,
        examId,
        status: { in: ["SUBMITTED", "GRADED"] },
      },
    });
  }

  async create(data: any) {
    return this.prisma.examSubmission.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.examSubmission.update({
      where: { id },
      data,
    });
  }

  async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
