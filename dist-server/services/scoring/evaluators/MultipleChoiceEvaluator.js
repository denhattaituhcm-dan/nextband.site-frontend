export class MultipleChoiceEvaluator {
    supportedTypes = [
        "multiple_choice",
        "multiple_choice_multi",
        "listening_mcq",
        "reading_mcq",
    ];
    canEvaluate(questionType) {
        return this.supportedTypes.includes(questionType?.toLowerCase());
    }
    evaluate(question, studentAnswer, normalizer) {
        const rawCorrect = question.correctAnswer || "";
        const rawStudent = studentAnswer?.answerText;
        const defaultPoints = question.points && question.points > 0 ? question.points : 1;
        // Detect if this is Multi-Select Mode
        const isMultiSelect = question.selectionMode === "multiple" ||
            question.questionType === "multiple_choice_multi" ||
            question.isMultiChoice === true ||
            question.is_multi_choice === true ||
            (typeof question.maxSelections === "number" && question.maxSelections > 1);
        if (isMultiSelect) {
            return this.evaluateMultiSelect(question, rawCorrect, rawStudent, defaultPoints, normalizer);
        }
        return this.evaluateSingleSelect(question, rawCorrect, rawStudent, defaultPoints, normalizer);
    }
    evaluateSingleSelect(question, rawCorrect, rawStudent, points, normalizer) {
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
        // 1. Direct index check
        const correctIdx = normalizer.normalizeOptionIndex(rawCorrect);
        const studentIdx = normalizer.normalizeOptionIndex(rawStudent);
        let isMatch = false;
        if (correctIdx !== null && studentIdx !== null) {
            isMatch = correctIdx === studentIdx;
        }
        else {
            // 2. Textual / Option text check
            isMatch = normalizer.areEquivalent(rawStudent, rawCorrect);
            // If correct answer is an index and options array exists, check by option text
            if (!isMatch && correctIdx !== null && Array.isArray(question.options) && question.options[correctIdx]) {
                isMatch = normalizer.areEquivalent(rawStudent, question.options[correctIdx]);
            }
            // If student answer is an index and options array exists, check option text vs correct text
            if (!isMatch && studentIdx !== null && Array.isArray(question.options) && question.options[studentIdx]) {
                isMatch = normalizer.areEquivalent(question.options[studentIdx], rawCorrect);
            }
        }
        return {
            questionId: question.id,
            questionType: question.questionType,
            isManual: false,
            isCorrect: isMatch,
            score: isMatch ? points : 0,
            maxScore: points,
            correctCount: isMatch ? 1 : 0,
            itemCount: 1,
        };
    }
    evaluateMultiSelect(question, rawCorrect, rawStudent, points, normalizer) {
        // Parse correct alternatives (e.g. "Paris | London" or JSON ["Paris", "London"])
        let correctList = [];
        if (typeof rawCorrect === "string" && rawCorrect.trim().startsWith("[")) {
            correctList = normalizer.parseJsonSafe(rawCorrect, []);
        }
        else {
            correctList = normalizer.normalizeAlternatives(rawCorrect);
        }
        const expectedCount = typeof question.maxSelections === "number" && question.maxSelections > 0
            ? question.maxSelections
            : (correctList.length > 0 ? correctList.length : 2);
        const totalPoints = points >= expectedCount ? points : expectedCount;
        const pointPerChoice = totalPoints / expectedCount;
        // Parse student selected answers (could be Array, JSON string, or single string)
        let studentSelections = [];
        if (Array.isArray(rawStudent)) {
            studentSelections = rawStudent;
        }
        else if (typeof rawStudent === "string") {
            const parsed = normalizer.parseJsonSafe(rawStudent, null);
            if (Array.isArray(parsed)) {
                studentSelections = parsed;
            }
            else if (rawStudent.trim()) {
                studentSelections = [rawStudent.trim()];
            }
        }
        // Deduplicate student selections
        const distinctSelections = Array.from(new Set(studentSelections.map((s) => String(s))));
        let correctMatches = 0;
        const details = [];
        // Track matched correct items so one student answer doesn't match two correct items
        const matchedCorrect = new Set();
        for (const sel of distinctSelections) {
            let isItemCorrect = false;
            const selIdx = normalizer.normalizeOptionIndex(sel);
            for (const corr of correctList) {
                if (matchedCorrect.has(corr))
                    continue;
                const corrIdx = normalizer.normalizeOptionIndex(corr);
                let match = false;
                if (selIdx !== null && corrIdx !== null) {
                    match = selIdx === corrIdx;
                }
                else {
                    match = normalizer.areEquivalent(sel, corr);
                    if (!match && corrIdx !== null && Array.isArray(question.options) && question.options[corrIdx]) {
                        match = normalizer.areEquivalent(sel, question.options[corrIdx]);
                    }
                    if (!match && selIdx !== null && Array.isArray(question.options) && question.options[selIdx]) {
                        match = normalizer.areEquivalent(question.options[selIdx], corr);
                    }
                }
                if (match) {
                    matchedCorrect.add(corr);
                    isItemCorrect = true;
                    correctMatches++;
                    break;
                }
            }
            details.push({
                key: sel,
                studentValue: sel,
                correctValue: Array.from(matchedCorrect).pop() || null,
                isCorrect: isItemCorrect,
                score: isItemCorrect ? pointPerChoice : 0,
            });
        }
        // Cap correctMatches at expectedCount (no extra points for selecting extra options)
        const finalCorrectCount = Math.min(correctMatches, expectedCount);
        const finalScore = finalCorrectCount * pointPerChoice;
        return {
            questionId: question.id,
            questionType: question.questionType,
            isManual: false,
            isCorrect: finalCorrectCount === expectedCount,
            score: finalScore,
            maxScore: totalPoints,
            correctCount: finalCorrectCount,
            itemCount: expectedCount,
            details,
        };
    }
}
