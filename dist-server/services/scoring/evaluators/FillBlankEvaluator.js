export class FillBlankEvaluator {
    supportedTypes = [
        "fill_blank",
        "short_answer",
        "summary_completion",
        "sentence_completion",
        "listening_fill_blank",
        "reading_fill_blank",
    ];
    canEvaluate(questionType) {
        return this.supportedTypes.includes(questionType?.toLowerCase());
    }
    evaluate(question, studentAnswer, normalizer) {
        const rawCorrect = (question.correctAnswer || "").trim();
        const rawStudent = studentAnswer?.answerText;
        const defaultPoints = question.points && question.points > 0 ? question.points : 1;
        // Check if correct answer is a JSON object with multiple blanks
        let parsedCorrect = null;
        if (rawCorrect.startsWith("{") || rawCorrect.startsWith("[")) {
            parsedCorrect = normalizer.parseJsonSafe(rawCorrect, null);
        }
        if (parsedCorrect && typeof parsedCorrect === "object" && !Array.isArray(parsedCorrect)) {
            return this.evaluateMultiBlank(question, parsedCorrect, rawStudent, defaultPoints, normalizer);
        }
        return this.evaluateSingleBlank(question, rawCorrect, rawStudent, defaultPoints, normalizer);
    }
    evaluateSingleBlank(question, rawCorrect, rawStudent, points, normalizer) {
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
        // Handle student sending JSON object or array for single blank
        let studentText = rawStudent;
        if (typeof rawStudent === "object" && rawStudent !== null) {
            if (Array.isArray(rawStudent)) {
                studentText = rawStudent[0] || "";
            }
            else {
                studentText = rawStudent["0"] || Object.values(rawStudent)[0] || "";
            }
        }
        else if (typeof rawStudent === "string" && (rawStudent.startsWith("{") || rawStudent.startsWith("["))) {
            const parsed = normalizer.parseJsonSafe(rawStudent, null);
            if (parsed && typeof parsed === "object") {
                if (Array.isArray(parsed)) {
                    studentText = parsed[0] || "";
                }
                else {
                    studentText = parsed["0"] || Object.values(parsed)[0] || "";
                }
            }
        }
        const isMatch = normalizer.areEquivalent(studentText, rawCorrect);
        return {
            questionId: question.id,
            questionType: question.questionType,
            isManual: false,
            isCorrect: isMatch,
            score: isMatch ? points : 0,
            maxScore: points,
            correctCount: isMatch ? 1 : 0,
            itemCount: 1,
            details: [
                {
                    key: "0",
                    studentValue: studentText,
                    correctValue: rawCorrect,
                    isCorrect: isMatch,
                    score: isMatch ? points : 0,
                },
            ],
        };
    }
    evaluateMultiBlank(question, correctMap, rawStudent, points, normalizer) {
        const blankKeys = Object.keys(correctMap).sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
        });
        const blankCount = blankKeys.length;
        if (blankCount === 0) {
            return this.evaluateSingleBlank(question, "", rawStudent, points, normalizer);
        }
        // Parse student answer structure
        const studentMap = {};
        if (rawStudent && typeof rawStudent === "object") {
            if (Array.isArray(rawStudent)) {
                rawStudent.forEach((val, idx) => {
                    studentMap[String(idx)] = val;
                });
            }
            else {
                Object.assign(studentMap, rawStudent);
            }
        }
        else if (typeof rawStudent === "string" && rawStudent.trim()) {
            const parsed = normalizer.parseJsonSafe(rawStudent, null);
            if (parsed && typeof parsed === "object") {
                if (Array.isArray(parsed)) {
                    parsed.forEach((val, idx) => {
                        studentMap[String(idx)] = val;
                    });
                }
                else {
                    Object.assign(studentMap, parsed);
                }
            }
            else {
                // Plain string fallback mapped to first blank
                studentMap["0"] = rawStudent.trim();
            }
        }
        const maxScore = points >= blankCount ? points : blankCount;
        const pointPerBlank = maxScore / blankCount;
        let correctBlanks = 0;
        const details = [];
        for (const key of blankKeys) {
            const correctVal = correctMap[key];
            const studentVal = studentMap[key] !== undefined ? studentMap[key] : "";
            const isBlankCorrect = normalizer.areEquivalent(studentVal, correctVal);
            if (isBlankCorrect) {
                correctBlanks++;
            }
            details.push({
                key,
                studentValue: studentVal,
                correctValue: correctVal,
                isCorrect: isBlankCorrect,
                score: isBlankCorrect ? pointPerBlank : 0,
            });
        }
        const finalScore = correctBlanks * pointPerBlank;
        return {
            questionId: question.id,
            questionType: question.questionType,
            isManual: false,
            isCorrect: correctBlanks === blankCount,
            score: finalScore,
            maxScore: maxScore,
            correctCount: correctBlanks,
            itemCount: blankCount, // CRITICAL FIX: EXACTLY blankCount (N), never N + 1 or N + 2
            details,
        };
    }
}
