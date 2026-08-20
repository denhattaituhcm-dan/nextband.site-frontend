import { z } from "zod";
export const createClassSchema = z.object({
    name: z.string().min(1, "Tên lớp không được để trống"),
    description: z.string().optional().default(""),
    courseId: z.string().optional(),
    teacherId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional().default(true),
});
export const updateClassSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    courseId: z.string().optional(),
    teacherId: z.string().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
});
