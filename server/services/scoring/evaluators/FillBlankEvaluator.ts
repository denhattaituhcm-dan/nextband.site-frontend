import {
  IQuestionEvaluator,
  ItemEvaluationDetail,
  ITextNormalizer,
  QuestionEvaluationResult,
  ScoringQuestion,
  StudentRawAnswer,
} from "../types.js";

export class FillBlankEvaluator implements IQuestionEvaluator {
  public supportedTypes = [
    "fill_blank",
    "short_answer",
    "summary_completion",
    "sentence_completion",
    "listening_fill_blank",
    "reading_fill_blank",
  ];

  public canEvaluate(questionType: string): boolean {
    return this.supportedTypes.includes(questionType?.toLowerCase());
  }

  public evaluate(
    question: ScoringQuestion,
    studentAnswer: StudentRawAnswer | undefined,
    normalizer: ITextNormalizer,
  ): QuestionEvaluationResult {
    const rawCorrect = (question.correctAnswer || "").trim();
    const rawStudent = studentAnswer?.answerText;
    const defaultPoints = question.points && question.points > 0 ? question.points : 1;

    // Check if correct answer is a JSON object with multiple blanks
    let parsedCorrect: Record<string, unknown> | null = null;
    if (rawCorrect.startsWith("{") || rawCorrect.startsWith("[")) {
      parsedCorrect = normalizer.parseJsonSafe<Record<string, unknown> | null>(rawCorrect, null);
    }

    if (parsedCorrect && typeof parsedCorrect === "object" && !Array.isArray(parsedCorrect)) {
      return this.evaluateMultiBlank(question, parsedCorrect, rawStudent, defaultPoints, normalizer);
    }

    return this.evaluateSingleBlank(question, rawCorrect, rawStudent, defaultPoints, normalizer);
  }

  private evaluateSingleBlank(
    question: ScoringQuestion,
    rawCorrect: string,
    rawStudent: unknown,
    points: number,
    normalizer: ITextNormalizer,
  ): QuestionEvaluationResult {
    if (!rawCorrect || rawStudent === null || rawStudent === undefined || rawStudent === "") {
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: false,
        score: 0,
        maxScore: points,
        correctCount: 0,
        itemCount: 1,
      };
    }

    // Handle student sending JSON object or array for single blank
    let studentText = rawStudent;
    if (typeof rawStudent === "object" && rawStudent !== null) {
      if (Array.isArray(rawStudent)) {
        studentText = rawStudent[0] || "";
      } else {
        studentText = (rawStudent as Record<string, unknown>)["0"] || Object.values(rawStudent)[0] || "";
      }
    } else if (typeof rawStudent === "string" && (rawStudent.startsWith("{") || rawStudent.startsWith("["))) {
      const parsed = normalizer.parseJsonSafe<unknown>(rawStudent, null);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          studentText = parsed[0] || "";
        } else {
          studentText = (parsed as Record<string, unknown>)["0"] || Object.values(parsed)[0] || "";
        }
      }
    }

    const isMatch = normalizer.areEquivalent(studentText, rawCorrect);

    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: isMatch,
      score: isMatch ? points : 0,
      maxScore: points,
      correctCount: isMatch ? 1 : 0,
      itemCount: 1,
      details: [
        {
          key: "0",
          studentValue: studentText,
          correctValue: rawCorrect,
          isCorrect: isMatch,
          score: isMatch ? points : 0,
        },
      ],
    };
  }

  private evaluateMultiBlank(
    question: ScoringQuestion,
    correctMap: Record<string, unknown>,
    rawStudent: unknown,
    points: number,
    normalizer: ITextNormalizer,
  ): QuestionEvaluationResult {
    const blankKeys = Object.keys(correctMap).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
    });

    const blankCount = blankKeys.length;
    if (blankCount === 0) {
      return this.evaluateSingleBlank(question, "", rawStudent, points, normalizer);
    }

    // Parse student answer structure
    const studentMap: Record<string, unknown> = {};
    if (rawStudent && typeof rawStudent === "object") {
      if (Array.isArray(rawStudent)) {
        rawStudent.forEach((val: unknown, idx: number) => {
          studentMap[String(idx)] = val;
        });
      } else {
        Object.assign(studentMap, rawStudent);
      }
    } else if (typeof rawStudent === "string" && rawStudent.trim()) {
      const parsed = normalizer.parseJsonSafe<unknown>(rawStudent, null);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          parsed.forEach((val: unknown, idx: number) => {
            studentMap[String(idx)] = val;
          });
        } else {
          Object.assign(studentMap, parsed);
        }
      } else {
        // Plain string fallback mapped to first blank
        studentMap["0"] = rawStudent.trim();
      }
    }

    const maxScore = points >= blankCount ? points : blankCount;
    const pointPerBlank = maxScore / blankCount;

    let correctBlanks = 0;
    const details: ItemEvaluationDetail[] = [];

    for (const key of blankKeys) {
      const correctVal = correctMap[key];
      const studentVal = studentMap[key] !== undefined ? studentMap[key] : "";
      const isBlankCorrect = normalizer.areEquivalent(studentVal, correctVal);

      if (isBlankCorrect) {
        correctBlanks++;
      }

      details.push({
        key,
        studentValue: studentVal,
        correctValue: correctVal,
        isCorrect: isBlankCorrect,
        score: isBlankCorrect ? pointPerBlank : 0,
      });
    }

    const finalScore = correctBlanks * pointPerBlank;

    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: correctBlanks === blankCount,
      score: finalScore,
      maxScore: maxScore,
      correctCount: correctBlanks,
      itemCount: blankCount, // CRITICAL FIX: EXACTLY blankCount (N), never N + 1 or N + 2
      details,
    };
  }
}
