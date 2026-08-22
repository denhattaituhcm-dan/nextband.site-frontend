import { CanonicalSectionSchema, CanonicalQuestionGroupSchema, SectionDTO, QuestionGroupDTO } from "../contracts/section.contract";
import { adaptQuestion } from "./question.adapter";

/**
 * Normalizes raw question group data into Canonical QuestionGroupDTO.
 */
export function adaptQuestionGroup(raw: any): QuestionGroupDTO {
  if (!raw || typeof raw !== "object") {
    console.warn("[CONTRACT_VIOLATION] Invalid raw question group:", raw);
    return CanonicalQuestionGroupSchema.parse({
      id: "fallback-group",
      orderIndex: 0,
      questions: [],
    });
  }

  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  const normalizedQuestions = rawQuestions.map(adaptQuestion);

  const candidate = {
    id: String(raw.id || `grp-${Date.now()}`),
    sectionId: raw.sectionId ?? raw.section_id ?? null,
    title: raw.title ?? null,
    passage: raw.passage ?? null,
    instructions: raw.instructions ?? null,
    audioUrl: raw.audioUrl ?? raw.audio_url ?? null,
    orderIndex: typeof (raw.orderIndex ?? raw.order_index) === "number" ? (raw.orderIndex ?? raw.order_index) : 0,
    questions: normalizedQuestions,
  };

  const parseResult = CanonicalQuestionGroupSchema.safeParse(candidate);
  if (!parseResult.success) {
    console.error("[CONTRACT_VIOLATION] QuestionGroup schema validation failed:", parseResult.error.format());
    return candidate as QuestionGroupDTO;
  }

  return parseResult.data;
}

/**
 * Normalizes and validates raw section data into Canonical SectionDTO.
 */
export function adaptSection(raw: any): SectionDTO {
  if (!raw || typeof raw !== "object") {
    console.warn("[CONTRACT_VIOLATION] Invalid raw section:", raw);
    return CanonicalSectionSchema.parse({
      id: "fallback-section",
      title: "Section",
      sectionType: "general",
      orderIndex: 0,
      questionGroups: [],
    });
  }

  const rawGroups = Array.isArray(raw.questionGroups || raw.question_groups)
    ? (raw.questionGroups || raw.question_groups)
    : [];

  const normalizedGroups = rawGroups.map(adaptQuestionGroup);

  const candidate = {
    id: String(raw.id || `sec-${Date.now()}`),
    examId: raw.examId ?? raw.exam_id ?? null,
    sectionType: String(raw.sectionType || raw.section_type || "general"),
    title: String(raw.title || "Section"),
    instructions: raw.instructions ?? null,
    content: raw.content ?? [],
    audioUrl: raw.audioUrl ?? raw.audio_url ?? null,
    audioScript: raw.audioScript !== undefined ? raw.audioScript : raw.audio_script !== undefined ? raw.audio_script : undefined,
    audio_script: raw.audio_script !== undefined ? raw.audio_script : raw.audioScript !== undefined ? raw.audioScript : undefined,
    durationMinutes:
      typeof (raw.durationMinutes ?? raw.duration_minutes) === "number"
        ? (raw.durationMinutes ?? raw.duration_minutes)
        : null,
    orderIndex: typeof (raw.orderIndex ?? raw.order_index) === "number" ? (raw.orderIndex ?? raw.order_index) : 0,
    questionGroups: normalizedGroups,
    question_groups: normalizedGroups,
  };

  const parseResult = CanonicalSectionSchema.safeParse(candidate);
  if (!parseResult.success) {
    console.error("[CONTRACT_VIOLATION] Section schema validation failed:", parseResult.error.format());
    return candidate as SectionDTO;
  }

  return parseResult.data;
}
