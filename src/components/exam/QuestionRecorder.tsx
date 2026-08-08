import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, CheckCircle2, Play, Pause, RotateCcw } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { uploadsApi } from "@/lib/api";

interface QuestionRecorderProps {
  questionId: string;
  answer: string;
  onAnswerChange: (questionId: string, answer: string) => void;
  className?: string;
}

function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
  }, [src]);

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
      <audio ref={audioRef} src={src} preload="metadata" />
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
  onAnswerChange,
  className,
}: QuestionRecorderProps) {
  const [phase, setPhase] = useState<"idle" | "recording" | "review">(
    answer ? "review" : "idle",
  );
  const [recordTime, setRecordTime] = useState(0);

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

  const { transcript, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  const [isUploading, setIsUploading] = useState(false);

  // Synchronize phase when answer changes externally
  useEffect(() => {
    if (answer && phase === "idle") {
      setPhase("review");
    }
  }, [answer, phase]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording]);

  // Handle recorded audio
  useEffect(() => {
    const uploadAudio = async () => {
      if (audioBlob && phase === "recording") {
        setIsUploading(true);
        try {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const file = new File([audioBlob], `speaking_${questionId}.webm`, {
            type: "audio/webm",
          });
          const response = await uploadsApi.uploadAudio(file);

          if (response?.url) {
            onAnswerChange(questionId, response.url);
          } else {
            onAnswerChange(questionId, audioUrl || "");
          }
        } catch (error) {
          console.error("Upload error:", error);
          onAnswerChange(questionId, audioUrl || "");
        } finally {
          setIsUploading(false);
          setPhase("review");
        }
      }
    };

    if (audioBlob && phase === "recording") {
      uploadAudio();
    }
  }, [audioBlob, phase, questionId, onAnswerChange, audioUrl]);

  const handleStartRecording = async () => {
    if (permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    resetRecording();
    resetTranscript();
    setRecordTime(0);
    setPhase("recording");

    await startRecording();
    startListening();
  };

  const handleStopRecording = () => {
    stopRecording();
    stopListening();
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
      {/* State 1: Idle (No recording yet) */}
      {!answer && phase !== "recording" && (
        <div className="flex items-center gap-3">
          <Button
            size="default"
            onClick={handleStartRecording}
            disabled={isUploading}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-full px-6 shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Mic className="mr-2 h-4 w-4 animate-pulse" />
            Bắt đầu ghi âm
          </Button>
          <span className="text-xs text-muted-foreground font-medium italic hidden sm:inline">
            Nhấn nút để thực hiện câu trả lời nói của bạn
          </span>
        </div>
      )}

      {/* State 2: Active Recording */}
      {phase === "recording" && (
        <div className="bg-gradient-to-b from-white to-orange-50/50 dark:from-neutral-900 dark:to-neutral-800/80 rounded-2xl p-4 border-2 border-orange-400/60 dark:border-orange-600/60 shadow-lg space-y-4 animate-in zoom-in-95 fill-mode-both">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive animate-pulse">
              <div className="w-3 h-3 rounded-full bg-destructive shadow-sm shadow-destructive/50" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Đang ghi âm...
              </span>
            </div>
            <span className="font-mono font-extrabold text-2xl text-orange-600 dark:text-orange-400">
              {formatTime(recordTime)}
            </span>
          </div>

          <AudioWaveform
            data={analyserData}
            isRecording={true}
            className="h-12 w-full rounded-xl overflow-hidden"
          />

          <div className="bg-white/80 dark:bg-black/30 p-3 rounded-xl text-sm min-h-[50px] max-h-[90px] overflow-auto border border-orange-200/50 dark:border-neutral-700 italic text-muted-foreground text-left shadow-xs">
            {transcript || "Đang chuyển giọng nói thành văn bản..."}
          </div>

          <Button
            onClick={handleStopRecording}
            variant="destructive"
            className="w-full rounded-xl font-bold py-5 shadow-md shadow-destructive/20"
          >
            <Square className="mr-2 h-4 w-4" /> Dừng ghi và hoàn tất
          </Button>
        </div>
      )}

      {/* State 3: Completed / Recorded Review */}
      {answer && phase !== "recording" && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <CustomAudioPlayer src={answer} />

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
              <span>Đã trả lời</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleStartRecording}
              disabled={isUploading}
              className="rounded-full border-orange-200 hover:bg-orange-50 text-orange-600 dark:text-orange-400 dark:border-orange-900/40 dark:hover:bg-orange-950/40 font-bold px-4 text-xs shadow-xs"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Ghi âm lại
            </Button>
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold animate-pulse">
              <div className="h-3.5 w-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Đang tải bài nói lên máy chủ...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
