import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Edit2, Check, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export interface TranscriptSegment {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  editedText?: string;
}

interface SpeakingTranscriptViewerProps {
  audioUrl: string;
  initialTranscript?: string | null;
  segments?: TranscriptSegment[] | null;
  onTranscriptEdited?: (updatedTranscript: string, updatedSegments: TranscriptSegment[]) => void;
  readOnly?: boolean;
}

/**
 * Format milliseconds into MM:SS format
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Fallback segment generator from raw transcript string
 */
function generateDefaultSegments(text: string): TranscriptSegment[] {
  if (!text || text.trim() === "") return [];

  // Split by sentence terminators
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [{ id: "seg-1", startMs: 0, endMs: 10000, text }];
  }

  const avgDurationMs = 5000;
  return sentences.map((sentence, idx) => ({
    id: `seg-${idx + 1}`,
    startMs: idx * avgDurationMs,
    endMs: (idx + 1) * avgDurationMs,
    text: sentence,
  }));
}

export function SpeakingTranscriptViewer({
  audioUrl,
  initialTranscript,
  segments: initialSegments,
  onTranscriptEdited,
  readOnly = false,
}: SpeakingTranscriptViewerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  // Segments state
  const [segments, setSegments] = useState<TranscriptSegment[]>(() => {
    if (initialSegments && initialSegments.length > 0) return initialSegments;
    return generateDefaultSegments(initialTranscript || "");
  });

  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Sync audio time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTimeMs(audioRef.current.currentTime * 1000);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDurationMs(audioRef.current.duration * 1000);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.warn("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (timeMs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeMs / 1000;
    setCurrentTimeMs(timeMs);
    if (!isPlaying) {
      audioRef.current.play().catch((err) => console.warn("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const handleStartEdit = (seg: TranscriptSegment) => {
    if (readOnly) return;
    setEditingSegmentId(seg.id);
    setEditText(seg.editedText || seg.text);
  };

  const handleSaveEdit = (segId: string) => {
    const updated = segments.map((s) => {
      if (s.id === segId) {
        return {
          ...s,
          editedText: editText.trim() === s.text.trim() ? undefined : editText.trim(),
        };
      }
      return s;
    });

    setSegments(updated);
    setEditingSegmentId(null);

    const fullText = updated.map((s) => s.editedText || s.text).join(" ");
    if (onTranscriptEdited) {
      onTranscriptEdited(fullText, updated);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-0">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* AUDIO PLAYER CONTROLS (Layer 1 - Autoritative Evidence) */}
      <div className="p-3 bg-muted/30 border-b flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={togglePlay}
            className="h-8 w-8 rounded-full p-0 shadow-xs"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSeek(0)}
            className="h-8 w-8 rounded-full p-0 text-muted-foreground hover:text-foreground"
            title="Phát lại từ đầu"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <div className="text-xs font-mono font-semibold text-foreground px-2 py-0.5 bg-background rounded-md border">
            {formatTime(currentTimeMs)} / {formatTime(durationMs || 0)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground gap-1">
            <Volume2 className="h-3 w-3 text-primary" />
            Bản thu âm gốc
          </Badge>
        </div>
      </div>

      {/* TRANSCRIPT LAYER (Layer 2 - Synchronized Index) */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Văn bản đối chiếu (Click vào đoạn chữ để tua âm thanh):</span>
          </div>
        </div>

        {segments.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            Chưa có dữ liệu bóc băng cho bài nói này.
          </div>
        ) : (
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {segments.map((seg) => {
              const isActive = currentTimeMs >= seg.startMs && currentTimeMs < seg.endMs;
              const isEdited = !!seg.editedText;
              const displayText = seg.editedText || seg.text;
              const isEditingThis = editingSegmentId === seg.id;

              return (
                <div
                  key={seg.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 border-primary/60 text-primary shadow-xs font-medium"
                      : "bg-muted/10 border-border/60 hover:bg-muted/30 text-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSeek(seg.startMs)}
                      className="font-mono text-[10px] text-muted-foreground hover:text-primary font-semibold px-1.5 py-0.5 rounded bg-muted shrink-0 transition-colors"
                      title="Nhảy đến giây này"
                    >
                      {formatTime(seg.startMs)} - {formatTime(seg.endMs)}
                    </button>

                    {isEditingThis ? (
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-xs min-h-[50px] p-2"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingSegmentId(null)}
                            className="h-6 text-[10px] px-2"
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSaveEdit(seg.id)}
                            className="h-6 text-[10px] px-2 gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Lưu
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleSeek(seg.startMs)}
                        className="flex-1 cursor-pointer select-text leading-relaxed"
                      >
                        {displayText}
                        {isEdited && (
                          <span className="ml-2 text-[10px] font-normal text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
                            (Đã hiệu chỉnh)
                          </span>
                        )}
                      </div>
                    )}

                    {!readOnly && !isEditingThis && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(seg)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        title="Chỉnh sửa đoạn bóc băng này"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DISCLAIMER INVARIANT */}
        <div className="pt-2 border-t flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
          <span>
            <strong>Nguyên tắc:</strong> Văn bản bóc băng tự động phục vụ tra cứu. File âm thanh là bằng chứng gốc duy nhất.
          </span>
        </div>
      </div>
    </div>
  );
}
