import React, { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WritingAnswerBoxProps {
  questionId: string;
  value: string;
  onChange: (questionId: string, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isSaving?: boolean;
  className?: string;
}

export function WritingAnswerBox({
  questionId,
  value = "",
  onChange,
  placeholder = "Nhập câu trả lời của bạn...",
  disabled = false,
  isSaving = false,
  className,
}: WritingAnswerBoxProps) {
  const wordCount = useMemo(() => {
    if (!value || typeof value !== "string") return 0;
    const trimmed = value.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [value]);

  const hasContent = Boolean(value && value.trim().length > 0);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/80 bg-card transition-all duration-200 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 shadow-xs overflow-hidden",
        className,
      )}
    >
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(questionId, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[135px] max-h-[340px] resize-y border-0 bg-transparent p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 font-normal"
      />

      {/* Integrated Status Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/50 text-xs font-medium text-muted-foreground select-none">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground/80">{wordCount}</span>
          <span>từ</span>
        </div>

        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              Đang lưu...
            </span>
          ) : hasContent ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              ✓ Đã lưu
            </span>
          ) : (
            <span className="text-muted-foreground/60">Chưa làm</span>
          )}
        </div>
      </div>
    </div>
  );
}
