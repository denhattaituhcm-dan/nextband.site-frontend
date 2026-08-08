import { useState, useMemo, MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Headphones, CheckSquare, BookOpen, Volume2 } from "lucide-react";
import { StickyAudioPlayer } from "./StickyAudioPlayer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { RichContent } from "./RichContent";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { DropdownSelect } from "./DropdownSelect";
import { MatchingRenderer } from "./MatchingRenderer";
import { formatStorageUrl } from "@/lib/api";

interface ListeningSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  strictMode?: boolean;
  showTranscript?: boolean;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

const cleanHtmlText = (html?: string) => {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text ? html : "";
};

const sanitizeQuestionText = (text?: string) => {
  if (!text) return "";
  return text
    .replace(/^[\s#n]+/, "") // Remove leading #, ##, nn, etc.
    .replace(/^nn\s*/gi, "")
    .replace(/^\d+[\.\)]\s*/, "") // Remove leading numbers like "13. " or "11) "
    .trim();
};

export function ListeningSection({
  section,
  answers,
  onAnswerChange,
  strictMode = false,
  showTranscript = false,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: ListeningSectionProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields from camelCase to snake_case
  const questionGroups = useMemo(() => {
    return rawGroups
      .map((g: any) => ({
        ...g,
        questions: (g.questions || [])
          .map((q: any) => ({
            ...q,
            question_text: q.question_text || q.questionText || "",
            question_type: q.question_type || q.questionType || "short_answer",
            question_audio_url:
              q.audioUrl || q.audio_url || q.question_audio_url || null,
            order_index: q.order_index ?? q.orderIndex ?? 0,
            correct_answer: q.correct_answer || q.correctAnswer || null,
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
              : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }),
      }))
      .sort((a: any, b: any) => {
        const orderDiff =
          (a.order_index || a.orderIndex || 0) -
          (b.order_index || b.orderIndex || 0);
        return orderDiff !== 0
          ? orderDiff
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [rawGroups]);

  // Flatten questions for global index calculation
  const allQuestions = useMemo(() => {
    return questionGroups.flatMap((g: any) => g.questions);
  }, [questionGroups]);

  // Get current part questions
  const currentGroup = questionGroups[currentPart] || questionGroups[0];
  const currentQuestions = currentGroup?.questions || [];
  const currentGroupAudioUrl =
    currentGroup?.audioUrl || currentGroup?.audio_url || null;

  const rawAudioUrl = section.audio_url || section.audioUrl || currentGroupAudioUrl;
  const formattedAudioUrl = rawAudioUrl ? formatStorageUrl(rawAudioUrl) : "";

  const cleanSectionInstructions = cleanHtmlText(section.instructions);

  return (
    <div className="h-full flex flex-col bg-slate-50/50 dark:bg-neutral-950/50">
      {/* Sticky Audio Player */}
      {formattedAudioUrl && (
        <StickyAudioPlayer
          audioUrl={formattedAudioUrl}
          strictMode={strictMode}
        />
      )}

      {/* Part Navigation */}
      {questionGroups.length > 1 && (
        <div className="flex items-center gap-2 p-3 px-6 border-b bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md overflow-x-auto">
          {questionGroups.map((group: any, index: number) => {
            const groupQuestions = group.questions || [];
            const firstQIndex =
              allQuestions.findIndex((q: any) => q.id === groupQuestions[0]?.id) + 1;
            const lastQIndex = firstQIndex + groupQuestions.length - 1;
            const rangeLabel =
              groupQuestions.length > 0
                ? `Câu ${firstQIndex}-${lastQIndex}`
                : `Part ${index + 1}`;

            return (
              <Button
                key={group.id}
                variant={currentPart === index ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPart(index)}
                className={cn(
                  "rounded-full text-xs font-extrabold px-4 transition-all",
                  currentPart === index
                    ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xs"
                    : "border-gray-200 hover:bg-teal-50 text-gray-700 dark:text-gray-300",
                )}
              >
                {group.title || rangeLabel}
              </Button>
            );
          })}
        </div>
      )}

      {/* Main Single-Column Layout */}
      <div className="flex-1 overflow-hidden">
        {/* Transcript/Passage - Hidden during exam, only shown in review mode */}
        {showTranscript && currentGroup?.passage && (
          <div className="p-6 pb-0 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-teal-50/90 to-emerald-50/40 border border-teal-200/80 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center gap-2 text-teal-800 font-bold mb-3 uppercase text-xs tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>Transcript / Bài nghe</span>
              </div>
              <RichContent
                html={currentGroup.passage}
                className="leading-relaxed text-gray-900 text-base font-medium"
              />
            </div>
          </div>
        )}

        {/* Questions Scroll Container */}
        <ScrollArea className="flex-1 h-full">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-32">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 rounded-3xl border border-teal-200/60 dark:border-teal-900/30 shadow-xs">
                <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400 mb-2">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                      {section.title || "IELTS Listening Test"}
                    </h2>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      Lắng nghe đoạn băng audio và hoàn thành các câu hỏi
                    </p>
                  </div>
                </div>

                {cleanSectionInstructions && (
                  <div className="mt-4 p-4 bg-white/90 dark:bg-gray-900/90 border border-teal-200/80 dark:border-teal-900/40 rounded-2xl text-sm text-gray-800 dark:text-gray-200 font-medium shadow-xs">
                    <RichContent html={cleanSectionInstructions} />
                  </div>
                )}
              </div>

              {/* In-Page Group Audio Part Player */}
              {currentGroupAudioUrl && (
                <div className="bg-gradient-to-r from-teal-50/90 to-emerald-50/60 dark:from-neutral-900 dark:to-neutral-800 p-4 px-6 rounded-3xl border border-teal-200/80 dark:border-teal-900/40 shadow-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400 font-extrabold text-sm shrink-0">
                    <div className="p-2 rounded-xl bg-teal-500/10">
                      <Volume2 className="h-5 w-5" />
                    </div>
                    <span>Audio Part {currentPart + 1}</span>
                  </div>

                  <div className="flex-1 max-w-md">
                    <audio
                      src={formatStorageUrl(currentGroupAudioUrl)}
                      controls
                      className="h-9 w-full rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Current Group Container */}
              {currentGroup && (
                <div className="space-y-6">
                  {/* Group Header & Instructions */}
                  {(() => {
                    const rawTitle = currentGroup.title || "";
                    const hasPartInTitle = /part|phần/i.test(rawTitle);
                    const displayTitle = rawTitle || `Part ${currentPart + 1}`;
                    const groupInst = cleanHtmlText(currentGroup.instructions);

                    return (displayTitle || groupInst) ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {!hasPartInTitle && (
                            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
                              Part {currentPart + 1}
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
                    ) : null;
                  })()}

                  {/* Questions List */}
                  <div className="space-y-4">
                    {currentQuestions.map((question: any, qIndex: number) => {
                      const isCurrent =
                        question.id === currentQuestionId ||
                        currentQuestionId?.startsWith(`${question.id}::blank:`);
                      const focusQuestionId =
                        question.question_type === "fill_blank"
                          ? `${question.id}::blank:0`
                          : question.id;

                      const qGlobalIndex =
                        allQuestions.findIndex((q) => q.id === question.id) + 1;
                      const displayNumber =
                        question.order_index && question.order_index > 0
                          ? question.order_index
                          : qGlobalIndex;

                      const cleanQText = sanitizeQuestionText(question.question_text);

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
                              ? "ring-2 ring-teal-500 border-transparent bg-gradient-to-b from-white to-teal-50/30 dark:from-gray-900 dark:to-teal-950/10 shadow-lg shadow-teal-500/10"
                              : "bg-white dark:bg-gray-900 hover:border-teal-300/50",
                          )}
                          onClick={() => onQuestionFocus?.(focusQuestionId)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/20 shadow-xs">
                                {displayNumber}
                              </span>

                              <div className="flex-1 space-y-4 pt-0.5">
                                {cleanQText &&
                                  !(
                                    question.question_type === "fill_blank" &&
                                    hasFillBlankPlaceholders(cleanQText)
                                  ) && (
                                    <RichContent
                                      html={cleanQText}
                                      className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-snug"
                                    />
                                  )}

                                {question.question_audio_url && (
                                  <div className="bg-teal-50/80 dark:bg-gray-800/80 p-3 rounded-2xl border border-teal-200/60 dark:border-gray-700 flex items-center gap-3 max-w-md">
                                    <audio
                                      src={formatStorageUrl(question.question_audio_url)}
                                      controls
                                      className="h-8 w-full"
                                    />
                                  </div>
                                )}

                                {/* Question Type Specific Interaction */}
                                <div className="pt-1">
                                  {(question.question_type === "multiple_choice" ||
                                    (question.question_type === "listening" &&
                                      question.options &&
                                      question.options.length > 0)) &&
                                    question.options &&
                                    question.options.length > 0 &&
                                    (() => {
                                      const selectedRaw = answers[question.id];
                                      const selectedValues = Array.isArray(selectedRaw)
                                        ? selectedRaw
                                        : selectedRaw
                                        ? [selectedRaw]
                                        : [];
                                      const hasMultipleCorrect =
                                        typeof question.correct_answer === "string" &&
                                        question.correct_answer
                                          .split("|")
                                          .map((v: string) => v.trim())
                                          .filter(Boolean).length > 1;

                                      if (hasMultipleCorrect) {
                                        return (
                                          <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-3.5 py-2">
                                              <CheckSquare className="h-4 w-4 flex-shrink-0" />
                                              <span>Chọn các đáp án phù hợp</span>
                                            </div>
                                            <div className="grid gap-2">
                                              {question.options.map(
                                                (option: string, i: number) => {
                                                  const checked =
                                                    selectedValues.includes(option);
                                                  return (
                                                    <label
                                                      key={i}
                                                      className={cn(
                                                        "flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                                                        checked
                                                          ? "bg-white border-teal-500 shadow-xs ring-1 ring-teal-500/20"
                                                          : "bg-gray-50/50 border-gray-200/80 hover:bg-white",
                                                      )}
                                                    >
                                                      <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(next) => {
                                                          const nextValues = new Set(
                                                            selectedValues,
                                                          );
                                                          if (next) nextValues.add(option);
                                                          else nextValues.delete(option);
                                                          onAnswerChange(
                                                            question.id,
                                                            Array.from(nextValues),
                                                          );
                                                        }}
                                                      />
                                                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                                        <span className="text-teal-600 dark:text-teal-400 mr-2 text-xs font-extrabold">
                                                          {String.fromCharCode(65 + i)}.
                                                        </span>
                                                        {option}
                                                      </span>
                                                    </label>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <RadioGroup
                                          value={selectedValues[0] || ""}
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
                                                    ? "bg-white border-teal-500 shadow-xs ring-1 ring-teal-500/20"
                                                    : "bg-gray-50/50 border-gray-200/80 hover:bg-white",
                                                )}
                                              >
                                                <RadioGroupItem
                                                  value={opt}
                                                  id={`${question.id}-${i}`}
                                                />
                                                <Label
                                                  htmlFor={`${question.id}-${i}`}
                                                  className="flex-1 cursor-pointer font-semibold text-gray-800 dark:text-gray-200 text-sm"
                                                >
                                                  <span className="text-teal-600 dark:text-teal-400 mr-2 text-xs font-extrabold">
                                                    {String.fromCharCode(65 + i)}.
                                                  </span>
                                                  {opt}
                                                </Label>
                                              </div>
                                            ),
                                          )}
                                        </RadioGroup>
                                      );
                                    })()}

                                  {/* Fill Blank */}
                                  {question.question_type === "fill_blank" && (
                                    <div className="space-y-3">
                                      {hasFillBlankPlaceholders(cleanQText) ? (
                                        <FillBlankHtmlRenderer
                                          html={cleanQText}
                                          answers={answers[question.id] || {}}
                                          questionId={question.id}
                                          onAnswerChange={onAnswerChange}
                                          questionRefs={questionRefs}
                                          currentQuestionId={currentQuestionId}
                                        />
                                      ) : (
                                        <Input
                                          placeholder="Nhập đáp án của bạn..."
                                          value={answers[question.id] || ""}
                                          onChange={(e) =>
                                            onAnswerChange(
                                              question.id,
                                              e.target.value,
                                            )
                                          }
                                          className="max-w-md h-12 rounded-2xl text-base border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs font-medium"
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Short Answer */}
                                  {question.question_type === "short_answer" && (
                                    <Input
                                      placeholder="Nhập câu trả lời..."
                                      value={answers[question.id] || ""}
                                      onChange={(e) =>
                                        onAnswerChange(
                                          question.id,
                                          e.target.value,
                                        )
                                      }
                                      className="max-w-md h-12 rounded-2xl text-base border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs font-medium"
                                    />
                                  )}

                                  {/* TRUE / FALSE / NOT GIVEN */}
                                  {(question.question_type ===
                                    "true_false_not_given" ||
                                    question.question_type ===
                                      "yes_no_not_given") && (
                                    <div className="max-w-[220px]">
                                      <DropdownSelect
                                        value={answers[question.id] || ""}
                                        onChange={(value) =>
                                          onAnswerChange(question.id, value)
                                        }
                                        options={
                                          question.question_type ===
                                          "true_false_not_given"
                                            ? ["TRUE", "FALSE", "NOT GIVEN"]
                                            : ["YES", "NO", "NOT GIVEN"]
                                        }
                                        placeholder="Chọn đáp án"
                                      />
                                    </div>
                                  )}

                                  {/* Matching */}
                                  {question.question_type === "matching" && (
                                    <MatchingRenderer
                                      question={question}
                                      answers={answers}
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
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
