import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical, X, Check, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface NormalizedOption {
  index: number; // 0-based index
  label: string; // "A", "B", "C"...
  text: string;  // "ancient forts"
}

export interface NormalizedItem {
  index: number; // 0-based index
  text: string;  // "Asia"
}

export interface NormalizedMatchingModel {
  items: NormalizedItem[];
  options: NormalizedOption[];
  pairs: Record<string, number>; // itemIndex -> optionIndex (number)
  allowMultipleUse: boolean;
}

interface MatchingRendererProps {
  question: any;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, answer: any) => void;
}

/**
 * Safely converts Roman numerals or Letters ("A", "B", "I", "II") or numbers ("0", "1") to 0-based index.
 * Returns null if invalid or unanswered.
 */
export function convertOptionValToIndex(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().toUpperCase();
  if (!str) return null;

  // If already a valid number string e.g. "0", "1"
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  }

  // Letters: "A" -> 0, "B" -> 1, "Z" -> 25
  if (/^[A-Z]$/.test(str)) {
    return str.charCodeAt(0) - 65;
  }

  // Roman numerals: I, II, III, IV, V, VI, VII, VIII, IX, X...
  const romanMap: Record<string, number> = {
    I: 0,
    II: 1,
    III: 2,
    IV: 3,
    V: 4,
    VI: 5,
    VII: 6,
    VIII: 7,
    IX: 8,
    X: 9,
    XI: 10,
    XII: 11,
    XIII: 12,
    XIV: 13,
    XV: 14,
  };

  if (str in romanMap) {
    return romanMap[str];
  }

  return null;
}

/**
 * Normalizes raw question data into clean NormalizedMatchingModel.
 * Single source of truth for MatchingRenderer.
 */
export const parseMatchingData = (question: any): NormalizedMatchingModel => {
  let rawOptions: string[] = [];
  let rawItems: string[] = [];
  let rawPairs: Record<string, any> = {};

  // Parse correctAnswer / correct_answer JSON
  const jsonStr = question.correctAnswer || question.correct_answer;
  let parsedCorrect: any = null;
  if (jsonStr) {
    try {
      parsedCorrect = typeof jsonStr === "object" ? jsonStr : JSON.parse(jsonStr);
    } catch {}
  }

  // Check question.options
  let questionOptions: string[] = [];
  if (Array.isArray(question.options)) {
    questionOptions = question.options;
  } else if (typeof question.options === "string" && question.options.trim()) {
    try {
      const parsed = JSON.parse(question.options);
      if (Array.isArray(parsed)) questionOptions = parsed;
    } catch {}
  }

  // Fallback Logic: Only use question.options if it contains valid non-empty option text
  const hasValidQuestionOptions =
    questionOptions.length > 0 &&
    questionOptions.some((opt) => typeof opt === "string" && opt.trim().length > 0);

  if (hasValidQuestionOptions) {
    rawOptions = questionOptions;
  } else if (parsedCorrect && Array.isArray(parsedCorrect.options)) {
    rawOptions = parsedCorrect.options;
  }

  if (parsedCorrect) {
    if (Array.isArray(parsedCorrect.items)) rawItems = parsedCorrect.items;
    if (parsedCorrect.pairs && typeof parsedCorrect.pairs === "object") {
      rawPairs = parsedCorrect.pairs;
    }
  }

  // Filter & Map options
  const options: NormalizedOption[] = rawOptions.map((optText, i) => ({
    index: i,
    label: String.fromCharCode(65 + i),
    text: typeof optText === "string" ? optText : String(optText || ""),
  }));

  // Filter & Map items
  const items: NormalizedItem[] = rawItems.map((itemText, i) => ({
    index: i,
    text: typeof itemText === "string" ? itemText : String(itemText || ""),
  }));

  // Normalize pairs (itemIndex -> optionIndex number)
  const pairs: Record<string, number> = {};
  Object.entries(rawPairs).forEach(([itemIdxKey, optVal]) => {
    const itemIdx = convertOptionValToIndex(itemIdxKey);
    const optIdx = convertOptionValToIndex(optVal);
    if (itemIdx !== null && optIdx !== null) {
      pairs[String(itemIdx)] = optIdx;
    }
  });

  // Check reuse rule from question properties
  const allowMultipleUse = Boolean(
    question.allowMultiple ||
    question.allow_multiple ||
    question.multipleUse ||
    question.allowMultipleUse ||
    (parsedCorrect && parsedCorrect.allowMultiple)
  );

  return { items, options, pairs, allowMultipleUse };
};

export const MatchingRenderer = ({
  question,
  answers,
  onAnswerChange,
}: MatchingRendererProps) => {
  const data = useMemo(() => parseMatchingData(question), [question]);
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);

  // currentAnswers maps itemIndex (string "0", "1"...) to optionIndex (number or string)
  const currentAnswers = useMemo(() => {
    const ans = answers[question.id];
    if (!ans) return {};
    let parsed = ans;
    if (typeof ans === "string") {
      try {
        parsed = JSON.parse(ans);
      } catch {
        return {};
      }
    }
    if (typeof parsed !== "object" || parsed === null) return {};

    // Normalize student answer values to optionIndex numbers
    const normalized: Record<string, number> = {};
    Object.entries(parsed).forEach(([k, v]) => {
      const idx = convertOptionValToIndex(v);
      if (idx !== null) {
        normalized[k] = idx;
      }
    });
    return normalized;
  }, [answers, question.id]);

  const handleMatch = (itemIndex: number, optionIndex: number | null) => {
    const newAnswers = { ...currentAnswers };
    const itemKey = String(itemIndex);

    if (optionIndex === null) {
      delete newAnswers[itemKey];
    } else {
      newAnswers[itemKey] = optionIndex;
    }
    onAnswerChange(question.id, newAnswers);
  };

  const usedOptionIndexes = useMemo(() => {
    return Object.values(currentAnswers) as number[];
  }, [currentAnswers]);

  const availableOptions = useMemo(() => {
    if (data.allowMultipleUse) return data.options;
    return data.options.filter((opt) => !usedOptionIndexes.includes(opt.index));
  }, [data.options, data.allowMultipleUse, usedOptionIndexes]);

  const allUsed = !data.allowMultipleUse && data.options.length > 0 && availableOptions.length === 0;

  return (
    <div className="space-y-6 py-4">
      {/* OPTIONS POOL */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Danh sách lựa chọn (Options)
          </h4>
          {!data.allowMultipleUse && (
            <span className="text-xs text-muted-foreground">
              {availableOptions.length} / {data.options.length} lựa chọn khả dụng
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-teal-50/40 rounded-xl border-2 border-dashed border-teal-200/60 min-h-[64px]">
          {data.options.map((opt) => {
            const isUsed = !data.allowMultipleUse && usedOptionIndexes.includes(opt.index);

            return (
              <div
                key={opt.index}
                draggable={!isUsed}
                onDragStart={() => !isUsed && setDraggedOptionIndex(opt.index)}
                onDragEnd={() => setDraggedOptionIndex(null)}
                className={cn(
                  "p-2.5 rounded-lg border-2 flex items-start gap-2.5 transition-all duration-200 select-none",
                  isUsed
                    ? "opacity-45 bg-slate-100 border-slate-200 border-dashed cursor-not-allowed"
                    : "cursor-grab active:cursor-grabbing bg-white border-teal-100 hover:border-teal-400 shadow-sm hover:shadow-md group"
                )}
              >
                <div
                  className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors mt-0.5",
                    isUsed
                      ? "bg-slate-200 text-slate-500"
                      : "bg-teal-100 text-teal-700 group-hover:bg-teal-500 group-hover:text-white"
                  )}
                >
                  {opt.label}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 text-xs leading-relaxed break-words whitespace-normal block">
                    {opt.text || `Lựa chọn ${opt.label}`}
                  </span>
                </div>

                {isUsed ? (
                  <Check className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-teal-400 transition-colors flex-shrink-0 mt-0.5 hidden sm:block" />
                )}
              </div>
            );
          })}

          {allUsed && (
            <div className="col-span-full flex flex-col items-center justify-center py-3 text-teal-600/70">
              <Check className="h-5 w-5 mb-1 text-teal-500" />
              <p className="text-xs font-medium italic">Tất cả đáp án đã được nối!</p>
            </div>
          )}

          {data.options.length === 0 && (
            <p className="col-span-full text-xs text-muted-foreground italic w-full text-center py-2">
              Chưa có lựa chọn nào
            </p>
          )}
        </div>
      </div>

      {/* MATCHING QUESTIONS / ANSWER SLOTS */}
      <div className="flex flex-col gap-3">
        {data.items.map((item) => {
          const matchedOptIdx = currentAnswers[String(item.index)];
          const matchedOption =
            matchedOptIdx !== undefined && matchedOptIdx !== null
              ? data.options[matchedOptIdx]
              : null;
          const isDragTarget = draggedOptionIndex !== null;

          return (
            <Card
              key={item.index}
              className={cn(
                "transition-all duration-200 border-2",
                matchedOption
                  ? "border-teal-500 bg-teal-50/20"
                  : "border-slate-200 bg-white hover:border-teal-200",
                isDragTarget && "border-teal-400 border-dashed bg-teal-50/10"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedOptionIndex !== null) {
                  handleMatch(item.index, draggedOptionIndex);
                }
              }}
            >
              <CardContent className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Question item text */}
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                    Câu {item.index + 1}
                  </span>
                  <p className="text-slate-900 font-semibold text-sm leading-snug break-words">
                    {item.text || `Câu hỏi ${item.index + 1}`}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="hidden sm:flex items-center text-slate-300 flex-shrink-0">
                  <span className="text-lg leading-none">→</span>
                </div>

                {/* ANSWER SLOT */}
                <div className="flex-shrink-0 sm:w-64 min-h-[44px]">
                  {matchedOption ? (
                    <div className="h-full min-h-[44px] rounded-lg border-2 border-teal-500 bg-white flex items-center justify-between p-2 shadow-sm gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-6 w-6 rounded-md bg-teal-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                          {matchedOption.label}
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate leading-tight">
                          {matchedOption.text || `Lựa chọn ${matchedOption.label}`}
                        </span>
                      </div>

                      {/* Select to Replace or Clear */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Select
                          value={String(matchedOption.index)}
                          onValueChange={(val) => handleMatch(item.index, parseInt(val, 10))}
                        >
                          <SelectTrigger className="h-7 w-7 p-0 border-none bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 flex items-center justify-center rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[80] max-h-60">
                            {data.options.map((opt) => (
                              <SelectItem key={opt.index} value={String(opt.index)}>
                                <span className="font-bold mr-1.5">{opt.label}.</span>
                                <span>{opt.text}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <button
                          type="button"
                          onClick={() => handleMatch(item.index, null)}
                          className="h-7 w-7 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                          title="Gỡ đáp án (Return to Pool)"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "h-full min-h-[44px] rounded-lg border-2 border-dashed flex items-center justify-between p-1.5 transition-all",
                        isDragTarget
                          ? "border-teal-400 bg-teal-50/20"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-teal-300"
                      )}
                    >
                      <Select
                        value=""
                        onValueChange={(val) => handleMatch(item.index, parseInt(val, 10))}
                        disabled={availableOptions.length === 0}
                      >
                        <SelectTrigger className="h-8 w-full border-none bg-transparent shadow-none text-xs text-slate-500 hover:text-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded bg-slate-200 text-slate-500 flex items-center justify-center flex-shrink-0">
                              <Plus className="h-3 w-3" />
                            </div>
                            <SelectValue
                              placeholder={
                                availableOptions.length === 0
                                  ? "Hết lựa chọn"
                                  : "Chọn đáp án (hoặc kéo thả)"
                              }
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="z-[80] max-h-60">
                          {availableOptions.map((opt) => (
                            <SelectItem key={opt.index} value={String(opt.index)}>
                              <span className="font-bold mr-1.5">{opt.label}.</span>
                              <span>{opt.text}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.items.length > 0 && (
        <div className="bg-teal-50/60 border border-teal-200/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-teal-800">
          <div className="h-5 w-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
            !
          </div>
          <p className="leading-relaxed">
            <strong>Hướng dẫn:</strong> Kéo các thẻ lựa chọn ở trên thả vào câu hỏi, hoặc bấm vào ô trả lời để chọn đáp án từ danh sách. Bấm nút <strong>✕</strong> để gỡ đáp án.
          </p>
        </div>
      )}
    </div>
  );
};
