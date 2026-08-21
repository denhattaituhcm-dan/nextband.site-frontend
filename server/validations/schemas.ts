import { z } from 'zod';

export const joinByCodeSchema = z.object({
  inviteCode: z.string().min(1, 'Mã mời không được để trống').max(10)
});

export const createInvitationSchema = z.object({
  classId: z.string().uuid('ID Lớp học không hợp lệ'),
  inviteCode: z.string().min(3).max(10).optional(),
  expiresInDays: z.number().int().positive().optional()
});


