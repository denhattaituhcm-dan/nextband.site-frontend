import { defaultTextNormalizer } from "./TextNormalizer.js";
import { AnswerResolver } from "./AnswerResolver.js";
import { getEvaluatorForType } from "./evaluators/index.js";
import { ScoreAggregator } from "./ScoreAggregator.js";
import { ResultBuilder } from "./ResultBuilder.js";
export class CanonicalScoringService {
    normalizer;
    resolver;
    aggregator;
    resultBuilder;
    constructor(normalizer) {
        this.normalizer = normalizer || defaultTextNormalizer;
        this.resolver = new AnswerResolver();
        this.aggregator = new ScoreAggregator();
        this.resultBuilder = new ResultBuilder();
    }
    /**
     * Evaluates an entire exam attempt against canonical IELTS scoring rules
     */
    evaluateExamAttempt(examStructure, studentAnswers) {
        const { questions, answerMap } = this.resolver.resolve(examStructure, studentAnswers);
        const evaluations = questions.map((q) => {
            const studentAns = answerMap.get(q.id);
            const evaluator = getEvaluatorForType(q.questionType);
            return evaluator.evaluate(q, studentAns, this.normalizer);
        });
        return this.aggregator.aggregate(evaluations);
    }
    getResultBuilder() {
        return this.resultBuilder;
    }
    getNormalizer() {
        return this.normalizer;
    }
}
export const canonicalScoringService = new CanonicalScoringService();
