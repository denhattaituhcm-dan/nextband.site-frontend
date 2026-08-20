import { randomUUID, createHash } from "crypto";
export class AuditOutboxService {
    /**
     * Sanitizes payload and builds an immutable audit event record
     * Explicitly strips all forbidden / secret fields (correctAnswer, audioScript, raw answers)
     */
    buildSanitizedEvent(payload) {
        const keyHash = payload.idempotencyKey
            ? createHash("sha256").update(payload.idempotencyKey).digest("hex")
            : null;
        const sanitizedOldState = this.sanitizeState(payload.oldState || {});
        const sanitizedNewState = this.sanitizeState(payload.newState || {});
        const sanitizedSummary = this.sanitizeSummary(payload.resultSummary || {});
        return {
            id: randomUUID(),
            eventType: payload.eventType,
            actorId: payload.actorId,
            actorRole: payload.actorRole,
            submissionId: payload.submissionId,
            examId: payload.examId || "unknown",
            requestId: payload.requestId || randomUUID(),
            idempotencyKeyHash: keyHash,
            oldState: JSON.stringify(sanitizedOldState),
            newState: JSON.stringify(sanitizedNewState),
            resultSummary: JSON.stringify(sanitizedSummary),
            createdAt: new Date(),
        };
    }
    sanitizeState(state) {
        const cleaned = {};
        const allowedKeys = ["status", "totalScore", "correctAnswers", "totalQuestions", "version", "submittedAt", "gradedAt", "gradedBy"];
        for (const key of allowedKeys) {
            if (state[key] !== undefined) {
                cleaned[key] = state[key];
            }
        }
        return cleaned;
    }
    sanitizeSummary(summary) {
        return {
            totalScore: summary.totalScore,
            maxScore: summary.maxScore,
            correctAnswers: summary.correctAnswers,
            totalQuestions: summary.totalQuestions,
            percentage: summary.percentage,
            hasManualQuestions: summary.hasManualQuestions,
        };
    }
}
export const auditOutboxService = new AuditOutboxService();
