import { IeltsBandCalculator } from "./IeltsBandCalculator.js";
export class ScoreAggregator {
    /**
     * Aggregates individual question evaluations into a holistic submission grading summary
     */
    aggregate(evaluations) {
        let totalScore = 0;
        let maxScore = 0;
        let correctAnswers = 0;
        let totalQuestions = 0;
        let hasManualQuestions = false;
        for (const res of evaluations) {
            if (res.isManual) {
                hasManualQuestions = true;
                // Subjective questions (Writing/Speaking) don't count toward auto objective score initially
                totalQuestions += res.itemCount;
                maxScore += res.maxScore;
            }
            else {
                totalScore += res.score;
                maxScore += res.maxScore;
                correctAnswers += res.correctCount;
                totalQuestions += res.itemCount;
            }
        }
        // Round total score to 2 decimal places to avoid floating point precision artifacts
        const roundedTotalScore = Math.round(totalScore * 100) / 100;
        const percentage = maxScore > 0 ? Math.round((roundedTotalScore / maxScore) * 100) : 0;
        const status = hasManualQuestions ? "SUBMITTED" : "GRADED";
        const bandScore = IeltsBandCalculator.calculateEstimatedBand(percentage);
        return {
            totalScore: roundedTotalScore,
            maxScore,
            correctAnswers,
            totalQuestions,
            hasManualQuestions,
            status,
            percentage,
            bandScore,
            evaluatedAnswers: evaluations,
        };
    }
}
