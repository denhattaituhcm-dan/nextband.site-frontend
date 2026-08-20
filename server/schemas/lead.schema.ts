import { z } from "zod";

export const createLeadSchema = z.object({
  fullName: z
    .string({ required_error: "Họ và tên là bắt buộc" })
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(255, "Họ và tên không được vượt quá 255 ký tự"),
  phone: z
    .string({ required_error: "Số điện thoại là bắt buộc" })
    .trim()
    .min(9, "Số điện thoại phải có ít nhất 9 chữ số")
    .max(20, "Số điện thoại không hợp lệ"),
  email: z
    .string()
    .trim()
    .email("Email không đúng định dạng")
    .optional()
    .or(z.literal("")),
  goal: z
    .string()
    .trim()
    .max(2000, "Mục tiêu/lời nhắn không được vượt quá 2000 ký tự")
    .optional()
    .or(z.literal("")),
  source: z
    .string()
    .trim()
    .max(100)
    .optional()
    .default("contact_page"),
});

export const updateLeadSchema = z.object({
  status: z
    .enum(["NEW", "CONTACTED", "ENROLLED", "CANCELLED", "ARCHIVED"])
    .optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum(["NEW", "CONTACTED", "ENROLLED", "CANCELLED", "ARCHIVED"])
    .optional(),
  search: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
