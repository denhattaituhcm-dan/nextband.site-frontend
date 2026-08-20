export class AnswerResolver {
    /**
     * Extracts and flattens all questions from exam structure and pairs them with student answers
     */
    resolve(examStructure, studentAnswers) {
        const flattenedQuestions = [];
        const sections = examStructure?.sections || [];
        for (const section of sections) {
            const groups = section.questionGroups || [];
            for (const group of groups) {
                const questions = group.questions || [];
                for (const q of questions) {
                    // Normalize options
                    let normalizedOptions = q.options;
                    if (typeof q.options === "string") {
                        try {
                            normalizedOptions = JSON.parse(q.options);
                        }
                        catch {
                            normalizedOptions = [];
                        }
                    }
                    // Calculate selection mode & maxSelections
                    const rawCorrect = String(q.correctAnswer || q.correct_answer || "");
                    const correctCount = rawCorrect.split("|").filter((p) => p.trim()).length;
                    const isMultiChoice = q.questionType === "multiple_choice_multi" ||
                        q.selectionMode === "multiple" ||
                        Boolean(q.isMultiChoice) ||
                        (q.questionType === "multiple_choice" && correctCount > 1);
                    const selectionMode = isMultiChoice ? "multiple" : "single";
                    const maxSelections = isMultiChoice ? Math.max(2, correctCount) : 1;
                    flattenedQuestions.push({
                        id: q.id,
                        questionType: q.questionType || q.question_type || "multiple_choice",
                        questionText: q.questionText || q.question_text || "",
                        options: Array.isArray(normalizedOptions) ? normalizedOptions : [],
                        correctAnswer: rawCorrect,
                        points: q.points !== undefined && q.points !== null ? Number(q.points) : 1,
                        orderIndex: q.orderIndex || q.order_index || 0,
                        selectionMode,
                        maxSelections,
                    });
                }
            }
        }
        const answerMap = new Map();
        const rawAnswerList = [];
        if (Array.isArray(studentAnswers)) {
            for (const a of studentAnswers) {
                if (!a || !a.questionId)
                    continue;
                const normalizedItem = {
                    questionId: a.questionId,
                    answerText: a.answerText !== undefined ? a.answerText : null,
                    audioUrl: a.audioUrl || null,
                };
                answerMap.set(a.questionId, normalizedItem);
                rawAnswerList.push(normalizedItem);
            }
        }
        return {
            questions: flattenedQuestions,
            answerMap,
            rawAnswerList,
        };
    }
}
