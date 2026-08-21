import React from "react";
import { Headphones, Volume2, Info } from "lucide-react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ListeningPanelProps {
  title: string;
  audioUrl: string;
  questions: AssessmentQuestion[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
}

export function ListeningPanel({
  title,
  audioUrl,
  questions,
  answers,
  onAnswerChange,
}: ListeningPanelProps) {
  return (
    <div className="space-y-6">
      {/* Audio Player Card */}
      <Card className="rounded-3xl border-border bg-gradient-to-br from-brand-blue-soft/30 to-background shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">Nghe đoạn audio và trả lời 10 câu hỏi bên dưới</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-bold bg-background">
              10 Câu hỏi
            </Badge>
          </div>

          {/* HTML5 Audio Player */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-inner flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-brand-blue shrink-0" />
            <audio controls src={audioUrl} className="w-full h-10 outline-hidden" preload="auto">
              Trình duyệt của bạn không hỗ trợ phát âm thanh HTML5.
            </audio>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            id={`question-${q.id}`}
            className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wide">
                {q.sectionTitle}
              </span>
              <span className="text-xs font-extrabold text-muted-foreground">
                Câu {q.orderIndex}
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
              {q.prompt}
            </p>

            {/* Multiple Choice Options */}
            {q.questionType === "multiple_choice" && q.options && (
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

            {/* Fill in the Blank Input */}
            {q.questionType === "fill_blank" && (
              <div className="pt-1">
                <Input
                  value={answers[q.id] || ""}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  placeholder={q.placeholder || "Nhập câu trả lời của bạn..."}
                  className="h-11 rounded-2xl border-border font-medium text-sm focus:border-brand-blue"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
