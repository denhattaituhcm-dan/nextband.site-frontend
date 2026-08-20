export function sanitizeBackendQuestionPayload(input) {
    const type = (input.questionType || "short_answer");
    const text = (input.questionText || "").trim();
    const points = typeof input.points === "number" ? input.points : 1;
    const orderIndex = typeof input.orderIndex === "number" ? input.orderIndex : 0;
    const audioUrl = input.audioUrl || null;
    const groupId = input.groupId;
    let sanitizedOptions = null;
    let sanitizedCorrectAnswer = typeof input.correctAnswer === "string" ? input.correctAnswer.trim() : null;
    switch (type) {
        case "multiple_choice": {
            let rawOpts = input.options;
            if (typeof rawOpts === "string") {
                try {
                    rawOpts = JSON.parse(rawOpts);
                }
                catch {
                    rawOpts = null;
                }
            }
            if (Array.isArray(rawOpts)) {
                const cleaned = rawOpts
                    .map((o) => (typeof o === "string" ? o.trim() : ""))
                    .filter(Boolean);
                sanitizedOptions = cleaned.length > 0 ? cleaned : null;
            }
            break;
        }
        case "short_answer":
        case "essay":
        case "speaking":
        case "fill_blank": {
            sanitizedOptions = null;
            break;
        }
        case "matching": {
            sanitizedOptions = null;
            break;
        }
        case "true_false_not_given":
        case "yes_no_not_given": {
            sanitizedOptions = null;
            if (sanitizedCorrectAnswer) {
                sanitizedCorrectAnswer = sanitizedCorrectAnswer.toUpperCase();
            }
            break;
        }
        default:
            sanitizedOptions = null;
    }
    return {
        groupId,
        questionType: type,
        questionText: text,
        options: sanitizedOptions,
        correctAnswer: sanitizedCorrectAnswer,
        points,
        orderIndex,
        audioUrl,
    };
}
