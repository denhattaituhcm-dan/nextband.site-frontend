import { InvitationStatus } from '@prisma/client';
import { InvitationRepository } from '../repositories/invitation.repository.js';
import { ClassRepository } from '../repositories/class.repository.js';
import { AuthorizationService } from './authorization.service.js';
export class InvitationService {
    prisma;
    invitationRepo;
    classRepo;
    authService;
    constructor(prisma) {
        this.prisma = prisma;
        this.invitationRepo = new InvitationRepository(prisma);
        this.classRepo = new ClassRepository(prisma);
        this.authService = new AuthorizationService(prisma);
    }
    // Use Case: Student Joins Class via Code (Atomic Transaction)
    async joinClassByCode(studentId, inviteCode) {
        return this.prisma.$transaction(async (tx) => {
            const invitationRepo = new InvitationRepository(tx);
            const classRepo = new ClassRepository(tx);
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
    async generateInvitation(classId, createdBy, userRoles = ['teacher'], inviteCode, expiresInDays) {
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
