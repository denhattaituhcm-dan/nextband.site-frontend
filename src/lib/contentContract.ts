/**
 * Content Contract & Lifecycle Engine — IELTS NextBand
 * Evaluates static data integrity for exam content before rendering.
 */

export type ContentLifecycleStatus = "READY" | "INVALID" | "PROCESSING" | "ARCHIVED";

export interface ContractViolation {
  ruleId: string;
  sectionId?: string;
  questionId?: string;
  message: string;
  severity: "CRITICAL" | "WARNING";
}

export interface ContractEvaluationResult {
  status: ContentLifecycleStatus;
  isReady: boolean;
  violations: ContractViolation[];
}

const INVALID_PLACEHOLDERS = [
  "question item",
  "null",
  "lorem ipsum",
  "sample text",
  "todo",
  "placeholder",
];

/**
 * Validates text string for forbidden placeholder keywords
 */
export function isPlaceholderText(text: string | null | undefined): boolean {
  if (!text) return true;
  const normalized = text.trim().toLowerCase();
  if (normalized.length === 0) return true;
  return INVALID_PLACEHOLDERS.some((p) => normalized === p || normalized.startsWith(p));
}

/**
 * Evaluates static Content Contract rules for an exam object
 */
export function evaluateContentContract(exam: any): ContractEvaluationResult {
  const violations: ContractViolation[] = [];

  if (!exam) {
    return {
      status: "INVALID",
      isReady: false,
      violations: [
        {
          ruleId: "EXAM_MISSING",
          message: "Dữ liệu bài thi không tồn tại",
          severity: "CRITICAL",
        },
      ],
    };
  }

  // Check Archived State
  if (exam.isArchived || exam.status === "archived") {
    return {
      status: "ARCHIVED",
      isReady: false,
      violations: [],
    };
  }

  // Check Processing State
  if (exam.isProcessing || exam.status === "processing") {
    return {
      status: "PROCESSING",
      isReady: false,
      violations: [],
    };
  }

  const sections = exam.sections || [];
  if (sections.length === 0) {
    violations.push({
      ruleId: "NO_SECTIONS",
      message: "Bài thi chưa được cấu hình các phần thi (sections)",
      severity: "CRITICAL",
    });
  }

  sections.forEach((sec: any) => {
    const groups = sec.questionGroups || sec.question_groups || [];

    if (sec.sectionType === "listening" || sec.section_type === "listening") {
      const hasAudio =
        Boolean(sec.audioUrl || sec.audio_url) ||
        groups.some((g: any) => Boolean(g.audioUrl || g.audio_url));
      if (!hasAudio && groups.length > 0) {
        violations.push({
          ruleId: "LISTENING_MISSING_AUDIO",
          sectionId: sec.id,
          message: `Phần thi Listening '${sec.title || "Listening"}' chưa có file audio`,
          severity: "CRITICAL",
        });
      }
    }

    if (sec.sectionType === "reading" || sec.section_type === "reading") {
      const hasPassage = groups.some(
        (g: any) => Boolean(g.passage) && g.passage.trim().length >= 20,
      );
      if (!hasPassage && groups.length > 0) {
        violations.push({
          ruleId: "READING_MISSING_PASSAGE",
          sectionId: sec.id,
          message: `Phần thi Reading '${sec.title || "Reading"}' chưa có đoạn văn bài đọc`,
          severity: "CRITICAL",
        });
      }
    }

    groups.forEach((group: any) => {
      const questions = group.questions || [];
      questions.forEach((q: any) => {
        const qText = q.questionText || q.question_text || "";

        if (isPlaceholderText(qText)) {
          violations.push({
            ruleId: "QUESTION_TEXT_PLACEHOLDER",
            sectionId: sec.id,
            questionId: q.id,
            message: `Câu hỏi [ID: ${q.id}] chứa văn bản rác hoặc placeholder '${qText}'`,
            severity: "CRITICAL",
          });
        }
      });
    });
  });

  const isCritical = violations.some((v) => v.severity === "CRITICAL");
  const status: ContentLifecycleStatus = isCritical ? "INVALID" : "READY";

  return {
    status,
    isReady: status === "READY",
    violations,
  };
}
