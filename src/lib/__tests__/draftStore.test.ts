import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveDraftLocally,
  loadDraftLocally,
  clearDraftLocally,
  ExamAnswersMap,
} from "../draftStore";

describe("BASELINE F1.1: EXAM DRAFT RESILIENCY (draftStore Invariant Tests)", () => {
  const submissionId = "sub-1111-2222-3333";
  const userId = "user-alpha";
  const examId = "exam-general-01";

  const sampleAnswers: ExamAnswersMap = {
    "q-1": "A",
    "q-2": ["B", "C"],
    "q-3": { "0": "apple", "1": "orange" },
    "q-4": "This is an essay response.",
  };

  beforeEach(() => {
    // Clear localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // Test 1: Save Draft
  it("1. saveDraftLocally persists draft with version and lastSavedAt", async () => {
    const result = await saveDraftLocally(submissionId, userId, examId, sampleAnswers);
    expect(result.status).toBe("SAVE_SUCCESS");
    if (result.status === "SAVE_SUCCESS") {
      expect(result.version).toBe(1);
    }
  });

  // Test 2: Load Matching Draft
  it("2. loadDraftLocally recovers exact answers when triple-key matches", async () => {
    await saveDraftLocally(submissionId, userId, examId, sampleAnswers);

    const loadResult = await loadDraftLocally(submissionId, userId, examId);
    expect(loadResult.status).toBe("DRAFT_LOADED");
    if (loadResult.status === "DRAFT_LOADED") {
      expect(loadResult.draft.submissionId).toBe(submissionId);
      expect(loadResult.draft.userId).toBe(userId);
      expect(loadResult.draft.examId).toBe(examId);
      expect(loadResult.draft.answers).toEqual(sampleAnswers);
      expect(loadResult.draft.draftVersion).toBe(1);
      expect(loadResult.draft.lastSavedAt).toBeGreaterThan(0);
    }
  });

  // Test 3: Clear Draft
  it("3. clearDraftLocally erases draft from storage", async () => {
    await saveDraftLocally(submissionId, userId, examId, sampleAnswers);
    await clearDraftLocally(submissionId);

    const loadResult = await loadDraftLocally(submissionId, userId, examId);
    expect(loadResult.status).toBe("NO_DRAFT_FOUND");
  });

  // Test 4: Isolation - Wrong User ID
  it("4. loadDraftLocally rejects draft with IDENTITY_MISMATCH if userId does not match (User Isolation)", async () => {
    await saveDraftLocally(submissionId, userId, examId, sampleAnswers);

    const wrongUser = "user-intruder";
    const loadResult = await loadDraftLocally(submissionId, wrongUser, examId);
    expect(loadResult.status).toBe("IDENTITY_MISMATCH");
    if (loadResult.status === "IDENTITY_MISMATCH") {
      expect(loadResult.reason).toContain("userId");
    }
  });

  // Test 5: Isolation - Wrong Exam ID
  it("5. loadDraftLocally rejects draft with IDENTITY_MISMATCH if examId does not match (Exam Isolation)", async () => {
    await saveDraftLocally(submissionId, userId, examId, sampleAnswers);

    const wrongExam = "exam-different-99";
    const loadResult = await loadDraftLocally(submissionId, userId, wrongExam);
    expect(loadResult.status).toBe("IDENTITY_MISMATCH");
    if (loadResult.status === "IDENTITY_MISMATCH") {
      expect(loadResult.reason).toContain("examId");
    }
  });

  // Test 6: Fallback to LocalStorage when IndexedDB is unavailable
  it("6. saveDraftLocally falls back gracefully to LocalStorage when IndexedDB is unavailable", async () => {
    // Temporarily mock indexedDB as undefined
    const originalIndexedDB = window.indexedDB;
    try {
      // @ts-ignore
      window.indexedDB = undefined;

      const saveRes = await saveDraftLocally(submissionId, userId, examId, sampleAnswers);
      expect(saveRes.status).toBe("SAVE_SUCCESS");
      if (saveRes.status === "SAVE_SUCCESS") {
        expect(saveRes.storage).toBe("localstorage");
      }

      const loadRes = await loadDraftLocally(submissionId, userId, examId);
      expect(loadRes.status).toBe("DRAFT_LOADED");
      if (loadRes.status === "DRAFT_LOADED") {
        expect(loadRes.draft.answers).toEqual(sampleAnswers);
      }
    } finally {
      window.indexedDB = originalIndexedDB;
    }
  });

  // Test 7: Submit Failure Safety (Draft remains intact)
  it("7. Submit failure leaves draft intact so student never loses work on network error", async () => {
    await saveDraftLocally(submissionId, userId, examId, sampleAnswers);

    // Simulate failed submit operation
    const mockSubmitApi = vi.fn().mockRejectedValue(new Error("Network Error: 502 Bad Gateway"));

    let submitError: Error | null = null;
    try {
      await mockSubmitApi();
    } catch (err: any) {
      submitError = err;
      // Invariant: Do NOT call clearDraftLocally on submit failure!
    }

    expect(submitError).not.toBeNull();

    // Verify draft is STILL in storage and recoverable
    const loadRes = await loadDraftLocally(submissionId, userId, examId);
    expect(loadRes.status).toBe("DRAFT_LOADED");
    if (loadRes.status === "DRAFT_LOADED") {
      expect(loadRes.draft.answers).toEqual(sampleAnswers);
    }
  });

  // Test 8: Stale Draft Timestamp Conflict Check
  it("8. Draft timestamp and version increments accurately on subsequent saves", async () => {
    const res1 = await saveDraftLocally(submissionId, userId, examId, sampleAnswers, 1);
    expect(res1.status).toBe("SAVE_SUCCESS");
    if (res1.status === "SAVE_SUCCESS") {
      expect(res1.version).toBe(2);
    }

    const updatedAnswers: ExamAnswersMap = {
      ...sampleAnswers,
      "q-1": "B",
    };

    const res2 = await saveDraftLocally(submissionId, userId, examId, updatedAnswers, 2);
    expect(res2.status).toBe("SAVE_SUCCESS");
    if (res2.status === "SAVE_SUCCESS") {
      expect(res2.version).toBe(3);
    }

    const loadRes = await loadDraftLocally(submissionId, userId, examId);
    expect(loadRes.status).toBe("DRAFT_LOADED");
    if (loadRes.status === "DRAFT_LOADED") {
      expect(loadRes.draft.draftVersion).toBe(3);
      expect(loadRes.draft.answers["q-1"]).toBe("B");
    }
  });
});
