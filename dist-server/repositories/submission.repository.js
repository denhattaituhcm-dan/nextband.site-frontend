export class SubmissionRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id, include, select) {
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
    async findFirst(where, include, select, orderBy) {
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
    async findMany(where, skip, take, orderBy, select, include) {
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
    async count(where) {
        return this.prisma.examSubmission.count({ where });
    }
    async countAttempts(studentId, examId) {
        return this.prisma.examSubmission.count({
            where: {
                studentId,
                examId,
                status: { in: ["SUBMITTED", "GRADED"] },
            },
        });
    }
    async create(data) {
        return this.prisma.examSubmission.create({ data });
    }
    async update(id, data) {
        return this.prisma.examSubmission.update({
            where: { id },
            data,
        });
    }
    async transaction(fn) {
        return this.prisma.$transaction(fn);
    }
}
