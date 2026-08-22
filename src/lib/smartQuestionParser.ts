/**
 * Smart Question Parser for Bulk Import
 * Parses raw text containing numbered questions, multiple-choice options (A, B, C, D),
 * answer keys, and auto-detects question types.
 */

export interface ParsedQuestionItem {
  questionNumber?: number | string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string | null;
  points: number;
  rawText?: string;
}

export interface ParseOptions {
  fallbackType?: string; // "auto" | "short_answer" | "multiple_choice" | "essay" | "speaking" | etc.
  sectionType?: string;  // "listening" | "reading" | "writing" | "speaking" | "general"
}

// Regex to detect question number starts at the beginning of a line
// Matches: "1. ", "1) ", "1: ", "1 - ", "Câu 1: ", "Câu 1. ", "Question 1: ", "Q1. ", "(1) ", "[1] "
const QUESTION_START_REGEX = /^\s*(?:(?:[Cc]âu|[Qq]uestion|[Qq]|[Bb]ài)\s*(\d+)[\.\:\-\)\s]+|(\d+)[\.\:\-\)]\s*|\((\d+)\)\s*|\[(\d+)\]\s*)/;

// Regex to detect standalone option lines
// Matches: "A. text", "a) text", "*A. text", "(A) text", "[A] text", "a/ text", "a: text"
const OPTION_LINE_REGEX = /^\s*(\*|\[x\]|\(v\)|\[v\])?\s*(?:\(?([a-hA-H])\)|\b([a-hA-H])[\.\:\-\)\/]|\[([a-hA-H])\])\s*(.*)$/;

// Regex to detect answer keys
// Matches: "Đáp án: C", "Answer: C", "Key: B", "Ans: A", "-> C", "=> C"
const ANSWER_KEY_REGEX = /^\s*(?:(?:[Đđ]áp\s*án(?:\s*là|\s*đúng)?|[Aa]nswer(?:\s*key)?|[Kk]ey|[Aa]ns)[\s\:\-\=]+|->|=>)\s*(.+)$/i;

// Inline options detector (e.g. "A. apple  B. banana  C. cherry  D. date")
const INLINE_OPTION_SPLIT_REGEX = /(?:^|\s{2,}|\t|\s+)(?:\(?([A-Ha-h])\)|\b([A-Ha-h])[\.\:\-\)\/]|\[([A-Ha-h])\])\s*([^\n]+?)(?=(?:\s{2,}|\t|\s+)(?:\(?[A-Ha-h]\)|[A-Ha-h][\.\:\-\)\/]|\[[A-Ha-h]\])|$)/g;

/**
 * Strips leading numbering (e.g., "1. ", "Câu 2: ") from question text.
 */
function cleanQuestionPrompt(text: string): string {
  return text.replace(QUESTION_START_REGEX, "").trim();
}

/**
 * Checks if a line is an inline option container (e.g. has 2+ options on the same line).
 */
function extractInlineOptions(line: string): { prompt: string; options: Array<{ label: string; text: string; isCorrect: boolean }> } | null {
  const matches = Array.from(line.matchAll(INLINE_OPTION_SPLIT_REGEX));
  if (matches.length >= 2) {
    const firstMatchIndex = matches[0].index ?? 0;
    const prompt = line.slice(0, firstMatchIndex).trim();
    const options = matches.map((m) => {
      const label = (m[1] || m[2] || m[3] || "").toUpperCase();
      let optText = (m[4] || "").trim();
      let isCorrect = false;

      if (optText.startsWith("*") || optText.endsWith("*")) {
        isCorrect = true;
        optText = optText.replace(/^\*|\*$/g, "").trim();
      }

      return { label, text: optText, isCorrect };
    });

    return { prompt, options };
  }
  return null;
}

/**
 * Auto-detect question type based on options and section context
 */
function determineQuestionType(
  options: string[] | null,
  optionsCount: number,
  fallbackType: string = "auto",
  sectionType?: string
): string {
  if (fallbackType && fallbackType !== "auto") {
    return fallbackType;
  }

  if (options && optionsCount >= 2) {
    const upperOpts = options.map((o) => o.trim().toUpperCase());
    const isTfng = upperOpts.every((o) => ["TRUE", "FALSE", "NOT GIVEN"].includes(o));
    const isYnng = upperOpts.every((o) => ["YES", "NO", "NOT GIVEN"].includes(o));

    if (isTfng) return "true_false_not_given";
    if (isYnng) return "yes_no_not_given";
    return "multiple_choice";
  }

  if (sectionType === "speaking") return "speaking";
  if (sectionType === "writing") return "essay";
  return "short_answer";
}

/**
 * Smart Question Parser
 */
export function parseSmartBulkQuestions(
  rawInput: string,
  options: ParseOptions = {}
): ParsedQuestionItem[] {
  if (!rawInput || !rawInput.trim()) {
    return [];
  }

  const { fallbackType = "auto", sectionType } = options;
  const normalizedText = rawInput.replace(/\r\n/g, "\n").trim();
  const rawLines = normalizedText.split("\n").map((l) => l.trim());

  // Strategy 1: Check if input has numbered questions (1., Câu 2:, Question 3, etc.)
  const hasNumberedQuestions = rawLines.some((l) => QUESTION_START_REGEX.test(l));

  const questionBlocks: Array<{
    number?: number | string;
    lines: string[];
  }> = [];

  if (hasNumberedQuestions) {
    let currentBlock: { number?: number | string; lines: string[] } | null = null;

    for (const line of rawLines) {
      if (!line) continue;

      const numMatch = line.match(QUESTION_START_REGEX);
      if (numMatch) {
        if (currentBlock) {
          questionBlocks.push(currentBlock);
        }
        const num = numMatch[1] || numMatch[2] || numMatch[3] || numMatch[4] || "";
        currentBlock = {
          number: num ? parseInt(num, 10) || num : undefined,
          lines: [line],
        };
      } else {
        if (currentBlock) {
          currentBlock.lines.push(line);
        } else {
          // Lines before the first numbered question
          currentBlock = { lines: [line] };
        }
      }
    }

    if (currentBlock && currentBlock.lines.length > 0) {
      questionBlocks.push(currentBlock);
    }
  } else {
    // Strategy 2: No numbers. Check if there are option lines (A., B., C., D.)
    const hasOptionLines = rawLines.some((l) => OPTION_LINE_REGEX.test(l));

    if (hasOptionLines) {
      let currentLines: string[] = [];
      let inOptions = false;

      for (const line of rawLines) {
        if (!line) {
          if (currentLines.length > 0) {
            questionBlocks.push({ lines: currentLines });
            currentLines = [];
            inOptions = false;
          }
          continue;
        }

        const isOpt = OPTION_LINE_REGEX.test(line);

        if (isOpt) {
          inOptions = true;
          currentLines.push(line);
        } else {
          // If we were already reading options and now encounter a new non-option line -> new question
          if (inOptions && currentLines.length > 0) {
            questionBlocks.push({ lines: currentLines });
            currentLines = [line];
            inOptions = false;
          } else {
            currentLines.push(line);
          }
        }
      }

      if (currentLines.length > 0) {
        questionBlocks.push({ lines: currentLines });
      }
    } else {
      // Strategy 3: Plain list of sentences/prompts
      const paragraphs = normalizedText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const items = paragraphs.length > 1 ? paragraphs : rawLines.filter(Boolean);

      for (const item of items) {
        questionBlocks.push({ lines: [item] });
      }
    }
  }

  // Process each question block into a Canonical parsed item
  const parsedItems: ParsedQuestionItem[] = [];

  for (let bIdx = 0; bIdx < questionBlocks.length; bIdx++) {
    const block = questionBlocks[bIdx];
    const promptLines: string[] = [];
    const detectedOptions: Array<{ label: string; text: string; isCorrect: boolean }> = [];
    let detectedAnswerKey: string | null = null;

    for (let lIdx = 0; lIdx < block.lines.length; lIdx++) {
      const line = block.lines[lIdx];
      if (!line) continue;

      // 1. Check for Answer key line (e.g. "Đáp án: C", "Answer: A")
      const ansMatch = line.match(ANSWER_KEY_REGEX);
      if (ansMatch) {
        detectedAnswerKey = ansMatch[1].trim();
        continue;
      }

      // 2. Check for Single option line (e.g. "A. Paris", "*B. London")
      const optMatch = line.match(OPTION_LINE_REGEX);
      if (optMatch) {
        const isMarked = !!optMatch[1];
        const label = (optMatch[2] || optMatch[3] || optMatch[4] || "").toUpperCase();
        let optText = (optMatch[5] || "").trim();

        if (optText.startsWith("*") || optText.endsWith("*")) {
          optText = optText.replace(/^\*|\*$/g, "").trim();
        }

        detectedOptions.push({
          label,
          text: optText,
          isCorrect: isMarked || line.includes("*"),
        });
        continue;
      }

      // 3. Check for Inline options (e.g. "A. eat  B. ate  C. have eaten  D. had eaten")
      const inlineRes = extractInlineOptions(line);
      if (inlineRes) {
        if (inlineRes.prompt) {
          promptLines.push(inlineRes.prompt);
        }
        for (const opt of inlineRes.options) {
          detectedOptions.push(opt);
        }
        continue;
      }

      // Otherwise, it's part of the question prompt
      promptLines.push(line);
    }

    let rawPrompt = promptLines.join("\n").trim();
    if (!rawPrompt && detectedOptions.length > 0) {
      rawPrompt = `Câu ${block.number || bIdx + 1}`;
    }

    const cleanedPrompt = cleanQuestionPrompt(rawPrompt);

    // Extract options list
    const optionsList = detectedOptions.length > 0 ? detectedOptions.map((o) => o.text) : null;

    // Resolve Correct Answer
    let resolvedCorrectAnswer: string | null = null;

    // Priority 1: Answer marked with asterisk or [x] in options
    const markedCorrect = detectedOptions.find((o) => o.isCorrect);
    if (markedCorrect) {
      resolvedCorrectAnswer = markedCorrect.text;
    } else if (detectedAnswerKey && detectedOptions.length > 0) {
      // Priority 2: Explicit "Đáp án: C" matching letter or text
      const cleanKey = detectedAnswerKey.replace(/^[\(\[\{]|[\)\]\}]$/g, "").trim();
      const upperKey = cleanKey.toUpperCase();

      // Check if key is a letter A/B/C/D
      if (/^[A-H]$/.test(upperKey)) {
        const charCode = upperKey.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        if (charCode >= 0 && charCode < detectedOptions.length) {
          resolvedCorrectAnswer = detectedOptions[charCode].text;
        } else {
          const matchedByLabel = detectedOptions.find((o) => o.label === upperKey);
          resolvedCorrectAnswer = matchedByLabel ? matchedByLabel.text : cleanKey;
        }
      } else {
        // Textual match (e.g. "have read")
        const matchedByText = detectedOptions.find(
          (o) => o.text.toLowerCase() === cleanKey.toLowerCase()
        );
        resolvedCorrectAnswer = matchedByText ? matchedByText.text : cleanKey;
      }
    } else if (detectedAnswerKey) {
      resolvedCorrectAnswer = detectedAnswerKey;
    }

    const qType = determineQuestionType(
      optionsList,
      detectedOptions.length,
      fallbackType,
      sectionType
    );

    if (cleanedPrompt || (optionsList && optionsList.length > 0)) {
      parsedItems.push({
        questionNumber: block.number || bIdx + 1,
        questionText: cleanedPrompt || rawPrompt,
        questionType: qType,
        options: optionsList,
        correctAnswer: resolvedCorrectAnswer,
        points: 1,
        rawText: block.lines.join("\n"),
      });
    }
  }

  return parsedItems;
}
