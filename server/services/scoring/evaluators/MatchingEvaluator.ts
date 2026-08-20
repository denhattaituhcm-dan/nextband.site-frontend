import {
  IQuestionEvaluator,
  ItemEvaluationDetail,
  ITextNormalizer,
  QuestionEvaluationResult,
  ScoringQuestion,
  StudentRawAnswer,
} from "../types.js";

export class MatchingEvaluator implements IQuestionEvaluator {
  public supportedTypes = [
    "matching",
    "matrix_matching",
    "pair_matching",
    "matching_features",
    "matching_headings",
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

    let targetPairs: Record<string, any> = {};
    const parsedCorrect = normalizer.parseJsonSafe(rawCorrect, null);

    if (parsedCorrect && typeof parsedCorrect === "object") {
      targetPairs = (parsedCorrect as any).pairs || parsedCorrect;
    }

    const pairKeys = Object.keys(targetPairs);
    const pairsCount = pairKeys.length;

    // Fallback if not JSON
    if (pairsCount === 0) {
      const isMatch = normalizer.areEquivalent(rawStudent, rawCorrect);
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: isMatch,
        score: isMatch ? defaultPoints : 0,
        maxScore: defaultPoints,
        correctCount: isMatch ? 1 : 0,
        itemCount: 1,
      };
    }

    // Parse student pairs
    let studentPairs: Record<string, any> = {};
    if (rawStudent && typeof rawStudent === "object") {
      studentPairs = (rawStudent as any).pairs || rawStudent;
    } else if (typeof rawStudent === "string" && rawStudent.trim()) {
      const parsed = normalizer.parseJsonSafe(rawStudent, {});
      studentPairs = (parsed as any).pairs || parsed;
    }

    const maxScore = defaultPoints >= pairsCount ? defaultPoints : pairsCount;
    const pointPerPair = maxScore / pairsCount;

    let correctPairs = 0;
    const details: ItemEvaluationDetail[] = [];

    for (const key of pairKeys) {
      const expectedVal = targetPairs[key];
      const actualVal = studentPairs[key];

      let isPairMatch = false;

      const expectedIdx = normalizer.normalizeOptionIndex(expectedVal);
      const actualIdx = normalizer.normalizeOptionIndex(actualVal);

      if (expectedIdx !== null && actualIdx !== null) {
        isPairMatch = expectedIdx === actualIdx;
      } else {
        isPairMatch = normalizer.areEquivalent(actualVal, expectedVal);
      }

      if (isPairMatch) {
        correctPairs++;
      }

      details.push({
        key,
        studentValue: actualVal,
        correctValue: expectedVal,
        isCorrect: isPairMatch,
        score: isPairMatch ? pointPerPair : 0,
      });
    }

    const finalScore = correctPairs * pointPerPair;

    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: correctPairs === pairsCount,
      score: finalScore,
      maxScore,
      correctCount: correctPairs,
      itemCount: pairsCount,
      details,
    };
  }
}
