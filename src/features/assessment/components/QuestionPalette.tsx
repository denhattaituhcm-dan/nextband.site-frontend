import React, { useMemo } from "react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface QuestionPaletteProps {
  questions: AssessmentQuestion[];
  answers: Record<string, any>;
  currentQuestionId?: string;
  onSelectQuestion: (questionId: string) => void;
}

export function QuestionPalette({
  questions,
  answers,
  currentQuestionId,
  onSelectQuestion,
}: QuestionPaletteProps) {
  // Expand questions (including multi-blank questions) into palette items
  const paletteItems = useMemo(() => {
    const items: Array<{
      targetId: string;
      focusId: string;
      label: number;
      isAnswered: boolean;
    }> = [];

    let cursor = 1;

    questions.forEach((q) => {
      if (q.blankCount && q.blankCount > 1) {
        const qAnswers = typeof answers[q.id] === "object" ? answers[q.id] || {} : {};
        for (let b = 0; b < q.blankCount; b++) {
          const val = qAnswers[b] ?? qAnswers[String(b)];
          const isAns = val != null && String(val).trim() !== "";
          items.push({
            targetId: q.id,
            focusId: `${q.id}::blank:${b}`,
            label: cursor++,
            isAnswered: isAns,
          });
        }
      } else {
        const val = answers[q.id];
        const isAns = val != null && String(val).trim() !== "";
        items.push({
          targetId: q.id,
          focusId: q.id,
          label: cursor++,
          isAnswered: isAns,
        });
      }
    });

    return items;
  }, [questions, answers]);

  const answeredCount = paletteItems.filter((i) => i.isAnswered).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: Summary Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black uppercase text-foreground tracking-wide hidden sm:inline">
            Danh sách câu hỏi
          </span>
          <Badge variant="outline" className="text-xs font-extrabold bg-card border-border">
            {answeredCount}/{paletteItems.length}
          </Badge>
        </div>

        {/* Center: Horizontal Scrollable List of Questions */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar">
          {paletteItems.map((item) => {
            const isCurrent =
              currentQuestionId === item.focusId || currentQuestionId === item.targetId;

            return (
              <button
                key={`${item.targetId}-${item.label}`}
                onClick={() => onSelectQuestion(item.targetId)}
                className={cn(
                  "min-w-[34px] h-8 px-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center shrink-0 cursor-pointer border",
                  isCurrent
                    ? "ring-2 ring-brand-blue ring-offset-1 border-brand-blue font-black"
                    : "",
                  item.isAnswered
                    ? "bg-brand-blue text-white border-brand-blue shadow-xs font-extrabold"
                    : "bg-muted/50 text-foreground border-border/80 hover:bg-muted",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Status Legend */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
            <span>Đã làm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-muted border border-border" />
            <span>Chưa làm</span>
          </div>
        </div>
      </div>
    </div>
  );
}


