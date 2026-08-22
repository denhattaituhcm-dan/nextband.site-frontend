import { z } from "zod";

/**
 * Question types supported across the entire NextBand LMS platform.
 */
export const QuestionTypeEnum = z.enum([
  "multiple_choice",
  "multiple_choice_multi",
  "fill_blank",
  "short_answer",
  "essay",
  "true_false_not_given",
  "yes_no_not_given",
  "matching",
  "speaking",
  "listening",
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

/**
 * Strict Canonical Question DTO consumed by all React components.
 * Single Source of Truth (SSOT): CamelCase naming only.
 */
export const CanonicalQuestionSchema = z.object({
  id: z.string().min(1),
  groupId: z.string().nullable().optional(),
  questionType: z.string().default("short_answer"),
  questionText: z.string().default(""),
  selectionMode: z.enum(["single", "multiple"]).default("single"),
  maxSelections: z.number().int().positive().default(1),
  isMultiChoice: z.boolean().default(false),
  options: z.array(z.string()).default([]),
  correctAnswer: z.string().nullable().default(null),
  correct_answer: z.string().nullable().optional(),
  answerKey: z.string().nullable().optional(),
  answer_key: z.string().nullable().optional(),
  fillBlankAnswers: z.array(z.string()).default([]),
  audioUrl: z.string().nullable().default(null),
  points: z.number().default(1),
  orderIndex: z.number().default(0),
  explanation: z.string().nullable().optional(),
  hint: z.string().nullable().optional(),
  instruction: z.string().nullable().optional(),
});

export type QuestionDTO = z.infer<typeof CanonicalQuestionSchema>;
