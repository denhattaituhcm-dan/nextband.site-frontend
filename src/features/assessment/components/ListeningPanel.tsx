import React, { useRef, useCallback } from "react";
import { Headphones, Volume2, Clock } from "lucide-react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FillBlankHtmlRenderer, hasFillBlankPlaceholders } from "@/components/exam/FillBlankHtmlRenderer";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatStorageUrl } from "@/lib/api";

interface ListeningPanelProps {
  title: string;
  audioUrl: string;
  questions: AssessmentQuestion[];
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
}

const cleanSectionTag = (title?: string) => {
  if (!title) return null;
  let clean = title.trim();
  clean = clean.replace(/^(Kỹ\s+năng\s+)?(Đọc\s+hiểu|Đọc|Nghe|Viết|Nói)\s*(\([^)]*\))?:?\s*/i, "");
  clean = clean.replace(/^(Hiểu|Reading|Listening|Grammar|Writing|Speaking)\s*(\([^)]*\))?:?\s*/i, "");
  clean = clean.replace(/\(?(Reading|Listening|Grammar|Writing|Speaking)\)?/gi, "");
  clean = clean.replace(/^(Ngữ\s+pháp\s*(&|và)?\s*Từ\s+vựng)\s*(\([^)]*\))?:?\s*/i, "");
  clean = clean.replace(/^(Chẩn\s+đoán\s+Ngữ\s+pháp\s*(&|và)?\s*Từ\s+vựng)\s*(\([^)]*\))?:?\s*/i, "");
  clean = clean.replace(/\s+/g, " ").trim();
  if (!clean || /^(Đọc\s*hiểu|Đọc|Hiểu|Nghe|Viết|Nói|Listening|Reading|Grammar|Writing|Speaking)$/i.test(clean)) {
    return null;
  }
  return clean;
};

export function ListeningPanel({
  title,
  audioUrl,
  questions,
  answers,
  onAnswerChange,
}: ListeningPanelProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const maxTimeRef = useRef<number>(0);

  // Prevent seeking forward beyond listened threshold
  const handleSeeking = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > maxTimeRef.current + 1) {
      audioRef.current.currentTime = maxTimeRef.current;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.currentTime > maxTimeRef.current) {
      maxTimeRef.current = audioRef.current.currentTime;
    }
  }, []);

  const totalItemCount = questions.reduce(
    (acc, q) => acc + (q.blankCount && q.blankCount > 1 ? q.blankCount : 1),
    0,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Audio Player Card */}
      <Card className="rounded-3xl border-border bg-gradient-to-br from-brand-blue-soft/30 to-background shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-foreground">Listening</h3>
                <p className="text-xs text-muted-foreground">
                  Nghe đoạn audio và trả lời các câu hỏi bên dưới (Audio phát 1 lần theo tiến độ)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                <Clock className="w-3 h-3" />
                Gợi ý: ~10 phút
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Không tua
              </span>
              <Badge variant="outline" className="text-xs font-bold bg-background">
                {totalItemCount} Câu hỏi
              </Badge>
            </div>
          </div>

          {/* HTML5 Audio Player with Seek Prevention */}
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-inner flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-brand-blue shrink-0" />
            <audio
              ref={audioRef}
              controls
              controlsList="nodownload noplaybackrate"
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              src={formatStorageUrl(audioUrl)}
              className="w-full h-10 outline-hidden"
              preload="auto"
            >
              Trình duyệt của bạn không hỗ trợ phát âm thanh HTML5.
            </audio>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q) => {
          const promptText = q?.prompt || "";
          const isFillBlankWithSlots = q?.questionType === "fill_blank" && hasFillBlankPlaceholders(promptText);
          const hasHtml = promptText.includes("<") && promptText.includes(">");
          const subTag = cleanSectionTag(q.sectionTitle);

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 transition-all shadow-xs"
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
                  {q.blankCount && q.blankCount > 1 ? `${q.blankCount} chỗ trống • ` : ""}Câu {q.orderIndex || 1}
                </span>
              </div>

              {/* Rich FillBlank HTML Slot Renderer */}
              {isFillBlankWithSlots ? (
                <div className="pt-1">
                  <FillBlankHtmlRenderer
                    html={promptText}
                    answers={typeof answers?.[q.id] === "object" ? answers[q.id] || {} : {}}
                    questionId={q.id}
                    startNumber={q.orderIndex || 1}
                    onAnswerChange={onAnswerChange}
                  />
                </div>
              ) : (
                <>
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

                  {/* Single Fill in the Blank Input */}
                  {q.questionType === "fill_blank" && (
                    <div className="pt-1">
                      <Input
                        value={typeof answers?.[q.id] === "string" ? answers[q.id] : ""}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        placeholder={q.placeholder || "Nhập câu trả lời của bạn..."}
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

