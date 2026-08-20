export class MatchingEvaluator {
    supportedTypes = [
        "matching",
        "matrix_matching",
        "pair_matching",
        "matching_features",
        "matching_headings",
    ];
    canEvaluate(questionType) {
        return this.supportedTypes.includes(questionType?.toLowerCase());
    }
    evaluate(question, studentAnswer, normalizer) {
        const rawCorrect = (question.correctAnswer || "").trim();
        const rawStudent = studentAnswer?.answerText;
        const defaultPoints = question.points && question.points > 0 ? question.points : 1;
        let targetPairs = {};
        const parsedCorrect = normalizer.parseJsonSafe(rawCorrect, null);
        if (parsedCorrect && typeof parsedCorrect === "object") {
            targetPairs = parsedCorrect.pairs || parsedCorrect;
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
        let studentPairs = {};
        if (rawStudent && typeof rawStudent === "object") {
            studentPairs = rawStudent.pairs || rawStudent;
        }
        else if (typeof rawStudent === "string" && rawStudent.trim()) {
            const parsed = normalizer.parseJsonSafe(rawStudent, {});
            studentPairs = parsed.pairs || parsed;
        }
        const maxScore = defaultPoints >= pairsCount ? defaultPoints : pairsCount;
        const pointPerPair = maxScore / pairsCount;
        let correctPairs = 0;
        const details = [];
        for (const key of pairKeys) {
            const expectedVal = targetPairs[key];
            const actualVal = studentPairs[key];
            let isPairMatch = false;
            const expectedIdx = normalizer.normalizeOptionIndex(expectedVal);
            const actualIdx = normalizer.normalizeOptionIndex(actualVal);
            if (expectedIdx !== null && actualIdx !== null) {
                isPairMatch = expectedIdx === actualIdx;
            }
            else {
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
