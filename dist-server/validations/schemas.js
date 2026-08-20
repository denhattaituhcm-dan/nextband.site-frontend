import { z } from 'zod';
export const joinByCodeSchema = z.object({
    inviteCode: z.string().min(1, 'Mã mời không được để trống').max(10)
});
export const createInvitationSchema = z.object({
    classId: z.string().uuid('ID Lớp học không hợp lệ'),
    inviteCode: z.string().min(3).max(10).optional(),
    expiresInDays: z.number().int().positive().optional()
});
export const createHomeworkSchema = z.object({
    classId: z.string().uuid('ID Lớp học không hợp lệ'),
    classSessionId: z.string().uuid().optional(),
    lessonId: z.string().uuid().optional(),
    examId: z.string().uuid().optional(),
    title: z.string().min(3, 'Tên bài tập phải từ 3 ký tự'),
    description: z.string().optional(),
    deadline: z.string().datetime().optional()
});
export const submitHomeworkSchema = z.object({
    homeworkId: z.string().uuid('ID Bài tập không hợp lệ')
});
export const gradeSubmissionSchema = z.object({
    homeworkId: z.string().uuid('ID Bài tập không hợp lệ'),
    studentId: z.string().uuid('ID Học viên không hợp lệ'),
    score: z.number().min(0).max(10, 'Band điểm phải từ 0 - 10'),
    feedback: z.string().min(1, 'Nhận xét không được để trống')
});
