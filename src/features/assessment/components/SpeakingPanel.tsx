import React, { useState } from "react";
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSpeakingRecorder } from "../hooks/useSpeakingRecorder";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";

interface SpeakingPanelProps {
  sessionId: string;
  title: string;
  part1Questions: string[];
  part2Topic: string;
  part2Cues: string[];
  maxDurationSeconds?: number;
  onAudioRecorded: (storagePath: string) => void;
}

export function SpeakingPanel({
  sessionId,
  title,
  part1Questions,
  part2Topic,
  part2Cues,
  maxDurationSeconds = 120,
  onAudioRecorded,
}: SpeakingPanelProps) {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "failed">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);

  const {
    isRecording,
    recordSeconds,
    remainingSeconds,
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
    onAudioReady: (blob, _localUrl) => {
      handleUploadRecording(blob);
    },
  });

  const handleUploadRecording = async (blob: Blob) => {
    setUploadState("uploading");
    setUploadError(null);

    try {
      const recordingId = crypto.randomUUID();
      const storagePath = `speaking-recordings/${recordingId}.webm`;

      // Step 1: Register Draft in Backend
      try {
        await fetch(`${API_BASE_URL}/speaking/register-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: recordingId,
            referenceType: "PLACEMENT_SESSION",
            referenceId: sessionId,
            questionId: "speaking_part_1_2",
          }),
        });
      } catch (regErr) {
        console.warn("[Speaking] Draft registration notice:", regErr);
      }

      // Step 2: Direct Upload to Supabase Storage (Private bucket)
      const { error: storageError } = await supabase.storage
        .from("speaking-recordings")
        .upload(`${recordingId}.webm`, blob, {
          contentType: blob.type || "audio/webm",
          upsert: true,
        });

      if (storageError) {
        throw new Error(storageError.message || "Tải lên Supabase Storage thất bại");
      }

      // Step 3: Confirm Asset in Backend
      try {
        await fetch(`${API_BASE_URL}/speaking/confirm-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: recordingId,
            storagePath,
            sizeBytes: blob.size,
            durationMs: recordSeconds * 1000,
            mimeType: blob.type || "audio/webm",
          }),
        });
      } catch (confErr) {
        console.warn("[Speaking] Confirm upload notice:", confErr);
      }

      // Step 4: Pass canonical storagePath (Never blob: URL!)
      setUploadedStoragePath(storagePath);
      onAudioRecorded(storagePath);
      setUploadState("success");
    } catch (err: any) {
      console.error("[Speaking] Upload error:", err);
      setUploadError(err?.message || "Tải lên tệp ghi âm thất bại. Vui lòng nhấn Thử lại.");
      setUploadState("failed");
    }
  };

  const handleRetryUpload = () => {
    if (audioBlob) {
      handleUploadRecording(audioBlob);
    }
  };

  const handleReset = () => {
    resetRecording();
    setUploadState("idle");
    setUploadError(null);
    setUploadedStoragePath(null);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-background border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Ghi âm câu trả lời Speaking Part 1 & Part 2 để chuyên gia đánh giá phát âm & độ trôi chảy
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-bold bg-background">
          Thời lượng: {Math.floor(maxDurationSeconds / 60)} phút
        </Badge>
      </div>

      {/* Part 1 Topic */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
          Part 1: Phỏng vấn ngắn (1 – 2 phút)
        </span>
        <div className="space-y-2">
          {part1Questions.map((q, idx) => (
            <p key={idx} className="text-sm font-bold text-foreground">
              {q}
            </p>
          ))}
        </div>
      </div>

      {/* Part 2 Cue Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3 shadow-xs">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
          Part 2: Trình bày chủ đề (1 – 2 phút)
        </span>
        <p className="text-base font-extrabold text-foreground">{part2Topic}</p>
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">You should say:</p>
          <ul className="list-disc pl-4 space-y-1">
            {part2Cues.map((cue, idx) => (
              <li key={idx}>{cue}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Audio Recorder Card */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm text-center">
        {permissionError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-xs font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}

        {isAutoStopped && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Đã đạt thời lượng tối đa ({Math.floor(maxDurationSeconds / 60)} phút). Hệ thống đã tự động dừng thu âm.</span>
          </div>
        )}

        <div className="py-2">
          {isRecording ? (
            <div className="space-y-3">
              <div className="w-20 h-20 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center mx-auto animate-pulse">
                <Mic className="w-10 h-10 animate-bounce" />
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Đã ghi</span>
                  <div className="font-mono font-black text-2xl text-red-600">{formattedRecordTime}</div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Còn lại</span>
                  <div className="font-mono font-black text-2xl text-foreground">{formattedRemainingTime}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Đang thu âm... Hãy nói rõ ràng vào micro.</p>
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="h-11 px-6 rounded-2xl font-bold text-sm shadow-md gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Dừng & Lưu Bài Nói</span>
              </Button>
            </div>
          ) : uploadState === "uploading" ? (
            <div className="space-y-3 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h4 className="font-bold text-sm text-foreground">Đang tải bài nói lên máy chủ lưu trữ...</h4>
              <p className="text-xs text-muted-foreground">Vui lòng chờ trong giây lát</p>
            </div>
          ) : uploadState === "failed" ? (
            <div className="space-y-4 py-2 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-destructive">Tải lên thất bại</h4>
                <p className="text-xs text-muted-foreground mt-1">{uploadError}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={handleRetryUpload}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử tải lên lại</span>
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="font-bold text-xs rounded-xl h-10 px-4"
                >
                  Ghi âm lại từ đầu
                </Button>
              </div>
            </div>
          ) : audioUrl ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Đã ghi âm & tải lên thành công ({formattedRecordTime})</h4>
                <p className="text-xs text-muted-foreground">Bạn có thể nghe lại bên dưới trước khi nộp bài.</p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/60 border border-border flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <audio controls src={audioUrl} className="w-full h-10 outline-hidden" />
              </div>

              <Button
                onClick={handleReset}
                variant="outline"
                className="h-10 px-4 rounded-xl font-bold text-xs gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thu âm lại</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Bắt đầu ghi âm câu trả lời</h4>
                <p className="text-xs text-muted-foreground">Thời lượng tối đa: {Math.floor(maxDurationSeconds / 60)} phút. Nhấn nút để bắt đầu.</p>
              </div>
              <Button
                onClick={startRecording}
                className="h-12 px-7 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Bắt Đầu Thu Âm</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
