export type CanonicalQuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "short_answer"
  | "true_false_not_given"
  | "yes_no_not_given"
  | "matching"
  | "essay"
  | "speaking"
  | "listening";

export interface CanonicalQuestionDTO {
  id: string;
  groupId?: string;
  questionType: CanonicalQuestionType;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  points?: number;
  orderIndex?: number;
  audioUrl?: string | null;
  imageUrl?: string | null;
  isSubQuestion?: boolean;
  subIndex?: string;
  focusId?: string;
  displayNumber?: number;
  displayLabel?: string;
}

export function isValidMCQOptions(options: any): boolean {
  if (!Array.isArray(options)) return false;
  const meaningful = options.filter(
    (o) => typeof o === "string" && o.trim().length > 0,
  );
  return meaningful.length >= 2;
}

export function sanitizeQuestionPayload(form: {
  questionType: string;
  questionText: string;
  options?: any;
  correctAnswer?: string | null;
  fillBlankAnswers?: string[];
  points?: number;
  audioUrl?: string;
  orderIndex?: number;
}): {
  questionType: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  audioUrl?: string;
  orderIndex?: number;
} {
  const type = (form.questionType || "short_answer") as CanonicalQuestionType;
  const text = form.questionText || "";
  const points = typeof form.points === "number" ? form.points : 1;
  const audioUrl = form.audioUrl || undefined;
  const orderIndex = form.orderIndex;

  let sanitizedOptions: string[] | null = null;
  let sanitizedCorrectAnswer: string | null = form.correctAnswer?.trim() || null;

  switch (type) {
    case "multiple_choice": {
      if (Array.isArray(form.options)) {
        const cleaned = form.options
          .map((o) => (typeof o === "string" ? o.trim() : ""))
          .filter(Boolean);
        sanitizedOptions = cleaned.length > 0 ? cleaned : null;
      }
      break;
    }
    case "short_answer":
    case "essay":
    case "speaking": {
      sanitizedOptions = null;
      break;
    }
    case "fill_blank": {
      sanitizedOptions = null;
      break;
    }
    case "matching": {
      sanitizedOptions = null;
      break;
    }
    case "true_false_not_given":
    case "yes_no_not_given": {
      sanitizedOptions = null;
      if (sanitizedCorrectAnswer) {
        sanitizedCorrectAnswer = sanitizedCorrectAnswer.toUpperCase();
      }
      break;
    }
    default:
      sanitizedOptions = null;
  }

  return {
    questionType: type,
    questionText: text,
    options: sanitizedOptions,
    correctAnswer: sanitizedCorrectAnswer,
    points,
    audioUrl,
    orderIndex,
  };
}

export function normalizeQuestion(raw: any): CanonicalQuestionDTO {
  const questionType: CanonicalQuestionType =
    raw.questionType || raw.question_type || "short_answer";

  let options: string[] | null = null;
  if (raw.options) {
    if (Array.isArray(raw.options)) {
      options = raw.options;
    } else if (typeof raw.options === "string") {
      try {
        const parsed = JSON.parse(raw.options);
        if (Array.isArray(parsed)) options = parsed;
      } catch {
        options = null;
      }
    }
  }

  // Sanitize dummy options in non-MCQ
  if (
    questionType !== "multiple_choice" &&
    questionType !== "listening"
  ) {
    options = null;
  }

  return {
    id: raw.id || "",
    groupId: raw.groupId || raw.group_id || "",
    questionType,
    questionText: raw.questionText || raw.question_text || "",
    options,
    correctAnswer: raw.correctAnswer || raw.correct_answer || null,
    points: raw.points ?? 1,
    orderIndex: raw.orderIndex ?? raw.order_index ?? 0,
    audioUrl: raw.audioUrl || raw.audio_url || null,
    imageUrl: raw.imageUrl || raw.image_url || null,
  };
}
