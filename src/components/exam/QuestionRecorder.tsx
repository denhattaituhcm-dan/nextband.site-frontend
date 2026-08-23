import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, CheckCircle2, Play, Pause, RotateCcw, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL, getAuthToken } from "@/lib/api";

interface QuestionRecorderProps {
  questionId: string;
  answer: string;
  submissionId?: string;
  maxDurationSeconds?: number;
  onAnswerChange: (questionId: string, storagePath: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  className?: string;
}

function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);

  useEffect(() => {
    if (!src) return;
    if (src.startsWith("speaking-recordings/")) {
      const cleanPath = src.replace(/^speaking-recordings\//, "");
      supabase.storage
        .from("speaking-recordings")
        .createSignedUrl(cleanPath, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            setResolvedSrc(data.signedUrl);
          }
        })
        .catch(() => {
          setResolvedSrc(src);
        });
    } else {
      setResolvedSrc(src);
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [resolvedSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-neutral-900 dark:to-neutral-800 border border-orange-200/80 dark:border-orange-900/40 p-2 px-3.5 rounded-2xl shadow-xs max-w-xs w-full">
      <audio ref={audioRef} src={resolvedSrc} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 space-y-0.5">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-orange-200/80 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground font-semibold">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export function QuestionRecorder({
  questionId,
  answer,
  submissionId = "temp_exam_session",
  maxDurationSeconds = 180,
  onAnswerChange,
  onRecordingStateChange,
  className,
}: QuestionRecorderProps) {
  const [phase, setPhase] = useState<"idle" | "recording" | "processing" | "review" | "failed">(
    answer ? "review" : "idle",
  );
  const [recordTime, setRecordTime] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    isRecording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
    permissionStatus,
    requestPermission,
    analyserData,
  } = useAudioRecorder();

  const { startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  // Notify parent of recording state
  useEffect(() => {
    onRecordingStateChange?.(isRecording || phase === "recording");
  }, [isRecording, phase, onRecordingStateChange]);

  // Synchronize phase when answer changes externally
  useEffect(() => {
    if (answer && phase === "idle") {
      setPhase("review");
    }
  }, [answer, phase]);

  // Recording timer with auto-stop
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordTime((prev) => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stopRecording();
            stopListening();
            setPhase("processing");
          }
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording, maxDurationSeconds, stopRecording, stopListening]);

  // Direct Supabase Storage Upload
  const handleUploadAudio = async (blob: Blob) => {
    setPhase("processing");
    setUploadError(null);

    try {
      const recordingId = crypto.randomUUID();
      const storagePath = `speaking-recordings/${recordingId}.webm`;
      const token = await getAuthToken();
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Register Draft Asset in Backend
      try {
        await fetch(`${API_BASE_URL}/speaking/register-draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            id: recordingId,
            referenceType: "EXAM_SUBMISSION",
            referenceId: submissionId,
            questionId,
          }),
        });
      } catch (regErr) {
        console.warn("[Speaking] Draft register notice:", regErr);
      }

      // 2. Direct Upload to Supabase Storage (primary 'exam-assets' with fallback)
      let storageErr: any = null;
      const { error: primaryErr } = await supabase.storage
        .from("exam-assets")
        .upload(storagePath, blob, {
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
          storageErr = primaryErr;
        }
      }

      if (storageErr) {
        throw new Error(storageErr.message || "Tải lên Supabase Storage thất bại");
      }

      // 3. Confirm Asset in Backend
      try {
        await fetch(`${API_BASE_URL}/speaking/confirm-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            id: recordingId,
            storagePath,
            sizeBytes: blob.size,
            durationMs: recordTime * 1000,
            mimeType: blob.type || "audio/webm",
          }),
        });
      } catch (confErr) {
        console.warn("[Speaking] Confirm upload notice:", confErr);
      }

      // 4. Save canonical storagePath (Never blob: URL!)
      onAnswerChange(questionId, storagePath);
      setPhase("review");
    } catch (err: any) {
      console.error("[QuestionRecorder] Upload error:", err);
      setUploadError(err?.message || "Tải lên bài nói thất bại. Vui lòng bấm Thử lại.");
      setPhase("failed");
    }
  };

  useEffect(() => {
    if (audioBlob && phase === "processing") {
      handleUploadAudio(audioBlob);
    }
  }, [audioBlob, phase]);

  const handleStartRecording = async () => {
    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    resetRecording();
    resetTranscript();
    setRecordTime(0);
    setUploadError(null);
    setPhase("recording");

    await startRecording();
    startListening();
  };

  const handleStopRecording = () => {
    setPhase("processing");
    stopRecording();
    stopListening();
  };

  const handleRetry = () => {
    if (audioBlob) {
      handleUploadAudio(audioBlob);
    }
  };

  const handleReset = () => {
    resetRecording();
    setRecordTime(0);
    setUploadError(null);
    setPhase("idle");
    onAnswerChange(questionId, "");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (permissionStatus === "denied") {
    return (
      <div className="text-xs font-semibold text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20">
        Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt để thực hiện phần thi nói.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 pt-1", className)}>
      {/* State 1: Idle */}
      {!answer && phase === "idle" && (
        <div className="flex items-center gap-3">
          <Button
            size="default"
            onClick={handleStartRecording}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-full px-6 shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Mic className="mr-2 h-4 w-4 animate-pulse" />
            Bắt đầu ghi âm
          </Button>
          <span className="text-xs text-muted-foreground font-medium italic hidden sm:inline">
            Tối đa: {Math.floor(maxDurationSeconds / 60)} phút. Nhấn để bắt đầu.
          </span>
        </div>
      )}

      {/* State 2: Active Recording */}
      {phase === "recording" && (
        <div className="bg-gradient-to-b from-white to-orange-50/50 dark:from-neutral-900 dark:to-neutral-800/80 rounded-2xl p-4 border-2 border-orange-400/60 dark:border-orange-600/60 shadow-lg space-y-4 animate-in zoom-in-95 fill-mode-both">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive font-extrabold animate-pulse">
              <div className="w-3 h-3 rounded-full bg-destructive shadow-sm shadow-destructive/50" />
              <span className="text-xs uppercase tracking-wider">
                ĐANG GHI ÂM...
              </span>
            </div>
            <span className="font-mono font-extrabold text-2xl text-orange-600 dark:text-orange-400">
              {formatTime(recordTime)}
            </span>
          </div>

          <AudioWaveform
            data={analyserData}
            isRecording={true}
            className="h-14 w-full"
          />

          <div className="text-xs text-muted-foreground italic text-center font-medium">
            Hệ thống đang ghi âm... Nhấn nút dưới đây khi hoàn tất câu trả lời.
          </div>

          <Button
            onClick={handleStopRecording}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3.5 rounded-2xl shadow-md shadow-orange-500/20 text-sm transition-all"
          >
            <Square className="h-4 w-4 fill-current mr-2" />
            Dừng ghi & Lưu bài nói
          </Button>
        </div>
      )}

      {/* State 3: Processing */}
      {phase === "processing" && (
        <div className="bg-orange-50/80 dark:bg-neutral-900 rounded-2xl p-5 border border-orange-200/80 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-extrabold text-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>ĐANG TẢI BÀI NÓI LÊN STORAGE...</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium text-center">
            Vui lòng chờ trong giây lát để hệ thống lưu tệp ghi âm.
          </p>
        </div>
      )}

      {/* State 4: Failed with Retry */}
      {phase === "failed" && (
        <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-4 border border-red-200 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-destructive font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{uploadError || "Tải lên bài nói thất bại"}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={handleRetry}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử tải lên lại</span>
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="font-bold text-xs rounded-xl h-9 px-3"
            >
              Ghi âm lại
            </Button>
          </div>
        </div>
      )}

      {/* State 5: Completed / Review */}
      {answer && phase === "review" && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <CustomAudioPlayer src={answer} />

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã hoàn thành</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleStartRecording}
              className="rounded-full border-orange-200 hover:bg-orange-50 text-orange-600 dark:text-orange-400 dark:border-orange-900/40 dark:hover:bg-orange-950/40 font-bold px-4 text-xs shadow-xs"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Ghi âm lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
