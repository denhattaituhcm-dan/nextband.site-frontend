export class InvitationRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByCode(inviteCode) {
        return this.prisma.invitation.findUnique({
            where: { inviteCode },
            include: { class: { include: { course: true } } }
        });
    }
    async create(data) {
        return this.prisma.invitation.create({ data });
    }
}
