import { CanonicalQuestionSchema, QuestionDTO } from "../contracts/question.contract";

/**
 * Normalizes and validates raw database / API responses into Canonical QuestionDTO.
 * Captures contract violations and logs diagnostic warnings instead of crashing.
 */
export function adaptQuestion(raw: any): QuestionDTO {
  if (!raw || typeof raw !== "object") {
    throw new Error(`[CONTRACT_VIOLATION] Invalid raw question received: expected object, got ${typeof raw}`);
  }

  // Parse options safely: support JSON string or array
  let parsedOptions: string[] = [];
  if (Array.isArray(raw.options)) {
    parsedOptions = raw.options.map((o: any) => String(o ?? ""));
  } else if (typeof raw.options === "string") {
    try {
      const parsed = JSON.parse(raw.options);
      if (Array.isArray(parsed)) {
        parsedOptions = parsed.map((o: any) => String(o ?? ""));
      } else {
        console.warn("[CONTRACT_VIOLATION] Question options string is not an array:", raw.options);
      }
    } catch {
      console.warn("[CONTRACT_VIOLATION] Failed to JSON parse question options:", raw.options);
    }
  } else if (raw.options !== null && raw.options !== undefined) {
    console.warn("[CONTRACT_VIOLATION] Question options is neither array nor string:", raw.options);
  }

  // Parse fill-blank answers safely
  let fillBlankAnswers: string[] = [];
  if (Array.isArray(raw.fillBlankAnswers || raw.fill_blank_answers)) {
    fillBlankAnswers = (raw.fillBlankAnswers || raw.fill_blank_answers).map((a: any) => String(a ?? ""));
  } else if (typeof (raw.correctAnswer || raw.correct_answer) === "string") {
    const rawAnswer = raw.correctAnswer || raw.correct_answer;
    try {
      const parsed = JSON.parse(rawAnswer);
      if (Array.isArray(parsed)) {
        fillBlankAnswers = parsed.map((a: any) => String(a ?? ""));
      }
    } catch {
      // Split by pipe if pipe-delimited
      if (rawAnswer.includes("|")) {
        fillBlankAnswers = rawAnswer.split("|").map((s: string) => s.trim());
      }
    }
  }

  const selectionMode =
    raw.selectionMode ||
    (raw.isMultiChoice || raw.is_multi_choice ? "multiple" : "single");

  const maxSelections =
    typeof raw.maxSelections === "number"
      ? raw.maxSelections
      : typeof raw.max_selections === "number"
      ? raw.max_selections
      : selectionMode === "multiple"
      ? 2
      : 1;

  const candidate = {
    id: String(raw.id || `q-${Date.now()}`),
    groupId: raw.groupId ?? raw.group_id ?? null,
    questionType: String(raw.questionType || raw.question_type || "short_answer"),
    questionText: String(raw.questionText ?? raw.question_text ?? ""),
    selectionMode: selectionMode === "multiple" ? "multiple" : "single",
    maxSelections,
    isMultiChoice: selectionMode === "multiple",
    options: parsedOptions,
    correctAnswer:
      raw.correctAnswer !== undefined
        ? raw.correctAnswer
        : raw.correct_answer !== undefined
        ? raw.correct_answer
        : null,
    correct_answer:
      raw.correct_answer !== undefined
        ? raw.correct_answer
        : raw.correctAnswer !== undefined
        ? raw.correctAnswer
        : null,
    answerKey: raw.answerKey !== undefined ? raw.answerKey : raw.answer_key !== undefined ? raw.answer_key : undefined,
    answer_key: raw.answer_key !== undefined ? raw.answer_key : raw.answerKey !== undefined ? raw.answerKey : undefined,
    fillBlankAnswers,
    audioUrl: raw.audioUrl ?? raw.audio_url ?? null,
    points: typeof raw.points === "number" ? raw.points : 1,
    orderIndex: typeof (raw.orderIndex ?? raw.order_index) === "number" ? (raw.orderIndex ?? raw.order_index) : 0,
    explanation: raw.explanation ?? null,
    hint: raw.hint ?? null,
    instruction: raw.instruction ?? null,
  };

  const parseResult = CanonicalQuestionSchema.safeParse(candidate);
  if (!parseResult.success) {
    console.error("[CONTRACT_VIOLATION] Question schema parsing error:", parseResult.error.format());
    return candidate as QuestionDTO;
  }

  return parseResult.data;
}
