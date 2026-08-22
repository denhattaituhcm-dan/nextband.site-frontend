import React from "react";
import { Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PartRecorder } from "./PartRecorder";

interface SpeakingPanelProps {
  sessionId: string;
  title: string;
  part1Questions: string[];
  part2Topic: string;
  part2Cues: string[];
  onPart1Recorded: (storagePath: string) => void;
  onPart2Recorded: (storagePath: string) => void;
}

export function SpeakingPanel({
  sessionId,
  title,
  part1Questions,
  part2Topic,
  part2Cues,
  onPart1Recorded,
  onPart2Recorded,
}: SpeakingPanelProps) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-background border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Ghi âm riêng từng phần — Giáo viên nhận 2 file audio để chấm phát âm &amp; độ trôi chảy
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-bold bg-background">
          2 file ghi âm
        </Badge>
      </div>

      {/* ── Part 1 card ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Part 1 — Phỏng vấn ngắn
          </span>
          <span className="text-xs text-muted-foreground">1 – 2 phút</span>
        </div>

        <div className="space-y-2">
          {part1Questions.map((q, idx) => (
            <p key={idx} className="text-sm font-bold text-foreground">
              {q}
            </p>
          ))}
        </div>

        <PartRecorder
          partLabel="Part 1"
          questionId="speaking_part1"
          sessionId={sessionId}
          maxDurationSeconds={120}
          onUploaded={onPart1Recorded}
        />
      </div>

      {/* ── Part 2 card ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
            Part 2 — Trình bày chủ đề
          </span>
          <span className="text-xs text-muted-foreground">1 – 2.5 phút</span>
        </div>

        <p className="text-base font-extrabold text-foreground">{part2Topic}</p>

        <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">You should say:</p>
          <ul className="list-disc pl-4 space-y-1">
            {part2Cues.map((cue, idx) => (
              <li key={idx}>{cue}</li>
            ))}
          </ul>
        </div>

        <PartRecorder
          partLabel="Part 2"
          questionId="speaking_part2"
          sessionId={sessionId}
          maxDurationSeconds={150}
          onUploaded={onPart2Recorded}
        />
      </div>
    </div>
  );
}
