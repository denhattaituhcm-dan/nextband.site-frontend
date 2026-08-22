import { useState, useEffect, useCallback, useRef } from "react";
import { assessmentApi } from "@/lib/api";
import { AssessmentSessionState, AssessmentTestStructure } from "../domain/assessment.types";
import {
  saveAssessmentDraftLocally,
  loadAssessmentDraftLocally,
  clearAssessmentDraftLocally,
  saveAssessmentPayloadLocally,
  loadAssessmentPayloadLocally,
} from "@/lib/assessmentDraftStore";

export function useAssessmentSession(sessionId?: string) {
  const [session, setSession] = useState<AssessmentSessionState | null>(null);
  const [testPayload, setTestPayload] = useState<AssessmentTestStructure | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "offline" | "syncing" | "error">("idle");
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const answersRef = useRef<Record<string, any>>({});
  answersRef.current = answers;
  const isPendingSyncRef = useRef<boolean>(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Session & Sanitized Test Structure on mount with Dual-Layer Offline Draft Recovery
  useEffect(() => {
    if (!sessionId) {
      setError("Không tìm thấy mã phiên khảo thí. Vui lòng đăng ký tham gia.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      // Step 1: Immediately read draft and cached test structure from local durable store
      const localDraft = await loadAssessmentDraftLocally(sessionId);
      const cachedData = await loadAssessmentPayloadLocally(sessionId);

      if (isMounted) {
        if (localDraft) {
          answersRef.current = localDraft;
          setAnswers(localDraft);
        }
        if (cachedData?.session && cachedData?.test) {
          setSession(cachedData.session);
          setTestPayload(cachedData.test);
          setIsLoading(false);
        }
      }

      // Step 2: Query Server
      try {
        const data = await assessmentApi.getTestPayload(sessionId);
        if (!isMounted) return;

        setSession(data.session);
        setTestPayload(data.test);
        await saveAssessmentPayloadLocally(sessionId, data);

        // Merge server answers with any local unsynced edits (local edits take precedence)
        const serverAnswers = data.session.answers || {};
        const mergedAnswers = { ...serverAnswers, ...(localDraft || {}) };

        answersRef.current = mergedAnswers;
        setAnswers(mergedAnswers);
        await saveAssessmentDraftLocally(sessionId, mergedAnswers, false);
      } catch (err: any) {
        if (!isMounted) return;
        // If we already loaded cached test structure or local draft, do NOT crash the exam room
        if (cachedData?.test || localDraft) {
          setError(null);
        } else {
          setError(err.message || "Không thể tải nội dung bài khảo thí. Vui lòng kiểm tra lại kết nối.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // 2. Perform background server sync
  const performSync = useCallback(
    async (payloadToSync: Record<string, any>) => {
      if (!sessionId) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setSaveStatus("offline");
        isPendingSyncRef.current = true;
        await saveAssessmentDraftLocally(sessionId, payloadToSync, true);
        return;
      }

      setSaveStatus("saving");
      try {
        await assessmentApi.autosave(sessionId, payloadToSync);
        isPendingSyncRef.current = false;
        await saveAssessmentDraftLocally(sessionId, payloadToSync, false);
        setSaveStatus("saved");
      } catch (err) {
        console.warn("[Assessment Autosave Network Notice]", err);
        isPendingSyncRef.current = true;
        setSaveStatus("offline");
        await saveAssessmentDraftLocally(sessionId, payloadToSync, true);
      }
    },
    [sessionId],
  );

  // 3. Online / Offline Reconnection & Auto-Flush
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      if (sessionId && isPendingSyncRef.current) {
        setSaveStatus("syncing");
        await performSync(answersRef.current);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sessionId, performSync]);

  // 4. Answer change handler with immediate durable write + debounced server sync
  const setAnswer = useCallback(
    (questionId: string, value: any) => {
      if (!sessionId) return;

      const nextAnswers = { ...answersRef.current, [questionId]: value };
      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);

      // Layer 1: Instant Durable Write (IndexedDB + localStorage)
      isPendingSyncRef.current = true;
      saveAssessmentDraftLocally(sessionId, nextAnswers, true);

      // Layer 2: Debounced Server Authoritative Sync (1200ms)
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(() => {
        performSync(nextAnswers);
      }, 1200);
    },
    [sessionId, performSync],
  );

  const clearLocalDraft = useCallback(() => {
    if (sessionId) {
      clearAssessmentDraftLocally(sessionId);
    }
  }, [sessionId]);

  return {
    session,
    testPayload,
    answers,
    setAnswer,
    clearLocalDraft,
    isLoading,
    error,
    saveStatus,
    isOnline,
    flushPendingSync: () => performSync(answersRef.current),
  };
}
