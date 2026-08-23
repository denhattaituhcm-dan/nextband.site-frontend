import React from "react";
import { Sparkles, Clock } from "lucide-react";
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

const cleanSectionTag = (title?: string) => {
  if (!title) return null;
  let clean = title.trim();
  clean = clean.replace(/^(Kỹ năng\s+(Nghe|Đọc|Đọc hiểu|Viết|Nói)\s*(\([^)]*\))?:?\s*)/i, "");
  clean = clean.replace(/^(Ngữ pháp\s*(&|và)\s*Từ vựng\s*(\([^)]*\))?:?\s*)/i, "");
  clean = clean.replace(/^(Chẩn đoán\s+Ngữ pháp\s*(&|và)?\s*Từ vựng:?\s*)/i, "");
  clean = clean.replace(/^(Listening|Reading|Grammar|Writing|Speaking)\s*:\s*/i, "");
  clean = clean.trim();
  if (!clean || /^(Listening|Reading|Grammar|Writing|Speaking)$/i.test(clean)) {
    return null;
  }
  return clean;
};

export function GrammarPanel({
  title,
  questions,
  answers,
  onAnswerChange,
}: GrammarPanelProps) {
  return (
    <div className="space-y-6">
      {/* Section Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-brand-blue-soft/30 to-background border border-border shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">Grammar</h3>
            <p className="text-xs text-muted-foreground">
              Đánh giá phản xạ ngữ pháp học thuật, mệnh đề câu phức và collocations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
            <Clock className="w-3 h-3" />
            Gợi ý: ~5 phút
          </span>
          <Badge variant="outline" className="text-xs font-bold bg-background">
            {questions.length} Câu hỏi
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q) => {
          const promptText = q?.prompt || "";
          const hasHtml = promptText.includes("<") && promptText.includes(">");
          const subTag = cleanSectionTag(q.sectionTitle);

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                {subTag ? (
                  <span className="text-xs font-bold text-brand-blue uppercase tracking-wide">
                    {subTag}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-xs font-extrabold text-muted-foreground">
                  Câu {q.orderIndex || 1}
                </span>
              </div>

              {hasHtml ? (
                <div
                  className="text-sm sm:text-base font-bold text-foreground leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(promptText) }}
                />
              ) : (
                <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                  {promptText}
                </p>
              )}

              {/* Multiple Choice Options */}
              {(q.questionType === "multiple_choice" || q.questionType === "true_false_not_given") && Array.isArray(q.options) && q.options.length > 0 && (
                <RadioGroup
                  value={typeof answers?.[q.id] === "string" ? answers[q.id] : ""}
                  onValueChange={(val) => onAnswerChange(q.id, val)}
                  className="space-y-2 pt-1"
                >
                  {q.options.map((opt, idx) => {
                    const isChecked = answers?.[q.id] === opt;
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer text-xs sm:text-sm font-medium ${
                          isChecked
                            ? "bg-brand-blue-soft border-brand-blue/60 text-brand-blue font-bold shadow-xs"
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

