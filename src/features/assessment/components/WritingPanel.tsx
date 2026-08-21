import React from "react";
import { PenTool, CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface WritingPanelProps {
  title: string;
  prompt: string;
  guidelines: string[];
  minWords: number;
  value: string;
  onChange: (text: string) => void;
}

export function WritingPanel({
  title,
  prompt,
  guidelines,
  minWords,
  value,
  onChange,
}: WritingPanelProps) {
  const wordsCount = value
    ? value
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0;

  const isWordCountMet = wordsCount >= minWords;

  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-background border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Viết đoạn văn ngắn (100–150 từ) để chuyên gia và AI đánh giá lập luận phản biện
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs font-bold ${
            isWordCountMet
              ? "bg-emerald-50 text-emerald-600 border-emerald-300"
              : "bg-background text-muted-foreground"
          }`}
        >
          {wordsCount} / {minWords} từ
        </Badge>
      </div>

      {/* Writing Prompt Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
        <div className="space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
            Đề bài khảo thí
          </span>
          <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
            {prompt}
          </p>
        </div>

        {/* Guidelines */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 space-y-2">
          <h5 className="text-xs font-extrabold text-foreground">Gợi ý phát triển ý tưởng:</h5>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
            {guidelines.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>

        {/* Writing Textarea */}
        <div className="space-y-2 pt-2">
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your essay / paragraph response here in English..."
            rows={10}
            className="w-full rounded-2xl border-border text-sm leading-relaxed p-4 font-mono focus:border-indigo-500"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
            <span>Bài viết sẽ được ghi nhận và chuyển cho Giảng viên/AI chấm chuyên sâu.</span>
            <span className={isWordCountMet ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
              {wordsCount} từ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
