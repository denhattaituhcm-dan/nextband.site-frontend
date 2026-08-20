import { PrismaClient, Prisma, InvitationStatus } from '@prisma/client';

export class InvitationRepository {
  constructor(private prisma: PrismaClient) {}

  async findByCode(inviteCode: string) {
    return this.prisma.invitation.findUnique({
      where: { inviteCode },
      include: { class: { include: { course: true } } }
    });
  }

  async create(data: Prisma.InvitationCreateInput) {
    return this.prisma.invitation.create({ data });
  }
}
