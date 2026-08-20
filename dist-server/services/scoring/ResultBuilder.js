export class ResultBuilder {
    /**
     * Builds the database persistence payload for Prisma transaction
     */
    buildDatabasePersistencePayload(submissionId, summary, rawAnswers) {
        const submissionUpdate = {
            status: summary.status,
            submittedAt: new Date(),
            correctAnswers: summary.correctAnswers,
            totalQuestions: summary.totalQuestions,
            totalScore: summary.totalScore,
        };
        const answerMap = new Map(rawAnswers.map((a) => [a.questionId, a]));
        const answerUpdates = summary.evaluatedAnswers.map((evalRes) => {
            const rawAns = answerMap.get(evalRes.questionId);
            const answerTextVal = rawAns?.answerText !== undefined && rawAns?.answerText !== null
                ? typeof rawAns.answerText === "string"
                    ? rawAns.answerText
                    : JSON.stringify(rawAns.answerText)
                : null;
            return {
                questionId: evalRes.questionId,
                score: evalRes.isManual ? null : evalRes.score,
                isCorrect: evalRes.isManual ? null : evalRes.isCorrect,
                answerText: answerTextVal,
                audioUrl: rawAns?.audioUrl || null,
            };
        });
        return {
            submissionUpdate,
            answerUpdates,
        };
    }
    /**
     * Formats sanitized, safe official submission response for student/client
     */
    buildClientResponse(submissionId, summary) {
        return {
            id: submissionId,
            status: summary.status,
            submittedAt: new Date().toISOString(),
            correctAnswers: summary.correctAnswers,
            totalQuestions: summary.totalQuestions,
            totalScore: summary.totalScore,
            percentage: summary.percentage,
            hasManualQuestions: summary.hasManualQuestions,
        };
    }
}
