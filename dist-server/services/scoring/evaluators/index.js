import { MultipleChoiceEvaluator } from "./MultipleChoiceEvaluator.js";
import { FillBlankEvaluator } from "./FillBlankEvaluator.js";
import { MatchingEvaluator } from "./MatchingEvaluator.js";
import { TFNG_Evaluator } from "./TFNG_Evaluator.js";
import { ManualEvaluator } from "./ManualEvaluator.js";
export const EVALUATORS = [
    new MultipleChoiceEvaluator(),
    new FillBlankEvaluator(),
    new MatchingEvaluator(),
    new TFNG_Evaluator(),
    new ManualEvaluator(),
];
const fallbackEvaluator = new FillBlankEvaluator();
export function getEvaluatorForType(questionType) {
    const normalizedType = (questionType || "").toLowerCase();
    for (const evaluator of EVALUATORS) {
        if (evaluator.canEvaluate(normalizedType)) {
            return evaluator;
        }
    }
    return fallbackEvaluator;
}
export { MultipleChoiceEvaluator, FillBlankEvaluator, MatchingEvaluator, TFNG_Evaluator, ManualEvaluator, };
