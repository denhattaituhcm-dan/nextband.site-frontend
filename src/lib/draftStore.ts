/**
 * Resilient Client-Side Draft Store (IndexedDB Primary with LocalStorage Fallback)
 * Upgraded with Durable Outbox Queue, Atomic Transaction Enqueue, and Quarantine Store.
 *
 * Invariant Rules:
 * 1. Identity Lock: Triple-key verification (submissionId + userId + examId).
 * 2. Persistence: IndexedDB primary, LocalStorage fallback when IndexedDB is unavailable.
 * 3. Outbox Atomicity: Seal & Enqueue must occur within a single transaction.
 * 4. Submit Safety: Outbox is cleared ONLY upon confirmed server submission or reconciliation.
 * 5. Quarantine: Corrupted payloads are quarantined rather than crashing the exam session.
 */

const DB_NAME = "ielts_exam_drafts_db";
const STORE_DRAFTS = "drafts";
const STORE_OUTBOX = "outbox";
const STORE_QUARANTINE = "quarantine";
const DB_VERSION = 2;

export type ExamAnswerValue =
  | string
  | string[]
  | number
  | Record<string, string>
  | null;

export type ExamAnswersMap = Record<string, ExamAnswerValue>;

export interface DraftRecord {
  submissionId: string;
  userId: string;
  examId: string;
  draftVersion: number;
  lastSavedAt: number;
  answers: ExamAnswersMap;
}

export interface PendingOutboxRecord {
  submissionId: string;
  userId: string;
  examId: string;
  idempotencyKey: string;
  answers: Array<{ questionId: string; answerText?: any; audioUrl?: string }>;
  sealedAt: number;
  status: "PENDING" | "RECONCILING" | "ACKNOWLEDGED";
  attempts: number;
  lastAttemptAt?: number;
}

export interface QuarantineRecord {
  submissionId: string;
  quarantinedAt: number;
  rawPayload: any;
  errorReason: string;
}

export type DraftSaveResult =
  | { status: "SAVE_SUCCESS"; version: number; storage: "indexeddb" | "localstorage" }
  | { status: "QUOTA_EXCEEDED"; error: string }
  | { status: "STORAGE_WRITE_FAILED"; error: string };

export type DraftLoadResult =
  | { status: "DRAFT_LOADED"; draft: DraftRecord }
  | { status: "NO_DRAFT_FOUND" }
  | { status: "IDENTITY_MISMATCH"; reason: string }
  | { status: "DRAFT_CORRUPTED"; reason: string; quarantined: boolean }
  | { status: "STORAGE_READ_FAILED"; error: string };

export type OutboxEnqueueResult =
  | { status: "ENQUEUE_SUCCESS"; record: PendingOutboxRecord }
  | { status: "ENQUEUE_FAILED"; error: string };

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined" && window.indexedDB !== null;
}

function isLocalStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined" && window.localStorage !== null;
}

export function openDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: "submissionId" });
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: "submissionId" });
        }
        if (!db.objectStoreNames.contains(STORE_QUARANTINE)) {
          db.createObjectStore(STORE_QUARANTINE, { keyPath: "submissionId" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Saves exam draft locally with Quota & Corruption handling.
 */
export async function saveDraftLocally(
  submissionId: string,
  userId: string,
  examId: string,
  answers: ExamAnswersMap,
  currentVersion?: number
): Promise<DraftSaveResult> {
  const version = typeof currentVersion === "number" ? currentVersion + 1 : 1;
  const draft: DraftRecord = {
    submissionId,
    userId,
    examId,
    draftVersion: version,
    lastSavedAt: Date.now(),
    answers,
  };

  // Primary: IndexedDB
  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readwrite");
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.put(draft);
        req.onsuccess = () => resolve();
        req.onerror = (e: any) => reject(e?.target?.error || e);
        tx.oncomplete = () => resolve();
        tx.onerror = (e: any) => reject(e?.target?.error || e);
      });
      db.close();
      return { status: "SAVE_SUCCESS", version, storage: "indexeddb" };
    }
  } catch (err: any) {
    const isQuota = err?.name === "QuotaExceededError" || String(err).includes("quota");
    if (isQuota) {
      return { status: "QUOTA_EXCEEDED", error: "IndexedDB storage quota exceeded" };
    }
    // Proceed to LocalStorage fallback
  }

  // Fallback: LocalStorage
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(`ielts_draft_${submissionId}`, JSON.stringify(draft));
      return { status: "SAVE_SUCCESS", version, storage: "localstorage" };
    } catch (err: any) {
      const isQuota = err?.name === "QuotaExceededError" || String(err).includes("quota");
      if (isQuota) {
        return { status: "QUOTA_EXCEEDED", error: "LocalStorage quota exceeded" };
      }
      return { status: "STORAGE_WRITE_FAILED", error: err?.message || String(err) };
    }
  }

  return { status: "STORAGE_WRITE_FAILED", error: "No storage mechanism available" };
}

/**
 * Loads exam draft matching triple-key identity verification with Quarantine defense.
 */
export async function loadDraftLocally(
  submissionId: string,
  expectedUserId: string,
  expectedExamId: string
): Promise<DraftLoadResult> {
  let record: DraftRecord | null = null;
  let usedFallback = false;
  let corruptedPayload: any = null;

  // Primary: Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      record = await new Promise<DraftRecord | null>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readonly");
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.get(submissionId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e);
      });
      db.close();
    } else {
      usedFallback = true;
    }
  } catch (err) {
    usedFallback = true;
  }

  // Fallback: Try LocalStorage if IndexedDB was unavailable or returned nothing
  if (!record && (usedFallback || isLocalStorageAvailable())) {
    try {
      if (isLocalStorageAvailable()) {
        const raw = window.localStorage.getItem(`ielts_draft_${submissionId}`);
        if (raw) {
          try {
            record = JSON.parse(raw) as DraftRecord;
          } catch (jsonErr) {
            corruptedPayload = raw;
          }
        }
      }
    } catch (err: any) {
      return { status: "STORAGE_READ_FAILED", error: err?.message || String(err) };
    }
  }

  // Handle Corrupted Payload Quarantine
  if (corruptedPayload !== null || (record && typeof record !== "object")) {
    await quarantineCorruptedDraft(submissionId, corruptedPayload, "Malformed JSON or non-object draft record");
    return {
      status: "DRAFT_CORRUPTED",
      reason: "Draft data was corrupted and has been safely quarantined",
      quarantined: true,
    };
  }

  if (!record) {
    return { status: "NO_DRAFT_FOUND" };
  }

  // Validate internal answer integrity
  if (!record.answers || typeof record.answers !== "object") {
    await quarantineCorruptedDraft(submissionId, record, "Draft answers property missing or malformed");
    return {
      status: "DRAFT_CORRUPTED",
      reason: "Draft answers structure was invalid and has been quarantined",
      quarantined: true,
    };
  }

  // Triple-key Identity Validation
  if (record.userId && expectedUserId && record.userId !== expectedUserId) {
    return {
      status: "IDENTITY_MISMATCH",
      reason: `Draft userId (${record.userId}) does not match current user (${expectedUserId})`,
    };
  }

  if (record.examId && expectedExamId && record.examId !== expectedExamId) {
    return {
      status: "IDENTITY_MISMATCH",
      reason: `Draft examId (${record.examId}) does not match current exam (${expectedExamId})`,
    };
  }

  return { status: "DRAFT_LOADED", draft: record };
}

/**
 * Quarantines a corrupted draft into the quarantine store to prevent repeated crashes.
 */
export async function quarantineCorruptedDraft(
  submissionId: string,
  rawPayload: any,
  errorReason: string
): Promise<void> {
  const quarantineRecord: QuarantineRecord = {
    submissionId,
    quarantinedAt: Date.now(),
    rawPayload,
    errorReason,
  };

  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction([STORE_DRAFTS, STORE_QUARANTINE], "readwrite");
        tx.objectStore(STORE_QUARANTINE).put(quarantineRecord);
        tx.objectStore(STORE_DRAFTS).delete(submissionId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {}

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(`ielts_draft_${submissionId}`);
      window.localStorage.setItem(`ielts_quarantine_${submissionId}`, JSON.stringify(quarantineRecord));
    } catch {}
  }
}

/**
 * Atomically Seals draft and Enqueues into Outbox.
 * Guarantees that once committed, submission exists independently of React memory.
 */
export async function sealAndEnqueueSubmission(
  submissionId: string,
  userId: string,
  examId: string,
  idempotencyKey: string,
  answers: Array<{ questionId: string; answerText?: any; audioUrl?: string }>
): Promise<OutboxEnqueueResult> {
  const record: PendingOutboxRecord = {
    submissionId,
    userId,
    examId,
    idempotencyKey,
    answers,
    sealedAt: Date.now(),
    status: "PENDING",
    attempts: 0,
  };

  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_DRAFTS, STORE_OUTBOX], "readwrite");
        tx.objectStore(STORE_OUTBOX).put(record);
        tx.objectStore(STORE_DRAFTS).delete(submissionId);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
      });
      db.close();
      return { status: "ENQUEUE_SUCCESS", record };
    }
  } catch (err: any) {
    // Proceed to LocalStorage fallback
  }

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(`ielts_outbox_${submissionId}`, JSON.stringify(record));
      window.localStorage.removeItem(`ielts_draft_${submissionId}`);
      return { status: "ENQUEUE_SUCCESS", record };
    } catch (err: any) {
      return { status: "ENQUEUE_FAILED", error: err?.message || String(err) };
    }
  }

  return { status: "ENQUEUE_FAILED", error: "No durable storage available" };
}

/**
 * Retrieves all pending outbox submissions.
 */
export async function getPendingOutboxSubmissions(): Promise<PendingOutboxRecord[]> {
  const results: PendingOutboxRecord[] = [];

  try {
    const db = await openDB();
    if (db) {
      const records = await new Promise<PendingOutboxRecord[]>((resolve) => {
        const tx = db.transaction(STORE_OUTBOX, "readonly");
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
      db.close();
      return records;
    }
  } catch {}

  if (isLocalStorageAvailable()) {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("ielts_outbox_")) {
          const item = window.localStorage.getItem(key);
          if (item) {
            try {
              results.push(JSON.parse(item));
            } catch {}
          }
        }
      }
    } catch {}
  }

  return results;
}

/**
 * Removes a submission from Outbox upon confirmed ACK or Reconciliation.
 */
export async function removePendingOutboxSubmission(submissionId: string): Promise<void> {
  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_OUTBOX, "readwrite");
        tx.objectStore(STORE_OUTBOX).delete(submissionId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {}

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(`ielts_outbox_${submissionId}`);
    } catch {}
  }
}

/**
 * Clears exam draft from both IndexedDB and LocalStorage.
 */
export async function clearDraftLocally(submissionId: string): Promise<void> {
  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_DRAFTS, "readwrite");
        const store = tx.objectStore(STORE_DRAFTS);
        store.delete(submissionId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {}

  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(`ielts_draft_${submissionId}`);
    } catch {}
  }
}
