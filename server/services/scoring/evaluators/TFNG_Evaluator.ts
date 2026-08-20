import {
  IQuestionEvaluator,
  ITextNormalizer,
  QuestionEvaluationResult,
  ScoringQuestion,
  StudentRawAnswer,
} from "../types.js";

export class TFNG_Evaluator implements IQuestionEvaluator {
  public supportedTypes = [
    "true_false_not_given",
    "yes_no_not_given",
    "tfng",
    "ynng",
    "true_false",
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

    if (!rawCorrect || rawStudent === null || rawStudent === undefined || rawStudent === "") {
      return {
        questionId: question.id,
        questionType: question.questionType,
        isManual: false,
        isCorrect: false,
        score: 0,
        maxScore: defaultPoints,
        correctCount: 0,
        itemCount: 1,
      };
    }

    const canonicalCorrect = this.toCanonicalToken(rawCorrect);
    const canonicalStudent = this.toCanonicalToken(rawStudent);

    const isMatch =
      canonicalCorrect !== "" &&
      canonicalStudent !== "" &&
      canonicalCorrect === canonicalStudent;

    return {
      questionId: question.id,
      questionType: question.questionType,
      isManual: false,
      isCorrect: isMatch,
      score: isMatch ? defaultPoints : 0,
      maxScore: defaultPoints,
      correctCount: isMatch ? 1 : 0,
      itemCount: 1,
      details: [
        {
          key: "0",
          studentValue: rawStudent,
          correctValue: rawCorrect,
          isCorrect: isMatch,
          score: isMatch ? defaultPoints : 0,
        },
      ],
    };
  }

  private toCanonicalToken(raw: unknown): string {
    if (raw === null || raw === undefined) return "";
    let str = String(raw).trim().toUpperCase().replace(/[\s_]+/g, " ");

    if (str === "T" || str === "TRUE") return "TRUE";
    if (str === "F" || str === "FALSE") return "FALSE";
    if (str === "NG" || str === "NOT GIVEN" || str === "NOTGIVEN") return "NOT GIVEN";
    if (str === "Y" || str === "YES") return "YES";
    if (str === "N" || str === "NO") return "NO";

    return str;
  }
}
