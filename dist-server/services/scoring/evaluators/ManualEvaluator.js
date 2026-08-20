export class ManualEvaluator {
    supportedTypes = [
        "essay",
        "writing",
        "speaking",
        "ielts_writing_task1",
        "ielts_writing_task2",
        "ielts_speaking_part1",
        "ielts_speaking_part2",
        "ielts_speaking_part3",
        "manual_grade",
        "open_question",
    ];
    canEvaluate(questionType) {
        return this.supportedTypes.includes(questionType?.toLowerCase());
    }
    evaluate(question, studentAnswer, _normalizer) {
        const maxScore = question.points && question.points > 0 ? question.points : 1;
        return {
            questionId: question.id,
            questionType: question.questionType,
            isManual: true,
            isCorrect: false,
            score: 0,
            maxScore,
            correctCount: 0,
            itemCount: 1,
            details: [
                {
                    key: "manual",
                    studentValue: studentAnswer?.answerText || studentAnswer?.audioUrl || null,
                    correctValue: null,
                    isCorrect: false,
                    score: 0,
                },
            ],
        };
    }
}
