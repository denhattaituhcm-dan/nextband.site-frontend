import { PrismaClient, InvitationStatus } from '@prisma/client';
import { InvitationRepository } from '../repositories/invitation.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { AuthorizationService, AuthorizationError, NotFoundError } from './authorization.service.js';

export class InvitationService {
  private invitationRepo: InvitationRepository;
  private classRepo: ClassRepository;
  private authService: AuthorizationService;

  constructor(private prisma: PrismaClient) {
    this.invitationRepo = new InvitationRepository(prisma);
    this.classRepo = new ClassRepository(prisma);
    this.authService = new AuthorizationService(prisma);
  }

  // Use Case: Student Joins Class via Code (Atomic Transaction)
  async joinClassByCode(studentId: string, inviteCode: string) {
    return this.prisma.$transaction(async (tx) => {
      const invitationRepo = new InvitationRepository(tx as PrismaClient);
      const classRepo = new ClassRepository(tx as PrismaClient);

      // 1. Check Invitation Code
      const invitation = await invitationRepo.findByCode(inviteCode.toUpperCase());
      if (!invitation || invitation.status !== InvitationStatus.ACTIVE) {
        throw new Error('Mã mời không tồn tại hoặc đã hết hạn.');
      }

      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        throw new Error('Mã mời đã quá hạn sử dụng.');
      }

      // 2. Check if Student already in Class
      const alreadyJoined = await classRepo.isStudentInClass(invitation.classId, studentId);
      if (alreadyJoined) {
        return { message: 'Bạn đã là học viên của lớp này.', class: invitation.class };
      }

      // 3. Add Student to Class
      await classRepo.addStudentToClass(invitation.classId, studentId);

      return {
        success: true,
        message: `Đăng ký tham gia lớp ${invitation.class.name} thành công!`,
        class: invitation.class
      };
    });
  }

  // Use Case: Admin/Teacher Generates Invitation Code (Authoritative Gate: Teacher owns class or Admin)
  async generateInvitation(
    classId: string,
    createdBy: string,
    userRoles: string[] = ['teacher'],
    inviteCode?: string,
    expiresInDays?: number
  ) {
    await this.authService.requireClassTeacherOrAdmin({
      userId: createdBy,
      userRoles,
      classId,
    });

    const code = inviteCode ? inviteCode.toUpperCase() : Math.random().toString(36).substring(2, 8).toUpperCase();
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    return this.invitationRepo.create({
      class: { connect: { id: classId } },
      creator: { connect: { id: createdBy } },
      inviteCode: code,
      inviteToken: token,
      expiresAt,
      status: InvitationStatus.ACTIVE
    });
  }
}
