import { z } from "zod";
import { CanonicalSectionSchema, SectionDTO } from "./section.contract";

/**
 * Canonical Exam DTO.
 */
export const CanonicalExamSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().nullable().optional(),
  title: z.string().default("Đề thi"),
  description: z.string().nullable().default(null),
  week: z.number().nullable().default(null),
  durationMinutes: z.number().default(60),
  isPublished: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isLocked: z.boolean().default(false),
  isOpen: z.boolean().default(false),
  maxParticipants: z.number().nullable().default(null),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  course: z
    .object({
      id: z.string(),
      title: z.string(),
    })
    .nullable()
    .optional(),
  sections: z.array(CanonicalSectionSchema).default([]),
});

export type ExamDTO = z.infer<typeof CanonicalExamSchema>;
