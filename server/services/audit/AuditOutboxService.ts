import { randomUUID, createHash } from "crypto";

export type AuditEventType =
  | "SUBMISSION_FINALIZED"
  | "TEACHER_REGRADED"
  | "SUBMISSION_REGRADED"
  | "AUTOSAVE_REJECTED"
  | "SHADOW_MISMATCH"
  | "SECURITY_ALERT";

export interface AuditEventPayload {
  eventType: AuditEventType;
  actorId: string;
  actorRole: string;
  submissionId: string;
  examId?: string;
  requestId?: string;
  idempotencyKey?: string;
  oldState?: Record<string, any>;
  newState?: Record<string, any>;
  resultSummary?: Record<string, any>;
  reason?: string;
}

export interface SanitizedAuditEvent {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  actorRole: string;
  submissionId: string;
  examId: string;
  requestId: string;
  idempotencyKeyHash: string | null;
  oldState: string;
  newState: string;
  resultSummary: string;
  createdAt: Date;
}

export class AuditOutboxService {
  /**
   * Sanitizes payload and builds an immutable audit event record
   * Explicitly strips all forbidden / secret fields (correctAnswer, audioScript, raw answers)
   */
  public buildSanitizedEvent(payload: AuditEventPayload): SanitizedAuditEvent {
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

  private sanitizeState(state: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    const allowedKeys = ["status", "totalScore", "correctAnswers", "totalQuestions", "version", "submittedAt", "gradedAt", "gradedBy"];

    for (const key of allowedKeys) {
      if (state[key] !== undefined) {
        cleaned[key] = state[key];
      }
    }
    return cleaned;
  }

  private sanitizeSummary(summary: Record<string, any>): Record<string, any> {
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
