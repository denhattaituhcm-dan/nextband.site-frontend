import { useState } from "react";
import { SentenceFeedbackItem, CATEGORY_COLORS } from "@/lib/sentenceFeedback";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  ListChecks,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CorrectionChecklistProps {
  sentenceFeedbacks: SentenceFeedbackItem[];
  primaryErrorCategory?: string | null;
  teacherGeneralFeedback?: string | null;
  onSentenceClick?: (sentence: string, index: number) => void;
}

export function CorrectionChecklist({
  sentenceFeedbacks = [],
  primaryErrorCategory,
  teacherGeneralFeedback,
  onSentenceClick,
}: CorrectionChecklistProps) {
  const [resolvedIndices, setResolvedIndices] = useState<Set<number>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleResolved = (index: number) => {
    setResolvedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const totalItems = sentenceFeedbacks.length;
  const resolvedCount = resolvedIndices.size;
  const progressPercent = totalItems > 0 ? Math.round((resolvedCount / totalItems) * 100) : 0;

  if (totalItems === 0 && !teacherGeneralFeedback) {
    return null;
  }

  return (
    <Card className="border-amber-300/80 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs rounded-2xl overflow-hidden mb-6">
      <CardHeader className="p-4 border-b border-amber-200/60 dark:border-amber-800/60 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-950 dark:text-amber-200">
              <ListChecks className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Danh Sách Lỗi Cần Sửa (Attempt 2 Checklist)</span>
            </CardTitle>
            {primaryErrorCategory && (
              <Badge
                variant="outline"
                className="bg-amber-100 dark:bg-amber-900/50 border-amber-300 text-amber-900 dark:text-amber-200 text-[10px] font-bold"
              >
                Lỗi trọng tâm: {primaryErrorCategory}
              </Badge>
            )}
          </div>
          <p className="text-xs text-amber-900/70 dark:text-amber-300/70">
            Giáo viên đã chỉ ra {totalItems} câu cần chỉnh sửa. Hãy tích chọn khi bạn đã sửa xong câu đó.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalItems > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <div className="w-20 sm:w-28 h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="tabular-nums">
                {resolvedCount}/{totalItems}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-md text-amber-800 hover:bg-amber-200/50"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 space-y-3">
          {/* General feedback summary if present */}
          {teacherGeneralFeedback && (
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <strong className="text-amber-950 dark:text-amber-200">
                Nhận xét tổng quan của Giáo viên:
              </strong>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {teacherGeneralFeedback}
              </p>
            </div>
          )}

          {/* Checklist of flagged sentences */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {sentenceFeedbacks.map((item) => {
              const isResolved = resolvedIndices.has(item.sentenceIndex);
              const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.GRAMMAR;

              return (
                <div
                  key={item.sentenceIndex}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-xs space-y-2",
                    isResolved
                      ? "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/60 opacity-80"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      checked={isResolved}
                      onCheckedChange={() => toggleResolved(item.sentenceIndex)}
                      className="mt-0.5"
                      id={`chk-${item.sentenceIndex}`}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor={`chk-${item.sentenceIndex}`}
                          className={cn(
                            "font-mono font-bold cursor-pointer",
                            isResolved ? "line-through text-muted-foreground" : "text-foreground"
                          )}
                        >
                          Câu #{item.sentenceIndex + 1}:
                        </label>
                        <Badge className={cn("text-[10px] font-bold", color.badgeBg)}>
                          {item.category}
                        </Badge>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {item.tag}
                        </span>
                        {isResolved && (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Đã sửa
                          </span>
                        )}
                      </div>

                      {/* Original sentence */}
                      <p
                        onClick={() =>
                          onSentenceClick?.(item.originalSentence, item.sentenceIndex)
                        }
                        className={cn(
                          "italic text-muted-foreground leading-relaxed pl-2 border-l-2 border-slate-300 dark:border-slate-700",
                          isResolved && "line-through"
                        )}
                      >
                        "{item.originalSentence}"
                      </p>

                      {/* Teacher Note */}
                      {item.note && (
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          <strong>Ghi chú:</strong> {item.note}
                        </p>
                      )}

                      {/* Suggested Rewrite */}
                      {item.suggestedSentence && (
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs">
                          <Lightbulb className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>Gợi ý:</strong> {item.suggestedSentence}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
