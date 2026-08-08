import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PenTool, BookOpen, CheckCircle2, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownSelect } from "./DropdownSelect";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { MatchingRenderer } from "./MatchingRenderer";
import { cn } from "@/lib/utils";
import { RichContent } from "./RichContent";

interface WritingSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  timeRemaining?: number;
}

const cleanHtmlText = (html?: string) => {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text ? html : "";
};

const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

const getMinWords = (title: string) => {
  const lower = (title || "").toLowerCase();
  if (lower.includes("task 1") || lower.includes("part 1")) return 150;
  return 250;
};

export function WritingSection({
  section,
  answers,
  onAnswerChange,
}: WritingSectionProps) {
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields
  const questionGroups = rawGroups
    .map((g: any) => ({
      ...g,
      questions: (g.questions || [])
        .map((q: any) => ({
          ...q,
          question_text: q.question_text || q.questionText || "",
          question_type: q.question_type || q.questionType || "essay",
          question_audio_url:
            q.audioUrl || q.audio_url || q.question_audio_url || null,
          order_index: q.order_index ?? q.orderIndex ?? 0,
          image_url: q.imageUrl || q.image_url || null,
          options: q.options
            ? typeof q.options === "string"
              ? JSON.parse(q.options)
              : q.options
            : [],
          correct_answer: q.correct_answer || q.correctAnswer || null,
        }))
        .filter((q: any, idx: number, arr: any[]) => {
          if (!q?.id) return true;
          return arr.findIndex((item: any) => item?.id === q.id) === idx;
        })
        .sort((a: any, b: any) => {
          const orderDiff = (a.order_index || 0) - (b.order_index || 0);
          if (orderDiff !== 0) return orderDiff;
          return new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime();
        }),
    }))
    .sort((a: any, b: any) => {
      const orderDiff =
        (a.order_index || a.orderIndex || 0) -
        (b.order_index || b.orderIndex || 0);
      if (orderDiff !== 0) return orderDiff;
      return new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime();
    });

  const allQuestions = useMemo(
    () =>
      questionGroups.flatMap((group: any) =>
        (group.questions || []).map((q: any) => ({
          ...q,
          groupTitle: group.title,
          groupInstructions: group.instructions,
        })),
      ),
    [questionGroups],
  );

  const primaryQuestionId = allQuestions[0]?.id || section.id;
  const firstQuestion = allQuestions[0];
  const primaryText = answers[primaryQuestionId] || "";
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save indicator
  useEffect(() => {
    if (primaryText) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setLastSaved(new Date());
      }, 3000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [primaryText]);

  const cleanSectionInstructions = cleanHtmlText(section.instructions);

  const renderAnswerField = (question: any) => {
    const value = answers[question.id] || "";
    const wordCount = countWords(typeof value === "string" ? value : "");
    const minWords = getMinWords(section.title || "");

    // Essay block with word progress
    if (question.question_type === "essay") {
      const progress = Math.min((wordCount / minWords) * 100, 100);
      return (
        <div className="space-y-4">
          <Textarea
            placeholder="Viết bài luận của bạn tại đây..."
            value={value}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            rows={12}
            className="resize-y rounded-2xl p-4 text-base border-gray-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs font-sans leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 px-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
                <span>Số từ:</span>
                <span
                  className={cn(
                    "text-sm font-extrabold",
                    wordCount >= minWords ? "text-emerald-600 dark:text-emerald-400" : "text-teal-600 dark:text-teal-400"
                  )}
                >
                  {wordCount}
                </span>
                <span className="text-xs text-muted-foreground font-normal">/ {minWords} từ tối thiểu</span>
              </div>

              <div className="w-28 sm:w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    wordCount >= minWords ? "bg-emerald-500" : "bg-teal-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {lastSaved && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã tự động lưu ({lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (
      question.question_type === "multiple_choice" &&
      question.options &&
      question.options.length > 0
    ) {
      const selectedValues = Array.isArray(value)
        ? value
        : value
          ? [value]
          : [];

      return (
        <RadioGroup
          value={selectedValues[0] || ""}
          onValueChange={(v) => onAnswerChange(question.id, v)}
          className="grid gap-2"
        >
          {question.options.map((opt: string, idx: number) => (
            <div
              key={idx}
              className={cn(
                "flex items-center space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                value === opt
                  ? "bg-white border-teal-500 shadow-xs ring-1 ring-teal-500/20"
                  : "bg-gray-50/50 border-gray-200/80 hover:bg-white",
              )}
            >
              <RadioGroupItem value={opt} id={`${question.id}-${idx}`} />
              <Label
                htmlFor={`${question.id}-${idx}`}
                className="flex-1 cursor-pointer font-semibold text-gray-800 dark:text-gray-200 text-sm"
              >
                <span className="text-teal-600 dark:text-teal-400 mr-2 text-xs font-extrabold">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }

    return (
      <div className="space-y-2">
        <Textarea
          placeholder="Viết câu trả lời của bạn..."
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onAnswerChange(question.id, e.target.value)}
          rows={6}
          className="resize-y rounded-2xl p-4 text-base border-gray-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs font-sans leading-relaxed"
        />
        <div className="flex justify-end text-xs text-muted-foreground font-semibold">
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
            📝 {wordCount} từ
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50/50 dark:bg-neutral-950/50">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-32">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 rounded-3xl border border-teal-200/60 dark:border-teal-900/30 shadow-xs">
            <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400 mb-2">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                <PenTool className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {section.title || "IELTS Writing Test"}
                </h2>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Thực hiện bài viết và quản lý số từ trực tiếp
                </p>
              </div>
            </div>

            {cleanSectionInstructions && (
              <div className="mt-4 p-4 bg-white/90 dark:bg-gray-900/90 border border-teal-200/80 dark:border-teal-900/40 rounded-2xl text-sm text-gray-800 dark:text-gray-200 font-medium shadow-xs">
                <RichContent html={cleanSectionInstructions} />
              </div>
            )}
          </div>

          {/* Question Groups */}
          <div className="space-y-8">
            {questionGroups.map((group: any, gIndex: number) => {
              const rawTitle = group.title || "";
              const hasPartInTitle = /part|phần|task/i.test(rawTitle);
              const displayTitle = rawTitle || `Writing Task ${gIndex + 1}`;
              const groupInst = cleanHtmlText(group.instructions);

              return (
                <div key={group.id} className="space-y-6">
                  {/* Group Header */}
                  {(displayTitle || groupInst) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {!hasPartInTitle && (
                          <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
                            Task {gIndex + 1}
                          </span>
                        )}
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                          {displayTitle}
                        </h3>
                      </div>

                      {groupInst && (
                        <div className="p-4 bg-gradient-to-r from-teal-50/80 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/10 border border-teal-200/80 dark:border-teal-900/30 rounded-2xl text-sm text-gray-800 dark:text-gray-200 font-medium shadow-xs">
                          <RichContent html={groupInst} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Group Passage / Prompt Description */}
                  {group.passage && (
                    <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-teal-100/40 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-teal-900/20 border border-teal-300/70 dark:border-teal-700/40 rounded-3xl p-6 shadow-md shadow-teal-500/5 relative overflow-hidden">
                      <div className="flex items-center gap-2.5 text-teal-800 dark:text-teal-300 font-bold mb-4 uppercase text-xs tracking-widest bg-teal-200/60 dark:bg-teal-900/50 px-3.5 py-1.5 rounded-full w-fit">
                        <BookOpen className="h-4 w-4" />
                        <span>Đề bài & Hướng dẫn</span>
                      </div>
                      <RichContent
                        html={group.passage}
                        variant="passage"
                        className="text-gray-900 dark:text-gray-100 text-base leading-relaxed font-medium"
                      />
                    </div>
                  )}

                  {/* Questions */}
                  <div className="space-y-4">
                    {(group.questions || []).map(
                      (question: any, qIndex: number) => {
                        return (
                          <Card
                            key={question.id}
                            className="rounded-3xl overflow-hidden border border-gray-200/80 dark:border-gray-800 shadow-xs hover:shadow-md transition-all bg-white dark:bg-gray-900"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/20 shadow-xs">
                                  {question.order_index || qIndex + 1}
                                </span>

                                <div className="flex-1 space-y-4 pt-0.5">
                                  {cleanHtmlText(question.question_text) && (
                                    <RichContent
                                      html={question.question_text}
                                      className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-snug"
                                    />
                                  )}

                                  {renderAnswerField(question)}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      },
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
