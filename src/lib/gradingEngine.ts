/**
 * Canonical IELTS Objective Grading Engine
 * Evaluates student answers against correct answers for all objective question types.
 */

export const OBJECTIVE_TYPES = new Set([
  "multiple_choice",
  "fill_blank",
  "matching",
  "listening",
  "short_answer",
  "true_false_not_given",
  "yes_no_not_given",
]);

export const MANUAL_TYPES = new Set([
  "essay",
  "writing",
  "speaking",
]);

/**
 * Converts option representation (e.g. 'A', 'B', 0, 1, '1') to a 0-based integer index
 */
export function convertOptionValToIndex(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^[A-Za-z]$/.test(trimmed)) {
      return trimmed.toUpperCase().charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
    }
  }
  return null;
}

export interface QuestionForGrading {
  id: string;
  questionType: string;
  correctAnswer?: string | null;
  points?: number | null;
}

export interface StudentAnswerItem {
  questionId: string;
  answerText?: string | null;
  audioUrl?: string | null;
}

export interface SingleGradingResult {
  questionId: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  isManual: boolean;
}

export interface SubmissionGradingSummary {
  correctAnswers: number;
  totalQuestions: number;
  totalScore: number;
  hasManualQuestions: boolean;
  gradedAnswers: SingleGradingResult[];
}

/**
 * Grades a single objective question
 */
export function gradeSingleQuestion(
  question: QuestionForGrading,
  studentAnswer?: StudentAnswerItem
): SingleGradingResult {
  const type = question.questionType?.toLowerCase() || "";

  // 1. Manual question types or unknown types (Fail-safe)
  if (MANUAL_TYPES.has(type) || !OBJECTIVE_TYPES.has(type)) {
    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points || 1,
      isCorrect: false,
      isManual: true,
    };
  }

  const rawCorrect = question.correctAnswer?.trim() || "";
  const rawStudent = studentAnswer?.answerText?.trim() || "";

  if (!rawCorrect) {
    return {
      questionId: question.id,
      score: 0,
      maxScore: question.points || 1,
      isCorrect: false,
      isManual: false,
    };
  }

  // 2. Fill Blank (supports JSON { "0": "ans1", "1": "ans2" } and multiple alternatives separated by |)
  if (type === "fill_blank") {
    try {
      const parsedCorrect = JSON.parse(rawCorrect);
      if (typeof parsedCorrect === "object" && parsedCorrect !== null) {
        const keys = Object.keys(parsedCorrect);
        const blankCount = keys.length;

        if (blankCount > 0) {
          let parsedStudent: Record<string, string> = {};
          try {
            parsedStudent = JSON.parse(rawStudent);
          } catch {
            // Student might have entered plain string for blank 0
            if (rawStudent) parsedStudent = { "0": rawStudent };
          }

          let correctBlanks = 0;
          for (const key of keys) {
            const correctVal = String(parsedCorrect[key] || "").trim();
            const studentVal = String(parsedStudent[key] || "").trim();
            const alternatives = correctVal
              .split("|")
              .map((a) => a.trim().toLowerCase());

            if (studentVal && alternatives.includes(studentVal.toLowerCase())) {
              correctBlanks++;
            }
          }

          return {
            questionId: question.id,
            score: correctBlanks,
            maxScore: blankCount,
            isCorrect: correctBlanks === blankCount,
            isManual: false,
          };
        }
      }
    } catch {
      // Plain text fallback
    }

    // Single blank string comparison
    const alternatives = rawCorrect.split("|").map((a) => a.trim().toLowerCase());
    const isMatch = !!rawStudent && alternatives.includes(rawStudent.toLowerCase());
    return {
      questionId: question.id,
      score: isMatch ? (question.points || 1) : 0,
      maxScore: question.points || 1,
      isCorrect: isMatch,
      isManual: false,
    };
  }

  // 3. Matching (supports JSON { pairs: { "0": 1, "1": 3 } } or JSON map)
  if (type === "matching") {
    try {
      const parsedCorrect = JSON.parse(rawCorrect);
      let targetPairs: Record<string, any> = {};

      if (parsedCorrect && typeof parsedCorrect === "object") {
        targetPairs = parsedCorrect.pairs || parsedCorrect;
      }

      const keys = Object.keys(targetPairs);
      const pairsCount = keys.length;

      if (pairsCount > 0) {
        let parsedStudent: Record<string, any> = {};
        try {
          parsedStudent = JSON.parse(rawStudent);
        } catch {
          // If not valid JSON, cannot match
        }

        let correctPairs = 0;
        for (const key of keys) {
          const correctIdx = convertOptionValToIndex(targetPairs[key]);
          const studentIdx = convertOptionValToIndex(parsedStudent[key]);

          if (correctIdx !== null && studentIdx !== null && correctIdx === studentIdx) {
            correctPairs++;
          }
        }

        return {
          questionId: question.id,
          score: correctPairs,
          maxScore: pairsCount,
          isCorrect: correctPairs === pairsCount,
          isManual: false,
        };
      }
    } catch {
      // Fall through to plain string comparison
    }
  }

  // 4. True/False/Not Given & Yes/No/Not Given
  if (type === "true_false_not_given" || type === "yes_no_not_given") {
    const isMatch = rawStudent.toUpperCase() === rawCorrect.toUpperCase();
    return {
      questionId: question.id,
      score: isMatch ? (question.points || 1) : 0,
      maxScore: question.points || 1,
      isCorrect: isMatch,
      isManual: false,
    };
  }

  // 5. Multiple Choice & Short Answer
  const alternatives = rawCorrect.split("|").map((a) => a.trim().toLowerCase());
  const isMatch = !!rawStudent && alternatives.includes(rawStudent.toLowerCase());

  return {
    questionId: question.id,
    score: isMatch ? (question.points || 1) : 0,
    maxScore: question.points || 1,
    isCorrect: isMatch,
    isManual: false,
  };
}

/**
 * Grades all questions in an exam attempt
 */
export function gradeAllExamQuestions(
  questions: QuestionForGrading[],
  studentAnswers: StudentAnswerItem[]
): SubmissionGradingSummary {
  const answerMap = new Map<string, StudentAnswerItem>(
    studentAnswers.map((a) => [a.questionId, a])
  );

  let totalCorrect = 0;
  let totalObjectiveQuestions = 0;
  let totalScore = 0;
  let hasManual = false;
  const results: SingleGradingResult[] = [];

  for (const q of questions) {
    const type = q.questionType?.toLowerCase() || "";
    if (MANUAL_TYPES.has(type) || !OBJECTIVE_TYPES.has(type)) {
      hasManual = true;
    }

    const ans = answerMap.get(q.id);
    const res = gradeSingleQuestion(q, ans);
    results.push(res);

    if (!res.isManual) {
      totalObjectiveQuestions += res.maxScore;
      totalCorrect += res.score;
      totalScore += res.score;
    }
  }

  return {
    correctAnswers: totalCorrect,
    totalQuestions: totalObjectiveQuestions,
    totalScore: totalScore,
    hasManualQuestions: hasManual,
    gradedAnswers: results,
  };
}
