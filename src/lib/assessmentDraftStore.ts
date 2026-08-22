/**
 * Resilient Offline Draft & Audio Outbox Store for ARIS Clean-Room Assessment
 * Primary: IndexedDB | Fallback: LocalStorage
 */

const DB_NAME = "aris_assessment_drafts_db";
const STORE_DRAFTS = "assessment_drafts";
const STORE_AUDIO = "assessment_audio_outbox";
const DB_VERSION = 1;

export interface AssessmentDraftRecord {
  sessionId: string;
  answers: Record<string, any>;
  lastSavedAt: number;
  isPendingSync: boolean;
}

export interface PendingAudioRecord {
  sessionId: string;
  recordingId: string;
  blob: Blob;
  durationMs: number;
  createdAt: number;
  status: "PENDING" | "UPLOADING" | "UPLOADED";
}

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined" && window.indexedDB !== null;
}

const STORE_PAYLOADS = "assessment_payloads";

export interface AssessmentPayloadCache {
  sessionId: string;
  payload: any;
  cachedAt: number;
}

function openAssessmentDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
          db.createObjectStore(STORE_DRAFTS, { keyPath: "sessionId" });
        }
        if (!db.objectStoreNames.contains(STORE_AUDIO)) {
          db.createObjectStore(STORE_AUDIO, { keyPath: "sessionId" });
        }
        if (!db.objectStoreNames.contains(STORE_PAYLOADS)) {
          db.createObjectStore(STORE_PAYLOADS, { keyPath: "sessionId" });
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

// Save Test Structure Payload locally
export async function saveAssessmentPayloadLocally(
  sessionId: string,
  payload: any,
): Promise<boolean> {
  try {
    const db = await openAssessmentDB();
    if (db) {
      const record: AssessmentPayloadCache = {
        sessionId,
        payload,
        cachedAt: Date.now(),
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_PAYLOADS, "readwrite");
        const store = tx.objectStore(STORE_PAYLOADS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
        tx.oncomplete = () => resolve();
      });
      db.close();
    }
  } catch {}

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(`aris_placement_payload_${sessionId}`, JSON.stringify(payload));
    }
  } catch {}
  return true;
}

// Load Test Structure Payload locally
export async function loadAssessmentPayloadLocally(
  sessionId: string,
): Promise<any | null> {
  try {
    const db = await openAssessmentDB();
    if (db) {
      const record = await new Promise<AssessmentPayloadCache | null>((resolve, reject) => {
        const tx = db.transaction(STORE_PAYLOADS, "readonly");
        const store = tx.objectStore(STORE_PAYLOADS);
        const req = store.get(sessionId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e);
      });
      db.close();
      if (record && record.payload) {
        return record.payload;
      }
    }
  } catch {}

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(`aris_placement_payload_${sessionId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

// 1. Save Assessment Answers Draft
export async function saveAssessmentDraftLocally(
  sessionId: string,
  answers: Record<string, any>,
  isPendingSync = false
): Promise<boolean> {
  const record: AssessmentDraftRecord = {
    sessionId,
    answers,
    lastSavedAt: Date.now(),
    isPendingSync,
  };

  // Primary: IndexedDB
  try {
    const db = await openAssessmentDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readwrite");
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
        tx.oncomplete = () => resolve();
      });
      db.close();
    }
  } catch (err) {
    console.warn("[AssessmentDraft] IndexedDB write notice:", err);
  }

  // Fallback / Dual Layer: LocalStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(`aris_placement_draft_${sessionId}`, JSON.stringify(answers));
    }
  } catch {}

  return true;
}

// 2. Load Assessment Answers Draft
export async function loadAssessmentDraftLocally(sessionId: string): Promise<Record<string, any> | null> {
  // Try IndexedDB first
  try {
    const db = await openAssessmentDB();
    if (db) {
      const record = await new Promise<AssessmentDraftRecord | null>((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readonly");
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.get(sessionId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e);
      });
      db.close();
      if (record && record.answers) {
        return record.answers;
      }
    }
  } catch (err) {
    console.warn("[AssessmentDraft] IndexedDB read notice:", err);
  }

  // Fallback to LocalStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(`aris_placement_draft_${sessionId}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {}

  return null;
}

// 3. Clear Assessment Draft
export async function clearAssessmentDraftLocally(sessionId: string): Promise<void> {
  try {
    const db = await openAssessmentDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_DRAFTS, "readwrite");
        const store = tx.objectStore(STORE_DRAFTS);
        store.delete(sessionId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {}

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(`aris_placement_draft_${sessionId}`);
    }
  } catch {}
}

// 4. Save Pending Speaking Audio Blob into Outbox
export async function savePendingAudioBlob(
  sessionId: string,
  recordingId: string,
  blob: Blob,
  durationMs: number
): Promise<boolean> {
  const record: PendingAudioRecord = {
    sessionId,
    recordingId,
    blob,
    durationMs,
    createdAt: Date.now(),
    status: "PENDING",
  };

  try {
    const db = await openAssessmentDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_AUDIO, "readwrite");
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
        tx.oncomplete = () => resolve();
      });
      db.close();
      return true;
    }
  } catch (err) {
    console.warn("[AssessmentAudio] IndexedDB audio save notice:", err);
  }
  return false;
}

// 5. Get Pending Speaking Audio Blob from Outbox
export async function getPendingAudioBlob(sessionId: string): Promise<PendingAudioRecord | null> {
  try {
    const db = await openAssessmentDB();
    if (db) {
      const record = await new Promise<PendingAudioRecord | null>((resolve, reject) => {
        const tx = db.transaction(STORE_AUDIO, "readonly");
        const store = tx.objectStore(STORE_AUDIO);
        const req = store.get(sessionId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e);
      });
      db.close();
      return record;
    }
  } catch {}
  return null;
}

// 6. Clear Pending Speaking Audio Blob
export async function clearPendingAudioBlob(sessionId: string): Promise<void> {
  try {
    const db = await openAssessmentDB();
    if (db) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_AUDIO, "readwrite");
        const store = tx.objectStore(STORE_AUDIO);
        store.delete(sessionId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      db.close();
    }
  } catch {}
}
