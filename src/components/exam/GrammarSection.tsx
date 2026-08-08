import { MutableRefObject } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, BookOpen, CheckSquare, PenTool } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { QuestionRecorder } from "./QuestionRecorder";
import {
  FillBlankHtmlRenderer,
  hasFillBlankPlaceholders,
} from "./FillBlankHtmlRenderer";
import { DropdownSelect } from "./DropdownSelect";
import { MatchingRenderer } from "./MatchingRenderer";
import { RichContent } from "./RichContent";

interface GrammarSectionProps {
  section: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
  questionRefs?: MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  onQuestionFocus?: (questionId: string) => void;
}

const cleanHtmlText = (html?: string) => {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text ? html : "";
};

function WordCount({ text }: { text: string }) {
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground font-semibold pt-1">
      <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-700">
        📝 {count} từ
      </span>
    </div>
  );
}

export function GrammarSection({
  section,
  answers,
  onAnswerChange,
  questionRefs,
  currentQuestionId,
  onQuestionFocus,
}: GrammarSectionProps) {
  const rawGroups = section.question_groups || section.questionGroups || [];

  // Normalize question fields from camelCase to snake_case
  const questionGroups = rawGroups
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

  const cleanSectionInstructions = cleanHtmlText(section.instructions);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-slate-50/50 dark:bg-neutral-950/50">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-32">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent p-6 rounded-3xl border border-teal-200/60 dark:border-teal-900/30 shadow-xs">
            <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400 mb-2">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {section.title || "Grammar & Vocabulary Practice"}
                </h2>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  Thực hiện các bài tập ngữ pháp và từ vựng
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
            {(() => {
              let questionCounter = 0;
              return questionGroups.map((group: any, gIndex: number) => {
                const rawTitle = group.title || "";
                const hasPartInTitle = /part|phần/i.test(rawTitle);
                const displayTitle = rawTitle || `Phần ${gIndex + 1}`;
                const groupInst = cleanHtmlText(group.instructions);

                return (
                  <div key={group.id} className="space-y-6">
                    {/* Group Header */}
                    {(displayTitle || groupInst) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {!hasPartInTitle && (
                            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-xs">
                              Phần {gIndex + 1}
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

                    {/* Group Passage */}
                    {group.passage && (
                      <div className="bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-teal-100/40 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-teal-900/20 border border-teal-300/70 dark:border-teal-700/40 rounded-3xl p-6 shadow-md shadow-teal-500/5 relative overflow-hidden">
                        <div className="flex items-center gap-2.5 text-teal-800 dark:text-teal-300 font-bold mb-4 uppercase text-xs tracking-widest bg-teal-200/60 dark:bg-teal-900/50 px-3.5 py-1.5 rounded-full w-fit">
                          <BookOpen className="h-4 w-4" />
                          <span>Thông tin bài tập</span>
                        </div>
                        <RichContent
                          html={group.passage}
                          variant="passage"
                          className="text-gray-900 dark:text-gray-100 text-base leading-relaxed font-medium"
                        />
                      </div>
                    )}

                    {/* Group Audio */}
                    {(group.audioUrl || group.audio_url) && (
                      <div className="bg-teal-50/80 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-teal-200/60 dark:border-gray-700 flex items-center gap-3 max-w-md">
                        <audio
                          src={group.audioUrl || group.audio_url}
                          controls
                          className="h-8 w-full"
                        />
                      </div>
                    )}

                    {/* Questions */}
                    <div className="space-y-4">
                      {(group.questions || []).map(
                        (question: any, qIndex: number) => {
                          questionCounter++;
                          const isCurrent =
                            question.id === currentQuestionId ||
                            currentQuestionId?.startsWith(
                              `${question.id}::blank:`,
                            );
                          const focusQuestionId =
                            question.question_type === "fill_blank"
                              ? `${question.id}::blank:0`
                              : question.id;

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
                                    {questionCounter}
                                  </span>

                                  <div className="flex-1 space-y-4 pt-0.5">
                                    {cleanHtmlText(question.question_text) &&
                                      !(
                                        question.question_type ===
                                          "fill_blank" &&
                                        hasFillBlankPlaceholders(
                                          question.question_text,
                                        )
                                      ) && (
                                        <RichContent
                                          html={question.question_text}
                                          className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-snug"
                                        />
                                      )}

                                    {question.question_audio_url && (
                                      <div className="bg-teal-50/80 dark:bg-gray-800/80 p-3 rounded-2xl border border-teal-200/60 dark:border-gray-700 flex items-center gap-3 max-w-md">
                                        <audio
                                          src={question.question_audio_url}
                                          controls
                                          className="h-8 w-full"
                                        />
                                      </div>
                                    )}

                                    {/* Interaction types */}
                                    <div className="pt-1">
                                      {/* Multiple Choice */}
                                      {(question.question_type ===
                                        "multiple_choice" ||
                                        (question.question_type ===
                                          "listening" &&
                                          question.options &&
                                          question.options.length > 0)) &&
                                        question.options &&
                                        question.options.length > 0 &&
                                        (() => {
                                          const selectedRaw =
                                            answers[question.id];
                                          const selectedValues = Array.isArray(
                                            selectedRaw,
                                          )
                                            ? selectedRaw
                                            : selectedRaw
                                            ? [selectedRaw]
                                            : [];
                                          const hasMultipleCorrect =
                                            typeof question.correct_answer ===
                                              "string" &&
                                            question.correct_answer
                                              .split("|")
                                              .map((v: string) => v.trim())
                                              .filter(Boolean).length > 1;

                                          const currentAnswers =
                                            typeof question.correct_answer ===
                                            "string"
                                              ? question.correct_answer
                                                  .split("|")
                                                  .map((v: string) => v.trim())
                                                  .filter(Boolean)
                                              : [];

                                          if (hasMultipleCorrect) {
                                            const expectedCount =
                                              currentAnswers.length;
                                            return (
                                              <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-3.5 py-2">
                                                  <CheckSquare className="h-4 w-4 flex-shrink-0" />
                                                  <span>
                                                    Chọn {expectedCount} đáp án
                                                    phù hợp
                                                  </span>
                                                  <span className="ml-auto text-muted-foreground font-normal">
                                                    Đã chọn:{" "}
                                                    {selectedValues.length}/
                                                    {expectedCount}
                                                  </span>
                                                </div>
                                                <div className="grid gap-2">
                                                  {question.options.map(
                                                    (
                                                      option: string,
                                                      i: number,
                                                    ) => {
                                                      const checked =
                                                        selectedValues.includes(
                                                          option,
                                                        );
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
                                                            onCheckedChange={(
                                                              next,
                                                            ) => {
                                                              const nextValues =
                                                                new Set(
                                                                  selectedValues,
                                                                );
                                                              if (next)
                                                                nextValues.add(
                                                                  option,
                                                                );
                                                              else
                                                                nextValues.delete(
                                                                  option,
                                                                );
                                                              onAnswerChange(
                                                                question.id,
                                                                Array.from(
                                                                  nextValues,
                                                                ),
                                                              );
                                                            }}
                                                          />
                                                          <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                                            <span className="text-teal-600 dark:text-teal-400 mr-2 text-xs font-extrabold">
                                                              {String.fromCharCode(
                                                                65 + i,
                                                              )}
                                                              .
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
                                              onValueChange={(value) =>
                                                onAnswerChange(
                                                  question.id,
                                                  value,
                                                )
                                              }
                                              className="grid gap-2"
                                            >
                                              {question.options.map(
                                                (
                                                  option: string,
                                                  i: number,
                                                ) => (
                                                  <div
                                                    key={i}
                                                    className={cn(
                                                      "flex items-center space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer",
                                                      answers[question.id] ===
                                                        option
                                                        ? "bg-white border-teal-500 shadow-xs ring-1 ring-teal-500/20"
                                                        : "bg-gray-50/50 border-gray-200/80 hover:bg-white",
                                                    )}
                                                  >
                                                    <RadioGroupItem
                                                      value={option}
                                                      id={`${question.id}-${i}`}
                                                    />
                                                    <Label
                                                      htmlFor={`${question.id}-${i}`}
                                                      className="flex-1 cursor-pointer font-semibold text-gray-800 dark:text-gray-200 text-sm"
                                                    >
                                                      <span className="text-teal-600 dark:text-teal-400 mr-2 text-xs font-extrabold">
                                                        {String.fromCharCode(
                                                          65 + i,
                                                        )}
                                                        .
                                                      </span>
                                                      {option}
                                                    </Label>
                                                  </div>
                                                ),
                                              )}
                                            </RadioGroup>
                                          );
                                        })()}

                                      {/* Fill Blank */}
                                      {question.question_type ===
                                        "fill_blank" && (
                                        <div className="space-y-3">
                                          {hasFillBlankPlaceholders(
                                            question.question_text,
                                          ) ? (
                                            <FillBlankHtmlRenderer
                                              html={question.question_text}
                                              answers={
                                                answers[question.id] || {}
                                              }
                                              questionId={question.id}
                                              onAnswerChange={onAnswerChange}
                                              questionRefs={questionRefs}
                                              currentQuestionId={
                                                currentQuestionId
                                              }
                                            />
                                          ) : (
                                            <Input
                                              placeholder="Viết câu trả lời của bạn..."
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
                                      {question.question_type ===
                                        "short_answer" && (
                                        <div className="space-y-2">
                                          <Textarea
                                            placeholder="Viết câu trả lời của bạn..."
                                            value={answers[question.id] || ""}
                                            onChange={(e) =>
                                              onAnswerChange(
                                                question.id,
                                                e.target.value,
                                              )
                                            }
                                            rows={5}
                                            className="resize-y rounded-2xl p-4 text-base border-gray-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs font-medium leading-relaxed"
                                          />
                                          <WordCount
                                            text={answers[question.id] || ""}
                                          />
                                        </div>
                                      )}

                                      {/* Speaking / Audio Answer */}
                                      {question.question_type ===
                                        "speaking" && (
                                        <QuestionRecorder
                                          questionId={question.id}
                                          answer={answers[question.id]}
                                          onAnswerChange={onAnswerChange}
                                        />
                                      )}

                                      {/* Essay */}
                                      {question.question_type === "essay" && (
                                        <div className="space-y-2">
                                          <Textarea
                                            placeholder="Viết bài luận của bạn..."
                                            value={answers[question.id] || ""}
                                            onChange={(e) =>
                                              onAnswerChange(
                                                question.id,
                                                e.target.value,
                                              )
                                            }
                                            rows={9}
                                            className="resize-y rounded-2xl p-4 text-base border-gray-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs font-medium leading-relaxed"
                                          />
                                          <WordCount
                                            text={answers[question.id] || ""}
                                          />
                                        </div>
                                      )}

                                      {/* TRUE/FALSE/NOT GIVEN */}
                                      {(question.question_type ===
                                        "true_false_not_given" ||
                                        question.question_type ===
                                          "yes_no_not_given") && (
                                        <div className="max-w-[220px]">
                                          <DropdownSelect
                                            value={answers[question.id] || ""}
                                            onChange={(value) =>
                                              onAnswerChange(
                                                question.id,
                                                value,
                                              )
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

                                      {question.question_type ===
                                        "matching" && (
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
                        },
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
