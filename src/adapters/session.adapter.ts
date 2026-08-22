import { CanonicalSessionSchema, SessionDTO, SessionStatus } from "../contracts/session.contract";

/**
 * Normalizes and validates raw session data into Canonical SessionDTO.
 */
export function adaptSession(raw: any): SessionDTO {
  if (!raw || typeof raw !== "object") {
    console.warn("[CONTRACT_VIOLATION] Invalid raw session payload:", raw);
    return CanonicalSessionSchema.parse({
      id: "fallback-session",
      classId: "",
      sessionNumber: 1,
      plannedDate: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      status: "SCHEDULED",
      createdAt: new Date().toISOString(),
    });
  }

  const candidate = {
    id: String(raw.id || `sess-${Date.now()}`),
    classId: String(raw.classId || raw.class_id || ""),
    sessionNumber: typeof (raw.sessionNumber ?? raw.session_number) === "number" ? (raw.sessionNumber ?? raw.session_number) : 1,
    plannedDate: String(raw.plannedDate || raw.planned_date || raw.scheduledDate || raw.session_date || new Date().toISOString().split("T")[0]),
    actualDate: raw.actualDate || raw.actual_date || null,
    startTime: String(raw.startTime || raw.start_time || ""),
    endTime: String(raw.endTime || raw.end_time || ""),
    status: (raw.status as SessionStatus) || "SCHEDULED",
    rescheduleReason: raw.rescheduleReason || raw.reschedule_reason || null,
    note: raw.note ?? null,
    teacherId: raw.teacherId || raw.teacher_id || null,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    lessonTitle: raw.lessonTitle || raw.lesson_title || null,
    lessonDescription: raw.lessonDescription || raw.lesson_description || null,
    isAttendanceLocked: Boolean(raw.isAttendanceLocked ?? raw.is_attendance_locked),
    attendanceCount: typeof raw.attendanceCount === "number" ? raw.attendanceCount : 0,
  };

  const parseResult = CanonicalSessionSchema.safeParse(candidate);
  if (!parseResult.success) {
    console.error("[CONTRACT_VIOLATION] Session schema validation failed:", parseResult.error.format());
    return candidate as SessionDTO;
  }

  return parseResult.data;
}
