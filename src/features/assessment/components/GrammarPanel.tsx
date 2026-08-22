import React from "react";
import { Sparkles } from "lucide-react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/sanitize";

interface GrammarPanelProps {
  title: string;
  questions: AssessmentQuestion[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
}

export function GrammarPanel({
  title,
  questions,
  answers,
  onAnswerChange,
}: GrammarPanelProps) {
  return (
    <div className="space-y-6">
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-background border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Đánh giá phản xạ ngữ pháp học thuật, mệnh đề câu phức và collocations
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-bold bg-background">
          {questions.length} Câu hỏi
        </Badge>
      </div>

      <div className="space-y-4">
        {questions.map((q) => {
          const hasHtml = q.prompt.includes("<") && q.prompt.includes(">");

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  {q.sectionTitle}
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">
                  Câu {q.orderIndex}
                </span>
              </div>

              {hasHtml ? (
                <div
                  className="text-sm sm:text-base font-bold text-foreground leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.prompt) }}
                />
              ) : (
                <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                  {q.prompt}
                </p>
              )}

              {/* Multiple Choice Options */}
              {(q.questionType === "multiple_choice" || q.questionType === "true_false_not_given") && q.options && (
                <RadioGroup
                  value={answers[q.id] || ""}
                  onValueChange={(val) => onAnswerChange(q.id, val)}
                  className="space-y-2 pt-1"
                >
                  {q.options.map((opt, idx) => {
                    const isChecked = answers[q.id] === opt;
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-xs sm:text-sm font-medium ${
                          isChecked
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500/60 text-amber-900 dark:text-amber-300 font-bold shadow-xs"
                            : "bg-muted/40 border-border hover:bg-muted/70 text-foreground"
                        }`}
                      >
                        <RadioGroupItem value={opt} id={`${q.id}-opt-${idx}`} />
                        <span className="leading-snug">{opt}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

