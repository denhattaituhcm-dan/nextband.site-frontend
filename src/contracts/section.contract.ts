import { z } from "zod";
import { CanonicalQuestionSchema, QuestionDTO } from "./question.contract";

/**
 * Question Group DTO (e.g. Passage, Listening Section part).
 */
export const CanonicalQuestionGroupSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string().nullable().optional(),
  title: z.string().nullable().default(null),
  passage: z.string().nullable().default(null),
  instructions: z.string().nullable().default(null),
  audioUrl: z.string().nullable().default(null),
  orderIndex: z.number().default(0),
  questions: z.array(CanonicalQuestionSchema).default([]),
});

export type QuestionGroupDTO = z.infer<typeof CanonicalQuestionGroupSchema>;

/**
 * Section Type Enum.
 */
export const SectionTypeEnum = z.enum([
  "reading",
  "listening",
  "writing",
  "speaking",
  "general",
]);

export type SectionType = z.infer<typeof SectionTypeEnum>;

/**
 * Canonical Section DTO.
 */
export const CanonicalSectionSchema = z.object({
  id: z.string().min(1),
  examId: z.string().nullable().optional(),
  sectionType: z.string().default("general"),
  title: z.string().default("Section"),
  instructions: z.string().nullable().default(null),
  content: z.any().default([]),
  audioUrl: z.string().nullable().default(null),
  audioScript: z.string().nullable().optional(),
  audio_script: z.string().nullable().optional(),
  durationMinutes: z.number().nullable().default(null),
  orderIndex: z.number().default(0),
  questionGroups: z.array(CanonicalQuestionGroupSchema).default([]),
  // Backward compatibility alias during transition:
  question_groups: z.array(CanonicalQuestionGroupSchema).optional(),
});

export type SectionDTO = z.infer<typeof CanonicalSectionSchema>;
