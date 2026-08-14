import React from "react";
import { EssayControl } from "./controls/EssayControl";
import { FillBlankHtmlRenderer, hasFillBlankPlaceholders } from "./FillBlankHtmlRenderer";
import { MatchingRenderer } from "./MatchingRenderer";
import { DropdownSelect } from "./DropdownSelect";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidMCQOptions } from "@/lib/questionNormalizer";

export interface QuestionControlRendererProps {
  question: any;
  answer: any;
  onAnswerChange: (questionId: string, value: any) => void;
  disabled?: boolean;

  // Optional contextual props for fill_blank passage duplicates & ref mapping
  allAnswers?: Record<string, any>;
  isDuplicatePassageQuestion?: boolean;
  compactBlankKeys?: string[];
  questionRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
  currentQuestionId?: string;
  themeColorClass?: string;
}

export function QuestionControlRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
  allAnswers = {},
  isDuplicatePassageQuestion = false,
  compactBlankKeys = [],
  questionRefs,
  currentQuestionId,
  themeColorClass = "reading",
}: QuestionControlRendererProps) {
  if (!question) return null;

  const questionType = question.question_type || question.questionType || "short_answer";
  const questionText = question.question_text || question.questionText || "";
  const hasPlaceholders = hasFillBlankPlaceholders(questionText);
  const isFillBlankLike = questionType === "fill_blank" || hasPlaceholders;

  // 1. Multiple Choice
  if (questionType === "multiple_choice") {
    if (!isValidMCQOptions(question.options)) {
      return (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Nội dung câu hỏi trắc nghiệm chưa được cấu hình đầy đủ phương án lựa chọn.</span>
        </div>
      );
    }
    const selectedRaw = answer;
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

    const currentAnswers = typeof question.correct_answer === "string"
      ? question.correct_answer.split("|").map((v: string) => v.trim()).filter(Boolean)
      : [];

    if (hasMultipleCorrect) {
      const expectedCount = currentAnswers.length;
      return (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-xs font-semibold text-[hsl(var(--${themeColorClass}))] bg-[hsl(var(--${themeColorClass}))]/8 border border-[hsl(var(--${themeColorClass}))]/20 rounded-lg px-3 py-1.5`}>
            <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Chọn {expectedCount} đáp án phù hợp</span>
            <span className="ml-auto text-muted-foreground font-normal">
              Đã chọn: {selectedValues.length}/{expectedCount}
            </span>
          </div>
          <div className="grid gap-2">
            {question.options.map((option: string, i: number) => {
              const checked = selectedValues.includes(option);
              return (
                <label
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                    checked
                      ? `bg-[hsl(var(--${themeColorClass}))]/5 border-[hsl(var(--${themeColorClass}))]/30 ring-1 ring-[hsl(var(--${themeColorClass}))]/20`
                      : "bg-background border-transparent hover:bg-muted/30",
                    disabled && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => {
                      const nextValues = new Set(selectedValues);
                      if (next) nextValues.add(option);
                      else nextValues.delete(option);
                      onAnswerChange(question.id, Array.from(nextValues));
                    }}
                  />
                  <span className="font-medium text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <RadioGroup
        value={selectedValues[0] || ""}
        onValueChange={(value) => onAnswerChange(question.id, value)}
        disabled={disabled}
        className="grid gap-2"
      >
        {question.options.map((option: string, i: number) => (
          <div
            key={i}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
              answer === option
                ? `bg-[hsl(var(--${themeColorClass}))]/5 border-[hsl(var(--${themeColorClass}))]/30 ring-1 ring-[hsl(var(--${themeColorClass}))]/20`
                : "bg-background border-transparent hover:bg-muted/30",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <RadioGroupItem value={option} id={`${question.id}-${i}`} disabled={disabled} />
            <Label
              htmlFor={`${question.id}-${i}`}
              className="flex-1 cursor-pointer font-medium text-sm"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // 2. Fill Blank / Short Answer
  if (isFillBlankLike || questionType === "short_answer") {
    return (
      <div className="space-y-2">
        {isFillBlankLike ? (
          isDuplicatePassageQuestion ? (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground font-medium">
                Nội dung passage đã hiển thị bên trái. Nhập đáp án theo thứ tự các ô trống:
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {compactBlankKeys.map((blankKey, idx) => (
                  <div key={`${question.id}-${blankKey}`} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Blank {idx + 1}
                    </Label>
                    <Input
                      placeholder={`Đáp án #${idx + 1}`}
                      disabled={disabled}
                      value={(answer || {})[blankKey] || ""}
                      onChange={(e) =>
                        onAnswerChange(question.id, {
                          ...(answer || {}),
                          [blankKey]: e.target.value,
                        })
                      }
                      className="h-10"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <FillBlankHtmlRenderer
              html={questionText}
              answers={typeof answer === "object" ? answer : {}}
              questionId={question.id}
              onAnswerChange={onAnswerChange as any}
              questionRefs={questionRefs}
              currentQuestionId={currentQuestionId}
            />
          )
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Nhập câu trả lời..."
              value={typeof answer === "string" ? answer : ""}
              disabled={disabled}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              className="max-w-md h-11"
            />
            {(question.instruction || question.hint) && (
              <p className="text-[11px] text-muted-foreground font-medium italic">
                Gợi ý: {question.instruction || question.hint}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. True / False / Not Given
  if (questionType === "true_false_not_given") {
    return (
      <div className="max-w-[200px]">
        <DropdownSelect
          value={typeof answer === "string" ? answer : ""}
          onChange={(value) => onAnswerChange(question.id, value)}
          options={["TRUE", "FALSE", "NOT GIVEN"]}
          placeholder="Chọn đáp án"
        />
      </div>
    );
  }

  // 4. Yes / No / Not Given
  if (questionType === "yes_no_not_given") {
    return (
      <div className="max-w-[200px]">
        <DropdownSelect
          value={typeof answer === "string" ? answer : ""}
          onChange={(value) => onAnswerChange(question.id, value)}
          options={["YES", "NO", "NOT GIVEN"]}
          placeholder="Chọn đáp án"
        />
      </div>
    );
  }

  // 5. Matching
  if (questionType === "matching") {
    return (
      <MatchingRenderer
        question={question}
        answers={allAnswers}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  // 6. Essay (Writing / Sentence rewriting / Long answer)
  if (questionType === "essay") {
    return (
      <EssayControl
        questionId={question.id}
        value={typeof answer === "string" ? answer : ""}
        onChange={onAnswerChange}
        disabled={disabled}
        placeholder="Nhập đáp án / câu viết lại của bạn..."
      />
    );
  }

  return null;
}
