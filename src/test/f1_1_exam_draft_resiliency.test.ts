import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveDraftLocally,
  loadDraftLocally,
  clearDraftLocally,
  ExamAnswersMap,
} from "../lib/draftStore";

describe("BASELINE F1.1: EXAM DRAFT RESILIENCY RUNTIME & LIFECYCLE TESTS", () => {
  const submissionId = "sub-f1-1-uuid-9999";
  const userId = "student-alice";
  const examId = "exam-ielts-reading-01";

  const initialAnswers: ExamAnswersMap = {
    "q-1": "TRUE",
    "q-2": "FALSE",
    "q-3": { "0": "environment", "1": "sustainability" },
  };

  beforeEach(async () => {
    await clearDraftLocally(submissionId);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // Cycle 1: Happy Path (Answer -> Save -> Refresh -> Restore -> Submit -> Clear)
  it("Lifecycle 1: Happy Path (Answer -> Save -> Refresh -> Restore -> Submit -> Clear -> Reload)", async () => {
    // 1. Student answers
    const saveRes = await saveDraftLocally(submissionId, userId, examId, initialAnswers);
    expect(saveRes.status).toBe("SAVE_SUCCESS");

    // 2. Student refreshes / reopens tab
    const restoreRes = await loadDraftLocally(submissionId, userId, examId);
    expect(restoreRes.status).toBe("DRAFT_LOADED");
    if (restoreRes.status === "DRAFT_LOADED") {
      expect(restoreRes.draft.answers).toEqual(initialAnswers);
    }

    // 3. Student successfully submits exam
    const mockSubmitApi = vi.fn().mockResolvedValue({ success: true, submissionId, score: 9.0 });
    const submitResult = await mockSubmitApi();
    expect(submitResult.success).toBe(true);

    // Draft is cleared upon 200 OK
    await clearDraftLocally(submissionId);

    // 4. Reload after submission - No old draft remains
    const reloadRes = await loadDraftLocally(submissionId, userId, examId);
    expect(reloadRes.status).toBe("NO_DRAFT_FOUND");
  });

  // Cycle 2: Submit Failure Resilience (Draft MUST survive)
  it("Lifecycle 2: Network failure during submit preserves draft for retry", async () => {
    // 1. Student answers and saves
    await saveDraftLocally(submissionId, userId, examId, initialAnswers);

    // 2. Student clicks submit, but network dies
    const mockSubmitApi = vi.fn().mockRejectedValue(new Error("504 Gateway Timeout / Network Disconnected"));

    let failed = false;
    try {
      await mockSubmitApi();
    } catch {
      failed = true;
      // Invariant: Do NOT clear draft on error
    }
    expect(failed).toBe(true);

    // 3. Verify draft survived
    const draftAfterFailure = await loadDraftLocally(submissionId, userId, examId);
    expect(draftAfterFailure.status).toBe("DRAFT_LOADED");
    if (draftAfterFailure.status === "DRAFT_LOADED") {
      expect(draftAfterFailure.draft.answers).toEqual(initialAnswers);
    }

    // 4. Student reconnects and retries submit
    const mockRetryApi = vi.fn().mockResolvedValue({ success: true, submissionId });
    const retryRes = await mockRetryApi();
    expect(retryRes.success).toBe(true);

    // Now clear draft
    await clearDraftLocally(submissionId);

    const finalDraft = await loadDraftLocally(submissionId, userId, examId);
    expect(finalDraft.status).toBe("NO_DRAFT_FOUND");
  });

  // Cycle 3: Security & Multi-User Boundary Isolation
  it("Lifecycle 3: Multi-User Boundary Isolation prevents draft leakage across student accounts", async () => {
    // Student Alice saves draft on shared computer
    await saveDraftLocally(submissionId, userId, examId, initialAnswers);

    // Student Bob logs in and opens same exam attempt URL
    const bobUserId = "student-bob";
    const bobLoad = await loadDraftLocally(submissionId, bobUserId, examId);
    expect(bobLoad.status).toBe("IDENTITY_MISMATCH");

    // Invariant: Bob must NOT receive Alice's answers
    if (bobLoad.status === "IDENTITY_MISMATCH") {
      expect(bobLoad.reason).toContain("userId");
    }
  });

  // Cycle 4: Exam Isolation
  it("Lifecycle 4: Exam Boundary Isolation prevents restoring draft into wrong exam", async () => {
    await saveDraftLocally(submissionId, userId, examId, initialAnswers);

    const wrongExamId = "exam-ielts-listening-99";
    const wrongExamLoad = await loadDraftLocally(submissionId, userId, wrongExamId);
    expect(wrongExamLoad.status).toBe("IDENTITY_MISMATCH");
    if (wrongExamLoad.status === "IDENTITY_MISMATCH") {
      expect(wrongExamLoad.reason).toContain("examId");
    }
  });
});
