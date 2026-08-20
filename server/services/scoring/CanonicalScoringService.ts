import { ITextNormalizer, SubmissionGradingSummary } from "./types.js";
import { defaultTextNormalizer } from "./TextNormalizer.js";
import { AnswerResolver } from "./AnswerResolver.js";
import { getEvaluatorForType } from "./evaluators/index.js";
import { ScoreAggregator } from "./ScoreAggregator.js";
import { ResultBuilder } from "./ResultBuilder.js";

export class CanonicalScoringService {
  private normalizer: ITextNormalizer;
  private resolver: AnswerResolver;
  private aggregator: ScoreAggregator;
  private resultBuilder: ResultBuilder;

  constructor(normalizer?: ITextNormalizer) {
    this.normalizer = normalizer || defaultTextNormalizer;
    this.resolver = new AnswerResolver();
    this.aggregator = new ScoreAggregator();
    this.resultBuilder = new ResultBuilder();
  }

  /**
   * Evaluates an entire exam attempt against canonical IELTS scoring rules
   */
  public evaluateExamAttempt(
    examStructure: any,
    studentAnswers: Array<{ questionId: string; answerText?: any; audioUrl?: string | null }>,
  ): SubmissionGradingSummary {
    const { questions, answerMap } = this.resolver.resolve(examStructure, studentAnswers);

    const evaluations = questions.map((q) => {
      const studentAns = answerMap.get(q.id);
      const evaluator = getEvaluatorForType(q.questionType);
      return evaluator.evaluate(q, studentAns, this.normalizer);
    });

    return this.aggregator.aggregate(evaluations);
  }

  public getResultBuilder(): ResultBuilder {
    return this.resultBuilder;
  }

  public getNormalizer(): ITextNormalizer {
    return this.normalizer;
  }
}

export const canonicalScoringService = new CanonicalScoringService();
