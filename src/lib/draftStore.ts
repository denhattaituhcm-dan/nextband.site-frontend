/**
 * Resilient Client-Side Draft Store (IndexedDB + Versioning with LocalStorage Fallback)
 * Protects student answers against network drops, accidental tab closures, and multi-tab conflicts.
 */

const DB_NAME = "ielts_exam_drafts_db";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

export interface DraftRecord {
  submissionId: string;
  draftVersion: number;
  lastSavedAt: number;
  answers: any[];
  questionSetVersion?: number;
}

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
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
    } catch {
      resolve(null);
    }
  });
}

export async function saveDraftLocally(
  submissionId: string,
  answers: any[],
  currentVersion?: number,
): Promise<number> {
  const version = typeof currentVersion === "number" ? currentVersion + 1 : 1;
  const draft: DraftRecord = {
    submissionId,
    draftVersion: version,
    lastSavedAt: Date.now(),
    answers,
  };

  // 1. Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(draft);
        req.onsuccess = () => resolve();
        req.onerror = () => reject();
      });
      db.close();
    }
  } catch {}

  // 2. Backup in localStorage for immediate sync access
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(`ielts_draft_${submissionId}`, JSON.stringify(draft));
    }
  } catch {}

  return version;
}

export async function loadDraftLocally(submissionId: string): Promise<DraftRecord | null> {
  // 1. Try IndexedDB
  try {
    const db = await openDB();
    if (db) {
      const record = await new Promise<DraftRecord | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(submissionId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      db.close();
      if (record) return record;
    }
  } catch {}

  // 2. Fallback to localStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const item = localStorage.getItem(`ielts_draft_${submissionId}`);
      if (item) {
        return JSON.parse(item) as DraftRecord;
      }
    }
  } catch {}

  return null;
}

export async function clearDraftLocally(submissionId: string): Promise<void> {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(submissionId);
      db.close();
    }
  } catch {}

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(`ielts_draft_${submissionId}`);
    }
  } catch {}
}
