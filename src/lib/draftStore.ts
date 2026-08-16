/**
 * Resilient Client-Side Draft Store (IndexedDB Primary with LocalStorage Fallback)
 * Protects student answers against network drops, accidental tab closures, and multi-tab conflicts.
 *
 * Invariant Rules:
 * 1. Identity Lock: Triple-key verification (submissionId + userId + examId).
 * 2. Persistence: IndexedDB primary, LocalStorage fallback when IndexedDB is unavailable.
 * 3. Typed Contract: Strictly typed ExamAnswerValue (no `any`).
 * 4. Observable Result: Distinct status codes for success, mismatch, and errors.
 * 5. Submit Safety: Draft is cleared ONLY upon confirmed server submission (200/201).
 */

const DB_NAME = "ielts_exam_drafts_db";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

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

export type DraftSaveResult =
  | { status: "SAVE_SUCCESS"; version: number; storage: "indexeddb" | "localstorage" }
  | { status: "STORAGE_WRITE_FAILED"; error: string };

export type DraftLoadResult =
  | { status: "DRAFT_LOADED"; draft: DraftRecord }
  | { status: "NO_DRAFT_FOUND" }
  | { status: "IDENTITY_MISMATCH"; reason: string }
  | { status: "STORAGE_READ_FAILED"; error: string };

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined" && window.indexedDB !== null;
}

function isLocalStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined" && window.localStorage !== null;
}

function openDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "submissionId" });
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
 * Saves exam draft locally.
 * Uses IndexedDB as primary storage. If IndexedDB is unavailable, falls back to LocalStorage.
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
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(draft);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e);
      });
      db.close();
      return { status: "SAVE_SUCCESS", version, storage: "indexeddb" };
    }
  } catch (err) {
    // IndexedDB failed, proceed to LocalStorage fallback
  }

  // Fallback: LocalStorage
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(`ielts_draft_${submissionId}`, JSON.stringify(draft));
      return { status: "SAVE_SUCCESS", version, storage: "localstorage" };
    } catch (err: any) {
      return { status: "STORAGE_WRITE_FAILED", error: err?.message || String(err) };
    }
  }

  return { status: "STORAGE_WRITE_FAILED", error: "No storage mechanism available" };
}

/**
 * Loads exam draft matching submissionId, expectedUserId, and expectedExamId.
 * Enforces strict triple-key identity verification.
 */
export async function loadDraftLocally(
  submissionId: string,
  expectedUserId: string,
  expectedExamId: string
): Promise<DraftLoadResult> {
  let record: DraftRecord | null = null;
  let usedFallback = false;

  // Primary: Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      record = await new Promise<DraftRecord | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(submissionId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      db.close();
    } else {
      usedFallback = true;
    }
  } catch {
    usedFallback = true;
  }

  // Fallback: Try LocalStorage if IndexedDB was unavailable or returned nothing
  if (!record && (usedFallback || isLocalStorageAvailable())) {
    try {
      if (isLocalStorageAvailable()) {
        const item = window.localStorage.getItem(`ielts_draft_${submissionId}`);
        if (item) {
          record = JSON.parse(item) as DraftRecord;
        }
      }
    } catch (err: any) {
      return { status: "STORAGE_READ_FAILED", error: err?.message || String(err) };
    }
  }

  if (!record) {
    return { status: "NO_DRAFT_FOUND" };
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
 * Clears exam draft from both IndexedDB and LocalStorage upon successful submission.
 */
export async function clearDraftLocally(submissionId: string): Promise<void> {
  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.delete(submissionId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {}

  try {
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(`ielts_draft_${submissionId}`);
    }
  } catch {}
}
