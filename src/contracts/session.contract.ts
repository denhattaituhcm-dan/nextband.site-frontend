import { z } from "zod";

export const SessionStatusEnum = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
]);

export type SessionStatus = z.infer<typeof SessionStatusEnum>;

/**
 * Canonical Session DTO for Class Schedules.
 */
export const CanonicalSessionSchema = z.object({
  id: z.string().min(1),
  classId: z.string().default(""),
  sessionNumber: z.number().int().positive().default(1),
  plannedDate: z.string().default(() => new Date().toISOString().split("T")[0]),
  actualDate: z.string().nullable().optional(),
  startTime: z.string().default(""),
  endTime: z.string().default(""),
  status: SessionStatusEnum.default("SCHEDULED"),
  rescheduleReason: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  teacherId: z.string().nullable().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  // Enriched metadata
  lessonTitle: z.string().nullable().optional(),
  lessonDescription: z.string().nullable().optional(),
  isAttendanceLocked: z.boolean().default(false),
  attendanceCount: z.number().default(0),
});

export type SessionDTO = z.infer<typeof CanonicalSessionSchema>;
