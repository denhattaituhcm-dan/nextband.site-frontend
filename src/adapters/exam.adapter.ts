import { CanonicalExamSchema, ExamDTO } from "../contracts/exam.contract";
import { adaptSection } from "./section.adapter";

/**
 * Normalizes and validates raw exam data into Canonical ExamDTO.
 */
export function adaptExam(raw: any): ExamDTO {
  if (!raw || typeof raw !== "object") {
    throw new Error(`[CONTRACT_VIOLATION] Invalid raw exam payload: expected object, got ${typeof raw}`);
  }

  const rawSections = Array.isArray(raw.sections || raw.exam_sections)
    ? (raw.sections || raw.exam_sections)
    : [];

  const normalizedSections = rawSections.map(adaptSection);

  const candidate = {
    id: String(raw.id || `exam-${Date.now()}`),
    courseId: raw.courseId ?? raw.course_id ?? null,
    title: String(raw.title || "Đề thi"),
    description: raw.description ?? null,
    week: typeof raw.week === "number" ? raw.week : null,
    durationMinutes: typeof (raw.durationMinutes ?? raw.duration_minutes) === "number" ? (raw.durationMinutes ?? raw.duration_minutes) : 60,
    isPublished: Boolean(raw.isPublished ?? raw.is_published),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    isLocked: Boolean(raw.isLocked ?? raw.is_locked),
    isOpen: Boolean(raw.isOpen ?? raw.is_open),
    maxParticipants:
      typeof (raw.maxParticipants ?? raw.max_participants) === "number"
        ? (raw.maxParticipants ?? raw.max_participants)
        : null,
    createdAt: raw.createdAt || raw.created_at || undefined,
    updatedAt: raw.updatedAt || raw.updated_at || undefined,
    course: raw.courses || raw.course || null,
    sections: normalizedSections,
  };

  const parseResult = CanonicalExamSchema.safeParse(candidate);
  if (!parseResult.success) {
    console.error("[CONTRACT_VIOLATION] Exam schema validation failed:", parseResult.error.format());
    return candidate as ExamDTO;
  }

  return parseResult.data;
}
