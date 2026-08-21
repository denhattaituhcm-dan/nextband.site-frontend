import React from "react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { cn } from "@/lib/utils";

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
  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider">
          Danh sách câu hỏi
        </h4>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
            <span>Đã làm</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-muted border border-border" />
            <span>Chưa làm</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {questions.map((q) => {
          const isAnswered = answers[q.id] != null && String(answers[q.id]).trim() !== "";
          const isCurrent = currentQuestionId === q.id;

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className={cn(
                "h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer border",
                isCurrent
                  ? "ring-2 ring-brand-blue ring-offset-1 border-brand-blue font-black"
                  : "",
                isAnswered
                  ? "bg-brand-blue text-white border-brand-blue shadow-xs"
                  : "bg-muted/50 text-foreground border-border/80 hover:bg-muted",
              )}
            >
              {q.orderIndex}
            </button>
          );
        })}
      </div>
    </div>
  );
}
