import React, { useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeakingRecorder } from "../hooks/useSpeakingRecorder";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL, formatStorageUrl } from "@/lib/api";
import { savePendingAudioBlob, clearPendingAudioBlob } from "@/lib/assessmentDraftStore";

const MAX_ATTEMPTS = 3;

interface PartRecorderProps {
  /** e.g. "Part 1" or "Part 2" — used in button labels and status text */
  partLabel: string;
  /** Unique key saved into answers: "speaking_part1" | "speaking_part2" */
  questionId: string;
  sessionId: string;
  maxDurationSeconds?: number;
  /** Called with new storagePath once upload succeeds */
  onUploaded: (storagePath: string) => void;
}

export function PartRecorder({
  partLabel,
  questionId,
  sessionId,
  maxDurationSeconds = 120,
  onUploaded,
}: PartRecorderProps) {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "failed">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [recordedPath, setRecordedPath] = useState<string | null>(null);
  // attemptCount tracks completed recordings (incremented after each successful upload)
  const [attemptCount, setAttemptCount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    isRecording,
    recordSeconds,
    formattedRecordTime,
    formattedRemainingTime,
    isAutoStopped,
    audioUrl,
    audioBlob,
    permissionError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useSpeakingRecorder({
    maxDurationSeconds,
    onAudioReady: (blob) => {
      handleUploadRecording(blob);
    },
  });

  const handleUploadRecording = async (blob: Blob) => {
    setUploadState("uploading");
    setUploadError(null);

    const recordingId = crypto.randomUUID();
    const newPath = `speaking-recordings/${recordingId}.webm`;
    const oldPath = recordedPath; // capture before state update

    // Layer 1: Durable local outbox (IndexedDB) — survives network failures
    await savePendingAudioBlob(sessionId, `${questionId}_${recordingId}`, blob, recordSeconds * 1000);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setUploadError(
        "Thiết bị đang ngoại tuyến. Bản ghi âm đã được bảo toàn và sẽ tải lên khi có mạng.",
      );
      setUploadState("failed");
      return;
    }

    try {
      // Step 1: Register draft in backend
      try {
        await fetch(`${API_BASE_URL}/speaking/register-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: recordingId,
            referenceType: "PLACEMENT_SESSION",
            referenceId: sessionId,
            questionId,
          }),
        });
      } catch (regErr) {
        console.warn("[Speaking] Draft registration notice:", regErr);
      }

      // Step 2: Upload new file to Supabase Storage (primary 'exam-assets' with fallback)
      let storageError: any = null;
      const { error: primaryErr } = await supabase.storage
        .from("exam-assets")
        .upload(newPath, blob, {
          contentType: blob.type || "audio/webm",
          upsert: true,
        });

      if (primaryErr) {
        const { error: fallbackErr } = await supabase.storage
          .from("speaking-recordings")
          .upload(`${recordingId}.webm`, blob, {
            contentType: blob.type || "audio/webm",
            upsert: true,
          });
        if (fallbackErr) {
          storageError = primaryErr;
        }
      }

      if (storageError) {
        throw new Error(storageError.message || "Tải lên Supabase Storage thất bại");
      }

      // Step 3: Confirm upload in backend
      try {
        await fetch(`${API_BASE_URL}/speaking/confirm-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: recordingId,
            storagePath: newPath,
            sizeBytes: blob.size,
            durationMs: recordSeconds * 1000,
            mimeType: blob.type || "audio/webm",
          }),
        });
      } catch (confErr) {
        console.warn("[Speaking] Confirm upload notice:", confErr);
      }

      // Step 4: Delete old file ONLY after new one is confirmed — safe delete
      if (oldPath) {
        try {
          const oldCleanPath = oldPath.startsWith("/") ? oldPath.slice(1) : oldPath;
          await supabase.storage.from("exam-assets").remove([oldCleanPath]);
        } catch (delErr) {
          // Non-fatal: old file will expire by storage retention policy
          console.warn("[Speaking] Old file cleanup notice:", delErr);
        }
      }

      // Step 5: Clear local outbox + update component state
      await clearPendingAudioBlob(sessionId);
      setRecordedPath(newPath);
      setAttemptCount((c) => c + 1);
      onUploaded(newPath);
      setUploadState("success");
    } catch (err: any) {
      console.error("[Speaking] Upload error:", err);
      setUploadError(err?.message || "Tải lên bản ghi âm thất bại. Vui lòng nhấn Thử lại.");
      setUploadState("failed");
    }
  };

  // Auto-retry when device comes back online after a failed upload
  React.useEffect(() => {
    const handleOnline = () => {
      if (uploadState === "failed" && audioBlob) {
        handleUploadRecording(audioBlob);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [uploadState, audioBlob]);

  const handleRetryUpload = () => {
    if (audioBlob) handleUploadRecording(audioBlob);
  };

  const handleReRecordRequest = () => {
    if (attemptCount >= MAX_ATTEMPTS) return;
    setShowConfirm(true);
  };

  const handleConfirmReRecord = () => {
    setShowConfirm(false);
    resetRecording();
    setUploadState("idle");
    setUploadError(null);
    // Note: recordedPath is kept so we can delete the old file after new upload succeeds
  };

  const canReRecord = attemptCount < MAX_ATTEMPTS;
  const attemptsLeft = MAX_ATTEMPTS - attemptCount;

  return (
    <div className="border-t border-border/60 pt-4 space-y-3">
      {/* Permission error */}
      {permissionError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs font-medium space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold text-foreground">Microphone chưa được cấp quyền hoặc không khả dụng</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Vui lòng nhấn vào biểu tượng ổ khóa/cài đặt trên thanh địa chỉ trình duyệt, chọn <strong>Cho phép (Allow) Microphone</strong> rồi bấm Thử lại.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={startRecording}
              className="h-8 px-3 rounded-xl text-xs font-bold bg-brand-blue hover:bg-brand-blue-hover text-white gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại cấp quyền</span>
            </Button>
          </div>
        </div>
      )}

      {/* Auto-stopped notice */}
      {isAutoStopped && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Đã đạt thời lượng tối đa ({Math.floor(maxDurationSeconds / 60)} phút). Hệ thống đã tự dừng.
          </span>
        </div>
      )}

      {/* Inline re-record confirm */}
      {showConfirm && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 space-y-3">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
            Bản ghi hiện tại của {partLabel} sẽ được thay thế. Tiếp tục thu lại?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConfirmReRecord}
              className="h-8 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Xác nhận — Thu lại
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="h-8 px-3 rounded-xl text-xs font-bold"
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* ── Recording active ── */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center animate-pulse shrink-0">
              <Mic className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-700 dark:text-red-400">
                Đang thu âm {partLabel}…
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm font-black text-red-600">{formattedRecordTime}</span>
                <span className="text-[11px] text-muted-foreground">/ còn {formattedRemainingTime}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="sm"
            className="h-9 px-4 rounded-xl font-bold text-xs gap-1.5 shrink-0"
          >
            <Square className="w-3 h-3 fill-current" />
            Dừng &amp; Lưu
          </Button>
        </div>

      ) : uploadState === "uploading" ? (
        /* ── Uploading ── */
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-foreground">Đang tải bản ghi lên máy chủ…</div>
            <div className="text-[11px] text-muted-foreground">Vui lòng không đóng trang</div>
          </div>
        </div>

      ) : uploadState === "failed" ? (
        /* ── Upload failed ── */
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{uploadError}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRetryUpload}
              size="sm"
              className="h-8 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Thử tải lên lại
            </Button>
            {canReRecord && (
              <Button
                onClick={handleReRecordRequest}
                size="sm"
                variant="outline"
                className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                Thu lại từ đầu
              </Button>
            )}
          </div>
        </div>

      ) : uploadState === "success" && audioUrl ? (
        /* ── Success — playback + re-record ── */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">
                Đã thu âm {partLabel} — {formattedRecordTime}
              </span>
            </div>
            {canReRecord ? (
              <span className="text-[10px] text-muted-foreground">Còn {attemptsLeft} lần thu lại</span>
            ) : (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Đã hết lượt thu lại</span>
            )}
          </div>

          {/* Inline audio player */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-muted/50 border border-border">
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <audio controls src={formatStorageUrl(audioUrl)} className="w-full h-8 outline-hidden" />
          </div>

          {canReRecord && !showConfirm && (
            <Button
              onClick={handleReRecordRequest}
              size="sm"
              variant="outline"
              className="h-8 px-4 rounded-xl text-xs font-bold gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Thu lại {partLabel}
            </Button>
          )}
        </div>

      ) : (
        /* ── Idle — ready to start ── */
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Tối đa {Math.floor(maxDurationSeconds / 60)} phút · {MAX_ATTEMPTS} lần thu
          </p>
          <Button
            onClick={startRecording}
            disabled={attemptCount >= MAX_ATTEMPTS}
            className="h-10 px-5 rounded-2xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" />
            Bắt đầu thu âm {partLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
