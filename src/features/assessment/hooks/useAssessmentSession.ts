import { useState, useEffect, useCallback, useRef } from "react";
import { assessmentApi } from "@/lib/api";
import { AssessmentSessionState, AssessmentTestStructure } from "../domain/assessment.types";

const LOCAL_STORAGE_PREFIX = "aris_placement_draft_";

export function useAssessmentSession(sessionId?: string) {
  const [session, setSession] = useState<AssessmentSessionState | null>(null);
  const [testPayload, setTestPayload] = useState<AssessmentTestStructure | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const answersRef = useRef<Record<string, any>>({});
  answersRef.current = answers;
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Session & Sanitized Test Structure on mount
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
      try {
        const data = await assessmentApi.getTestPayload(sessionId);
        if (!isMounted) return;

        setSession(data.session);
        setTestPayload(data.test);

        // UI Recovery: Load local draft if available, otherwise server answers
        let restoredAnswers = data.session.answers || {};
        try {
          const localDraftRaw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${sessionId}`);
          if (localDraftRaw) {
            const parsed = JSON.parse(localDraftRaw);
            restoredAnswers = { ...restoredAnswers, ...parsed };
          }
        } catch {}

        setAnswers(restoredAnswers);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Không thể tải nội dung bài khảo thí. Vui lòng kiểm tra lại kết nối.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // 2. Answer change handler with dual-layer persistence (localStorage + debounced server sync)
  const setAnswer = useCallback(
    (questionId: string, value: any) => {
      if (!sessionId) return;

      const nextAnswers = { ...answersRef.current, [questionId]: value };
      answersRef.current = nextAnswers;
      setAnswers(nextAnswers);

      // Layer 1: Instant LocalStorage UI Recovery
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${sessionId}`, JSON.stringify(nextAnswers));
      } catch {}

      // Layer 2: Debounced Server Authoritative Sync (1500ms)
      setSaveStatus("saving");
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          await assessmentApi.autosave(sessionId, answersRef.current);
          setSaveStatus("saved");
        } catch (err) {
          console.warn("[Assessment Autosave Notice]", err);
          setSaveStatus("error");
        }
      }, 1500);
    },
    [sessionId],
  );

  const clearLocalDraft = useCallback(() => {
    if (sessionId) {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${sessionId}`);
      } catch {}
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
  };
}
