import { createHash } from "crypto";
export class IdempotencyService {
    /**
     * Computes deterministic SHA-256 hash of student answers payload
     */
    computePayloadHash(payload) {
        const serialized = typeof payload === "string" ? payload : JSON.stringify(payload || {});
        return createHash("sha256").update(serialized).digest("hex");
    }
    /**
     * Checks if an existing idempotency record matches the incoming payload
     */
    verifyIdempotency(existingRecord, incomingPayloadHash) {
        if (!existingRecord) {
            return { isMatch: false, isConflict: false };
        }
        if (existingRecord.payloadHash === incomingPayloadHash) {
            return {
                isMatch: true,
                isConflict: false,
                cachedResponse: existingRecord.responsePayload,
            };
        }
        // Same key used with different payload -> 409 Conflict
        return {
            isMatch: false,
            isConflict: true,
        };
    }
}
export const idempotencyService = new IdempotencyService();
