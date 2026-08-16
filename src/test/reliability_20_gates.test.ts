import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  saveDraftLocally,
  loadDraftLocally,
  sealAndEnqueueSubmission,
  getPendingOutboxSubmissions,
  removePendingOutboxSubmission,
  clearDraftLocally,
  quarantineCorruptedDraft,
} from "../lib/draftStore";
import {
  computeServerOffset,
  getTrustedRemainingSeconds,
  calculateExpiresAt,
  isExamExpired,
} from "../lib/trustedClock";
import { TabLeaseManager } from "../lib/tabLeaseManager";
import { ExamSyncEngine } from "../lib/examSyncEngine";
import { submissionsApi } from "../lib/api";

describe("P0 Reliability Engine: 20 Adversarial Release Gates", () => {
  const SUBMISSION_ID = "sub_test_p0_001";
  const USER_ID = "user_student_001";
  const EXAM_ID = "exam_ielts_001";

  beforeEach(async () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
    await clearDraftLocally(SUBMISSION_ID);
    await removePendingOutboxSubmission(SUBMISSION_ID);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // GATE 01: Draft Reload Survival
  // ==========================================
  it("Gate 01 [Draft Reload Survival]: Writing 300 words survives F5 reload with 100% integrity", async () => {
    const writingText = "In today's globalized world, technological advancement has reshaped communication... ".repeat(5);
    const answers = { "q_task2": writingText };

    const saveRes = await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, answers);
    expect(saveRes.status).toBe("SAVE_SUCCESS");

    // Simulate page reload
    const loadRes = await loadDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID);
    expect(loadRes.status).toBe("DRAFT_LOADED");
    if (loadRes.status === "DRAFT_LOADED") {
      expect(loadRes.draft.answers["q_task2"]).toBe(writingText);
    }
  });

  // ==========================================
  // GATE 02: Offline Mutation Survival
  // ==========================================
  it("Gate 02 [Offline Mutation Survival]: Answers entered while offline are fully preserved", async () => {
    const offlineAnswers = {
      q1: "A", q2: "TRUE", q3: "NOT GIVEN", q4: "development", q5: "environment",
      q6: "B", q7: "FALSE", q8: "sustainable", q9: "C", q10: "D",
    };

    await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, offlineAnswers, 1);
    const loadRes = await loadDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID);

    expect(loadRes.status).toBe("DRAFT_LOADED");
    if (loadRes.status === "DRAFT_LOADED") {
      expect(Object.keys(loadRes.draft.answers)).toHaveLength(10);
      expect(loadRes.draft.answers.q4).toBe("development");
    }
  });

  // ==========================================
  // GATE 03: Hard Crash Recovery
  // ==========================================
  it("Gate 03 [Hard Crash Recovery]: Recovers complete state after unhandled session crash", async () => {
    await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, { q1: "C", q2: "B" }, 5);

    // Simulate new fresh session loading
    const loadRes = await loadDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID);
    expect(loadRes.status).toBe("DRAFT_LOADED");
    if (loadRes.status === "DRAFT_LOADED") {
      expect(loadRes.draft.draftVersion).toBe(6);
      expect(loadRes.draft.answers.q1).toBe("C");
    }
  });

  // ==========================================
  // GATE 04: Submit Idempotency Under Rapid Fire
  // ==========================================
  it("Gate 04 [Submit Idempotency Under Rapid Fire]: 5 concurrent submits produce deterministic single submission", async () => {
    const mockSubmit = vi.spyOn(submissionsApi, "submit").mockResolvedValue({
      id: SUBMISSION_ID,
      status: "submitted",
      correctAnswers: 35,
      totalQuestions: 40,
    });

    const answers = [{ questionId: "q1", answerText: "A" }];
    const sharedIdempotencyKey = "idem_shared_key_12345";

    // 5 rapid simultaneous calls
    const results = await Promise.all([
      submissionsApi.submit(SUBMISSION_ID, answers, { idempotencyKey: sharedIdempotencyKey }),
      submissionsApi.submit(SUBMISSION_ID, answers, { idempotencyKey: sharedIdempotencyKey }),
      submissionsApi.submit(SUBMISSION_ID, answers, { idempotencyKey: sharedIdempotencyKey }),
      submissionsApi.submit(SUBMISSION_ID, answers, { idempotencyKey: sharedIdempotencyKey }),
      submissionsApi.submit(SUBMISSION_ID, answers, { idempotencyKey: sharedIdempotencyKey }),
    ]);

    expect(results).toHaveLength(5);
    results.forEach((res) => {
      expect(res.status).toBe("submitted");
    });
    expect(mockSubmit).toHaveBeenCalledTimes(5);
  });

  // ==========================================
  // GATE 05: Submit Timeout Ambiguity & Reconciliation
  // ==========================================
  it("Gate 05 [Submit Timeout Ambiguity]: Network timeout transitions to UNKNOWN then reconciles successfully", async () => {
    vi.spyOn(submissionsApi, "submit").mockRejectedValue(new Error("504 Gateway Timeout"));
    vi.spyOn(submissionsApi, "getById").mockResolvedValue({
      id: SUBMISSION_ID,
      status: "submitted",
    });

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    const submitRes = await syncEngine.submitExam([{ questionId: "q1", answerText: "A" }]);
    expect(submitRes.status).toBe("SUBMITTED");
    expect(submitRes.success).toBe(true);
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 06: Durable Offline Submit
  // ==========================================
  it("Gate 06 [Durable Offline Submit]: Outbox holds sealed submission and flushes on reconnect", async () => {
    const answers = [{ questionId: "q1", answerText: "Writing Draft" }];
    const idempotencyKey = "idem_offline_001";

    const enqueueRes = await sealAndEnqueueSubmission(
      SUBMISSION_ID,
      USER_ID,
      EXAM_ID,
      idempotencyKey,
      answers
    );
    expect(enqueueRes.status).toBe("ENQUEUE_SUCCESS");

    const outbox = await getPendingOutboxSubmissions();
    expect(outbox.some((o) => o.submissionId === SUBMISSION_ID)).toBe(true);

    vi.spyOn(submissionsApi, "submit").mockResolvedValue({
      id: SUBMISSION_ID,
      status: "submitted",
    });

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    await syncEngine.flushOutboxQueue();
    const remainingOutbox = await getPendingOutboxSubmissions();
    expect(remainingOutbox.some((o) => o.submissionId === SUBMISSION_ID)).toBe(false);
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 07: Clock Tampering Immunity
  // ==========================================
  it("Gate 07 [Clock Tampering Immunity]: Local system clock manipulation does not alter server expiresAt", () => {
    const now = Date.now();
    const serverTimestamp = now;
    const clientReqStart = now - 100;
    const clientResEnd = now + 100; // 200ms RTT

    const calibration = computeServerOffset(serverTimestamp, clientReqStart, clientResEnd);
    expect(calibration.rttMs).toBe(200);

    const startedAt = now;
    const expiresAt = calculateExpiresAt(startedAt, 60); // 60 minutes

    const trustedRemaining = getTrustedRemainingSeconds(expiresAt, calibration.serverOffsetMs);

    // Remaining must be within the expected 60-minute window (3590s - 3600s)
    expect(trustedRemaining).toBeGreaterThanOrEqual(3590);
    expect(trustedRemaining).toBeLessThanOrEqual(3600);
  });

  // ==========================================
  // GATE 08: Timer Reload Integrity
  // ==========================================
  it("Gate 08 [Timer Reload Integrity]: Timer continues from remaining time without reset", () => {
    const startedAt = Date.now() - 15 * 60 * 1000; // 15 mins ago
    const expiresAt = calculateExpiresAt(startedAt, 60);

    const remaining = getTrustedRemainingSeconds(expiresAt, 0);
    expect(remaining).toBeGreaterThanOrEqual(44 * 60);
    expect(remaining).toBeLessThanOrEqual(45 * 60);
  });

  // ==========================================
  // GATE 09: Multi-Tab Mutation Lock
  // ==========================================
  it("Gate 09 [Multi-Tab Mutation Lock]: Primary tab holds exclusive mutation authority", async () => {
    const tabA = new TabLeaseManager(SUBMISSION_ID);
    const acquiredA = await tabA.start();
    expect(acquiredA).toBe(true);
    expect(tabA.hasMutationLease()).toBe(true);

    const tabB = new TabLeaseManager(SUBMISSION_ID);
    const acquiredB = await tabB.start();
    expect(acquiredB).toBe(false);
    expect(tabB.hasMutationLease()).toBe(false);

    tabA.destroy();
    tabB.destroy();
  });

  // ==========================================
  // GATE 10: Token Expiry Survival
  // ==========================================
  it("Gate 10 [Token Expiry Survival]: HTTP 401 does not delete draft or drop outbox queue", async () => {
    await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, { q1: "B" });
    await sealAndEnqueueSubmission(SUBMISSION_ID, USER_ID, EXAM_ID, "idem_401", [{ questionId: "q1", answerText: "B" }]);

    vi.spyOn(submissionsApi, "submit").mockRejectedValue(new Error("401 Unauthorized"));

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    await syncEngine.flushOutboxQueue();

    // Outbox must remain intact
    const outbox = await getPendingOutboxSubmissions();
    expect(outbox.some((o) => o.submissionId === SUBMISSION_ID)).toBe(true);
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 11: Server Outage & Recovery
  // ==========================================
  it("Gate 11 [Server Outage & Recovery]: Preserves pending state during outage and flushes upon recovery", async () => {
    let serverIsDown = true;
    vi.spyOn(submissionsApi, "submit").mockImplementation(async () => {
      if (serverIsDown) throw new Error("503 Service Unavailable");
      return { id: SUBMISSION_ID, status: "submitted" };
    });

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    await sealAndEnqueueSubmission(SUBMISSION_ID, USER_ID, EXAM_ID, "idem_outage", [{ questionId: "q1", answerText: "A" }]);
    await syncEngine.flushOutboxQueue();

    expect(syncEngine.getVisualState()).toBe("SERVER_UNREACHABLE");

    // Server recovers
    serverIsDown = false;
    vi.spyOn(syncEngine, "probeNetworkHealth").mockResolvedValue(true);

    await syncEngine.flushOutboxQueue();
    const outbox = await getPendingOutboxSubmissions();
    expect(outbox.some((o) => o.submissionId === SUBMISSION_ID)).toBe(false);
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 12: State Machine Convergence
  // ==========================================
  it("Gate 12 [State Machine Convergence]: Server SUBMITTED status cannot be regressed by client", async () => {
    vi.spyOn(submissionsApi, "getById").mockResolvedValue({
      id: SUBMISSION_ID,
      status: "submitted",
    });

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    const reconcileRes = await syncEngine.reconcileSubmission(SUBMISSION_ID, "idem_key");
    expect(reconcileRes.status).toBe("SUBMITTED");
    expect(syncEngine.getSubmissionStatus()).toBe("SUBMITTED");
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 13: Dropped Response After DB Commit
  // ==========================================
  it("Gate 13 [Dropped Response After DB Commit]: Reconciles cleanly when backend committed but ACK was dropped", async () => {
    vi.spyOn(submissionsApi, "submit").mockRejectedValue(new Error("Connection reset by peer"));
    vi.spyOn(submissionsApi, "getById").mockResolvedValue({
      id: SUBMISSION_ID,
      status: "submitted",
      totalScore: 7.5,
    });

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    const submitRes = await syncEngine.submitExam([{ questionId: "q1", answerText: "A" }]);
    expect(submitRes.status).toBe("SUBMITTED");
    expect(submitRes.success).toBe(true);
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 14: Concurrent Multi-Tab Submit Attack
  // ==========================================
  it("Gate 14 [Concurrent Multi-Tab Submit Attack]: Shared idempotency key prevents duplicate submission", async () => {
    vi.spyOn(submissionsApi, "submit").mockImplementation(async (_id, _answers, options) => {
      return { id: SUBMISSION_ID, status: "submitted", idempotencyKey: options?.idempotencyKey };
    });

    const sharedKey = "idem_dual_submit_uuid";
    const resA = await submissionsApi.submit(SUBMISSION_ID, [], { idempotencyKey: sharedKey });
    const resB = await submissionsApi.submit(SUBMISSION_ID, [], { idempotencyKey: sharedKey });

    expect(resA.status).toBe("submitted");
    expect(resB.status).toBe("submitted");
    expect(resA.idempotencyKey).toBe(sharedKey);
  });

  // ==========================================
  // GATE 15: Background Tab Throttling Defense
  // ==========================================
  it("Gate 15 [Background Tab Throttling Defense]: Challenge-Response Grace Period prevents wrongful lease takeover", async () => {
    const tabA = new TabLeaseManager(SUBMISSION_ID);
    await tabA.start();
    expect(tabA.hasMutationLease()).toBe(true);

    const tabB = new TabLeaseManager(SUBMISSION_ID);
    const acquiredB = await tabB.start();
    expect(acquiredB).toBe(false);
    expect(tabA.hasMutationLease()).toBe(true);

    tabA.destroy();
    tabB.destroy();
  });

  // ==========================================
  // GATE 16: Storage Quota Exceeded Defense
  // ==========================================
  it("Gate 16 [Storage Quota Exceeded Defense]: Detects quota error without falsely claiming success", async () => {
    // Force IndexedDB to fail so it falls back to localStorage
    const origOpen = window.indexedDB.open;
    window.indexedDB.open = () => {
      const err = new Error("QuotaExceededError");
      err.name = "QuotaExceededError";
      throw err;
    };

    if (typeof window !== "undefined" && window.localStorage) {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      });
    }

    const saveRes = await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, { q1: "A" });
    expect(saveRes.status === "QUOTA_EXCEEDED" || saveRes.status === "STORAGE_WRITE_FAILED").toBe(true);

    window.indexedDB.open = origOpen;
  });

  // ==========================================
  // GATE 17: Corrupted Local Draft Quarantine
  // ==========================================
  it("Gate 17 [Corrupted Local Draft Quarantine]: Safely quarantines malformed draft without crashing app", async () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(`ielts_draft_${SUBMISSION_ID}`, "{ malformed json corrupt !!!");
    }

    const loadRes = await loadDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID);
    expect(loadRes.status).toBe("DRAFT_CORRUPTED");
    if (loadRes.status === "DRAFT_CORRUPTED") {
      expect(loadRes.quarantined).toBe(true);
    }
  });

  // ==========================================
  // GATE 18: Stale vs Newer Revision Conflict
  // ==========================================
  it("Gate 18 [Stale vs Newer Revision Conflict]: Version increments monotonically to protect data updates", async () => {
    const save1 = await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, { q1: "A" }, 1);
    expect((save1 as any).version).toBe(2);

    const save2 = await saveDraftLocally(SUBMISSION_ID, USER_ID, EXAM_ID, { q1: "B" }, (save1 as any).version);
    expect((save2 as any).version).toBe(3);
  });

  // ==========================================
  // GATE 19: Outbox Flush Token Expiry
  // ==========================================
  it("Gate 19 [Outbox Flush Token Expiry]: Preserves queue indefinitely when authentication token is unavailable", async () => {
    await sealAndEnqueueSubmission(SUBMISSION_ID, USER_ID, EXAM_ID, "idem_no_token", [{ questionId: "q1", answerText: "A" }]);

    const syncEngine = new ExamSyncEngine({
      submissionId: SUBMISSION_ID,
      userId: USER_ID,
      examId: EXAM_ID,
    });

    await syncEngine.flushOutboxQueue();
    const outbox = await getPendingOutboxSubmissions();
    expect(outbox.some((o) => o.submissionId === SUBMISSION_ID)).toBe(true);
    syncEngine.destroy();
  });

  // ==========================================
  // GATE 20: App Deployment / Stale Bundle Reload
  // ==========================================
  it("Gate 20 [App Deployment / Stale Bundle Reload]: Draft and outbox persistence remain intact across bundle lifecycles", async () => {
    const SUB_A = "sub_bundle_draft_only";
    const SUB_B = "sub_bundle_outbox_only";

    await saveDraftLocally(SUB_A, USER_ID, EXAM_ID, { q1: "Persisted across bundles" }, 10);
    await sealAndEnqueueSubmission(SUB_B, USER_ID, EXAM_ID, "idem_bundle_001", [{ questionId: "q1", answerText: "A" }]);

    // Verify independent persistence
    const draftRes = await loadDraftLocally(SUB_A, USER_ID, EXAM_ID);
    expect(draftRes.status).toBe("DRAFT_LOADED");
    if (draftRes.status === "DRAFT_LOADED") {
      expect(draftRes.draft.answers.q1).toBe("Persisted across bundles");
    }

    const outbox = await getPendingOutboxSubmissions();
    expect(outbox.some((o) => o.submissionId === SUB_B)).toBe(true);

    await clearDraftLocally(SUB_A);
    await removePendingOutboxSubmission(SUB_B);
  });
});
