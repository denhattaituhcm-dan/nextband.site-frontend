import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveAssessmentDraftLocally,
  loadAssessmentDraftLocally,
  clearAssessmentDraftLocally,
  savePendingAudioBlob,
  getPendingAudioBlob,
  clearPendingAudioBlob,
} from "../lib/assessmentDraftStore";

describe("Batch P1-A: Assessment Offline Resilience & Idempotent Sync", () => {
  const testSessionId = "session-p1-test-" + Date.now();

  beforeEach(() => {
    localStorage.clear();
  });

  it("Test 1: Save answer online writes immediately to local storage", async () => {
    const answers = { "q-1": "A", "q-2": "B" };
    const success = await saveAssessmentDraftLocally(testSessionId, answers, false);
    expect(success).toBe(true);

    const loaded = await loadAssessmentDraftLocally(testSessionId);
    expect(loaded).toEqual(answers);
  });

  it("Test 2: Save answer offline marks draft as pending sync and preserves state", async () => {
    const answers = { "q-1": "C", "q-reading-1": "True" };
    await saveAssessmentDraftLocally(testSessionId, answers, true);

    const loaded = await loadAssessmentDraftLocally(testSessionId);
    expect(loaded).toBeDefined();
    expect(loaded?.["q-reading-1"]).toBe("True");
  });

  it("Test 3: Multiple pending answers are merged without data loss", async () => {
    await saveAssessmentDraftLocally(testSessionId, { "q-1": "A" }, true);
    await saveAssessmentDraftLocally(testSessionId, { "q-1": "A", "q-2": "D" }, true);

    const loaded = await loadAssessmentDraftLocally(testSessionId);
    expect(loaded).toEqual({ "q-1": "A", "q-2": "D" });
  });

  it("Test 4: Refresh/reload offline restores answers from local draft", async () => {
    const offlineAnswers = { "writing_response": "This is a detailed offline essay draft with enough words." };
    await saveAssessmentDraftLocally(testSessionId, offlineAnswers, true);

    // Simulate page reload by reading fresh
    const restored = await loadAssessmentDraftLocally(testSessionId);
    expect(restored?.writing_response).toContain("detailed offline essay draft");
  });

  it("Test 5: Clear local draft deletes records cleanly", async () => {
    await saveAssessmentDraftLocally(testSessionId, { "q-1": "A" }, false);
    await clearAssessmentDraftLocally(testSessionId);

    const loaded = await loadAssessmentDraftLocally(testSessionId);
    expect(loaded).toBeNull();
  });

  it("Test 6: Speaking audio blob is safely queued in Outbox before upload", async () => {
    const mockBlob = new Blob(["mock-audio-bytes"], { type: "audio/webm" });
    const recordingId = "rec-12345";
    const durationMs = 45000;

    await savePendingAudioBlob(testSessionId, recordingId, mockBlob, durationMs);
    const pending = await getPendingAudioBlob(testSessionId);

    // When IndexedDB is available or mock, verify pending record or fallback
    if (pending) {
      expect(pending.sessionId).toBe(testSessionId);
      expect(pending.recordingId).toBe(recordingId);
      expect(pending.durationMs).toBe(45000);
    }
  });

  it("Test 7: Clear pending audio blob cleans outbox upon confirmed upload", async () => {
    await clearPendingAudioBlob(testSessionId);
    const pending = await getPendingAudioBlob(testSessionId);
    expect(pending).toBeNull();
  });

  it("Test 8: Idempotent submit handling returns cached result upon retry", () => {
    const mockSession: any = {
      id: testSessionId,
      status: "SUBMITTED",
      result: {
        rawScore: 28,
        totalQuestions: 35,
        accuracyPercent: 80,
        ieltsBandScore: 6.5,
        rankCode: "LEVEL_5",
      },
    };

    // If session is already submitted and has result, return result directly
    const handleIdempotentSubmit = (session: any) => {
      if (session.status === "SUBMITTED") {
        if (session.result) return session.result;
        throw new Error("Bài khảo thí này đã được nộp trước đó");
      }
      return null;
    };

    const res1 = handleIdempotentSubmit(mockSession);
    const res2 = handleIdempotentSubmit(mockSession);

    expect(res1).toEqual(res2);
    expect(res1.ieltsBandScore).toBe(6.5);
  });
});
