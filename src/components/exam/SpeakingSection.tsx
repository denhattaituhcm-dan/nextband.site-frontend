import { useMemo, MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mic, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { QuestionRecorder } from "./QuestionRecorder";
import { RichContent } from "./RichContent";
import { formatStorageUrl } from "@/lib/api";

import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";

interface SpeakingSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

const cleanHtmlText = (html?: string) => {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text ? html : "";
};

export function SpeakingSection({
  section,
  answers,
  onAnswerChange,
  onRecordingStateChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: SpeakingSectionProps) {
  const isRecorderType = (type: string) =>
    type === "speaking" || type === "essay";

  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields
  const questionGroups = useMemo(() => {
    return rawGroups
      .map((g: any) => ({
        ...g,
        questions: (g.questions || [])
          .map((q: any) => ({
            ...q,
            question_text: q.question_text || q.questionText || "",
            question_type: String(
              q.question_type || q.questionType || "speaking",
            ).toLowerCase(),
            order_index: q.order_index ?? q.orderIndex ?? 0,
            options: q.options
              ? typeof q.options === "string"
                ? JSON.parse(q.options)
                : q.options
              : [],
          }))
          .sort((a: any, b: any) => {
            const orderDiff = (a.order_index || 0) - (b.order_index || 0);
            return orderDiff !== 0
              ? orderDiff
              : new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime();
          }),
      }))
      .sort((a: any, b: any) => {
        const orderDiff =
          (a.orderIndex || a.order_index || 0) -
          (b.orderIndex || b.order_index || 0);
        return orderDiff !== 0
          ? orderDiff
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [rawGroups]);

  // Flatten for calculations
  const allQuestions = useMemo(() => {
    return questionGroups.flatMap((g: any) => g.questions);
  }, [questionGroups]);

  const cleanSectionInstructions = cleanHtmlText(section.instructions);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50/50 dark:bg-neutral-950/50">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-32">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-orange-200/60 dark:border-orange-900/30 shadow-xs">
            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-2">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {section.title || "IELTS Speaking Test"}
                </h2>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Thực hiện ghi âm trực tiếp bài nói của bạn
                </p>
              </div>
            </div>

            {cleanSectionInstructions && (
              <div className="mt-4 p-4 bg-white/90 dark:bg-gray-900/90 border border-orange-200/80 dark:border-orange-900/40 rounded-2xl text-sm text-gray-800 dark:text-gray-200 font-medium shadow-xs">
                <RichContent html={cleanSectionInstructions} />
              </div>
            )}
          </div>

          {questionGroups.map((group: any, gIndex: number) => {
            const rawTitle = group.title || "";
            const hasPartInTitle = /part|phần/i.test(rawTitle);
            const displayTitle = rawTitle || `Speaking Part ${gIndex + 1}`;
            const groupInst = cleanHtmlText(group.instructions);

            return (
              <div key={group.id} className="space-y-6">
                {/* Group Header */}
                {(displayTitle || groupInst) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {!hasPartInTitle && (
                        <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
                          Phần {gIndex + 1}
                        </span>
                      )}
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        {displayTitle}
                      </h3>
                    </div>

                    {groupInst && (
                      <div className="p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/80 dark:border-orange-900/30 rounded-2xl text-sm text-gray-800 dark:text-gray-200 font-medium shadow-xs">
                        <RichContent html={groupInst} />
                      </div>
                    )}
                  </div>
                )}

                {/* Group Passage / Cue Card */}
                {group.passage && (
                  <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/20 border border-amber-300/70 dark:border-amber-700/40 rounded-3xl p-6 shadow-md shadow-amber-500/5 relative overflow-hidden">
                    <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-bold mb-4 uppercase text-xs tracking-widest bg-amber-200/60 dark:bg-amber-900/50 px-3.5 py-1.5 rounded-full w-fit">
                      <BookOpen className="h-4 w-4" />
                      <span>IELTS Speaking Cue Card</span>
                    </div>
                    <RichContent
                      html={group.passage}
                      variant="passage"
                      className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed font-medium"
                    />
                  </div>
                )}

                {/* Questions in this group */}
                <div className="space-y-4">
                  {group.questions.map((question: any, qIndex: number) => {
                    const isCurrent = question.id === currentQuestionId;
                    const hasAnswer = !!answers[question.id];
                    const qGlobalIndex =
                      allQuestions.findIndex((q) => q.id === question.id) + 1;

                    return (
                      <Card
                        key={question.id}
                        ref={(el) => {
                          if (el && questionRefs) {
                            questionRefs.current.set(question.id, el);
                          }
                        }}
                        className={cn(
                          "transition-all duration-300 rounded-3xl overflow-hidden border border-gray-200/80 dark:border-gray-800 shadow-xs hover:shadow-md",
                          isCurrent
                            ? "ring-2 ring-orange-500 border-transparent bg-gradient-to-b from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/10 shadow-lg shadow-orange-500/10"
                            : "bg-white dark:bg-gray-900 hover:border-orange-300/50",
                        )}
                        onClick={() => onQuestionFocus?.(question.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <span
                              className={cn(
                                "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-2xl text-sm font-extrabold shadow-xs transition-all",
                                hasAnswer
                                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20"
                                  : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20",
                              )}
                            >
                              {question.order_index || qGlobalIndex}
                            </span>

                            <div className="flex-1 space-y-4 pt-0.5">
                              {cleanHtmlText(question.question_text) && (
                                <RichContent
                                  html={question.question_text}
                                  className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-snug"
                                />
                              )}

                              {question.question_audio_url && (
                                <div className="bg-orange-50/80 dark:bg-gray-800/80 p-3 rounded-2xl border border-orange-200/60 dark:border-gray-700 flex items-center gap-3 max-w-md">
                                  <audio
                                    src={formatStorageUrl(question.question_audio_url)}
                                    controls
                                    className="h-8 w-full"
                                  />
                                </div>
                              )}

                              {/* Question Type Specific Interaction */}
                              <div className="pl-0 pb-1">
                                {question.question_type === "multiple_choice" && (
                                  <RadioGroup
                                    value={answers[question.id] || ""}
                                    onValueChange={(val) =>
                                      onAnswerChange(question.id, val)
                                    }
                                    className="grid gap-2"
                                  >
                                    {question.options.map(
                                      (opt: string, i: number) => (
                                        <div
                                          key={i}
                                          className={cn(
                                            "flex items-center space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                                            answers[question.id] === opt
                                              ? "bg-white border-orange-500 shadow-xs ring-1 ring-orange-500/20"
                                              : "bg-gray-50/50 border-gray-200/80 hover:bg-white",
                                          )}
                                        >
                                          <RadioGroupItem
                                            value={opt}
                                            id={`${question.id}-${i}`}
                                          />
                                          <Label
                                            htmlFor={`${question.id}-${i}`}
                                            className="flex-1 cursor-pointer font-semibold text-gray-800 dark:text-gray-200"
                                          >
                                            <span className="text-orange-600 dark:text-orange-400 mr-2 text-xs font-extrabold">
                                              {String.fromCharCode(65 + i)}.
                                            </span>
                                            {opt}
                                          </Label>
                                        </div>
                                      ),
                                    )}
                                  </RadioGroup>
                                )}

                                {isRecorderType(question.question_type) && (
                                  <QuestionRecorder
                                    questionId={question.id}
                                    answer={answers[question.id]}
                                    onAnswerChange={onAnswerChange}
                                    onRecordingStateChange={onRecordingStateChange}
                                  />
                                )}

                                {question.question_type === "fill_blank" &&
                                  hasFillBlankPlaceholders(
                                    question.question_text,
                                  ) && (
                                    <FillBlankHtmlRenderer
                                      html={question.question_text}
                                      answers={answers[question.id] || {}}
                                      questionId={question.id}
                                      onAnswerChange={onAnswerChange}
                                    />
                                  )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
