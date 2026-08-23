export type ErrorCategory = "CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR";

export interface SentenceFeedbackItem {
  sentenceIndex: number;
  originalSentence: string;
  category: ErrorCategory;
  tag: string;
  note: string;
  suggestedSentence?: string;
}

export interface StructuredFeedbackPayload {
  text?: string;
  primaryErrorCategory?: ErrorCategory | null;
  revisionRequired?: boolean;
  criteriaScores?: {
    taskResponse?: number | null;
    coherence?: number | null;
    lexical?: number | null;
    grammar?: number | null;
  } | null;
  sentenceFeedbacks?: SentenceFeedbackItem[];
  tabSwitchCount?: number;
}

export const PRESET_ERROR_TAGS: Record<ErrorCategory, string[]> = {
  GRAMMAR: [
    "Subject-Verb Agreement",
    "Tense / Aspect",
    "Preposition / Article",
    "Word Form",
    "Punctuation / Fragment",
    "Passive Voice / Inversion",
    "Relative Clause / Pronoun",
  ],
  EXPRESSION: [
    "Word Choice / Collocation",
    "Repetition / Redundancy",
    "Academic Tone / Register",
    "Awkward Phrasing",
    "Idiomatic Usage",
    "Spelling / Typo",
  ],
  STRUCTURE: [
    "Missing Transition / Linking",
    "Paragraph Organization",
    "Topic Sentence Clarity",
    "Run-on / Choppy Flow",
    "Cohesion Break",
    "Conclusion Incomplete",
  ],
  CONCEPT: [
    "Idea Off-topic",
    "Unclear Stance",
    "Insufficient Explanation",
    "Weak Supporting Example",
    "Logic Flaw / Contradiction",
    "Underdeveloped Argument",
  ],
};

export const CATEGORY_COLORS: Record<
  ErrorCategory,
  {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    highlightBg: string;
  }
> = {
  GRAMMAR: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-300 dark:border-rose-800",
    badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
    highlightBg: "bg-rose-100/80 hover:bg-rose-200/80 dark:bg-rose-900/40 dark:hover:bg-rose-900/60",
  },
  EXPRESSION: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-800",
    badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    highlightBg: "bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-900/40 dark:hover:bg-amber-900/60",
  },
  STRUCTURE: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-800",
    badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200",
    highlightBg: "bg-purple-100/80 hover:bg-purple-200/80 dark:bg-purple-900/40 dark:hover:bg-purple-900/60",
  },
  CONCEPT: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-800",
    badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    highlightBg: "bg-blue-100/80 hover:bg-blue-200/80 dark:bg-blue-900/40 dark:hover:bg-blue-900/60",
  },
};

/**
 * Splits essay raw text into distinct sentence units using punctuation delimiters
 * (. ? ! or multiple newlines) while preserving complete readability.
 */
export function segmentEssayIntoSentences(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  // Match sentences ending with . ! ? followed by space/newline or end of text
  // Also preserve paragraph breaks as separate sentences if non-empty
  const rawSegments = text
    .split(/(?<=[.?!])\s+|\n{2,}/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSegments.length === 0 && text.trim().length > 0) {
    return [text.trim()];
  }

  return rawSegments;
}

/**
 * Safely parses structured feedback from raw string (plain text or JSON string)
 */
export function parseStructuredFeedback(rawFeedback: string | null | undefined): StructuredFeedbackPayload {
  if (!rawFeedback) {
    return { sentenceFeedbacks: [] };
  }

  try {
    const parsed = JSON.parse(rawFeedback);
    if (parsed && typeof parsed === "object") {
      return {
        text: typeof parsed.text === "string" ? parsed.text : (typeof parsed.feedback === "string" ? parsed.feedback : ""),
        primaryErrorCategory: parsed.primaryErrorCategory || null,
        revisionRequired: !!parsed.revisionRequired,
        criteriaScores: parsed.criteriaScores || null,
        sentenceFeedbacks: Array.isArray(parsed.sentenceFeedbacks) ? parsed.sentenceFeedbacks : [],
        tabSwitchCount: typeof parsed.tabSwitchCount === "number" ? parsed.tabSwitchCount : 0,
      };
    }
  } catch {
    // If not JSON, it is raw string text
  }

  return {
    text: rawFeedback,
    sentenceFeedbacks: [],
  };
}

/**
 * Serializes structured feedback payload to clean JSON string
 */
export function serializeStructuredFeedback(payload: StructuredFeedbackPayload): string {
  return JSON.stringify({
    text: payload.text || "",
    primaryErrorCategory: payload.primaryErrorCategory || null,
    revisionRequired: !!payload.revisionRequired,
    criteriaScores: payload.criteriaScores || null,
    sentenceFeedbacks: payload.sentenceFeedbacks || [],
    tabSwitchCount: payload.tabSwitchCount || 0,
  });
}
