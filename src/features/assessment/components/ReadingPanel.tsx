import React from "react";
import { BookOpen } from "lucide-react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { FillBlankHtmlRenderer, hasFillBlankPlaceholders } from "@/components/exam/FillBlankHtmlRenderer";
import { sanitizeHtml } from "@/lib/sanitize";

interface ReadingPanelProps {
  title: string;
  passage: string;
  questions: AssessmentQuestion[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
}

export function ReadingPanel({
  title,
  passage,
  questions,
  answers,
  onAnswerChange,
}: ReadingPanelProps) {
  const hasPassage = passage && passage.trim().length > 20;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Academic Reading Passage (If present) */}
      {hasPassage && (
        <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-brand-blue font-extrabold text-sm">
                <BookOpen className="w-4 h-4" />
                <span>{title}</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold">
                Passage Text
              </Badge>
            </div>

            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-4 max-h-[68vh] overflow-y-auto pr-2 prose prose-sm max-w-none">
              {passage.includes("<") && passage.includes(">") ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(passage) }} />
              ) : (
                passage.split("\n\n").map((para, idx) => (
                  <p key={idx} className="leading-relaxed text-justify">
                    {para}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right Column: Reading Questions */}
      <div className={hasPassage ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
        {questions.map((q) => {
          const isFillBlankWithSlots = q.questionType === "fill_blank" && hasFillBlankPlaceholders(q.prompt);
          const hasHtml = q.prompt.includes("<") && q.prompt.includes(">");

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wide">
                  {q.sectionTitle}
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">
                  {q.blankCount && q.blankCount > 1 ? `${q.blankCount} chỗ trống` : `Câu ${q.orderIndex}`}
                </span>
              </div>

              {/* Rich FillBlank HTML Slot Renderer */}
              {isFillBlankWithSlots ? (
                <div className="pt-1">
                  <FillBlankHtmlRenderer
                    html={q.prompt}
                    answers={typeof answers[q.id] === "object" ? answers[q.id] || {} : {}}
                    questionId={q.id}
                    onAnswerChange={onAnswerChange}
                  />
                </div>
              ) : (
                <>
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

                  {/* Multiple Choice & True/False/Not Given Options */}
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

                  {/* Single Fill in the Blank Input */}
                  {q.questionType === "fill_blank" && (
                    <div className="pt-1">
                      <Input
                        value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || "Nhập 1 từ chính xác từ bài đọc..."}
                        className="h-11 rounded-2xl border-border font-medium text-sm focus:border-brand-blue"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

