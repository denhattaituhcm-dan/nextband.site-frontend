import { useState, useMemo } from "react";
import {
  ErrorCategory,
  SentenceFeedbackItem,
  segmentEssayIntoSentences,
  PRESET_ERROR_TAGS,
  CATEGORY_COLORS,
} from "@/lib/sentenceFeedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Trash2,
  Edit3,
  MessageSquare,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SentenceLevelGraderProps {
  essayText: string;
  sentenceFeedbacks: SentenceFeedbackItem[];
  onChange?: (updated: SentenceFeedbackItem[]) => void;
  readOnly?: boolean;
}

export function SentenceLevelGrader({
  essayText,
  sentenceFeedbacks = [],
  onChange,
  readOnly = false,
}: SentenceLevelGraderProps) {
  const sentences = useMemo(() => segmentEssayIntoSentences(essayText), [essayText]);

  const feedbackMap = useMemo(() => {
    const map = new Map<number, SentenceFeedbackItem>();
    sentenceFeedbacks.forEach((item) => {
      map.set(item.sentenceIndex, item);
    });
    return map;
  }, [sentenceFeedbacks]);

  // Dialog state for active sentence being annotated
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [category, setCategory] = useState<ErrorCategory>("GRAMMAR");
  const [tag, setTag] = useState<string>(PRESET_ERROR_TAGS.GRAMMAR[0]);
  const [note, setNote] = useState<string>("");
  const [suggestedSentence, setSuggestedSentence] = useState<string>("");

  const handleOpenDialog = (index: number) => {
    const existing = feedbackMap.get(index);
    setActiveSentenceIndex(index);
    if (existing) {
      setCategory(existing.category || "GRAMMAR");
      setTag(existing.tag || PRESET_ERROR_TAGS[existing.category || "GRAMMAR"][0]);
      setNote(existing.note || "");
      setSuggestedSentence(existing.suggestedSentence || "");
    } else {
      setCategory("GRAMMAR");
      setTag(PRESET_ERROR_TAGS.GRAMMAR[0]);
      setNote("");
      setSuggestedSentence("");
    }
  };

  const handleSaveSentenceFeedback = () => {
    if (activeSentenceIndex === null || !onChange) return;

    const originalSentence = sentences[activeSentenceIndex] || "";
    const newItem: SentenceFeedbackItem = {
      sentenceIndex: activeSentenceIndex,
      originalSentence,
      category,
      tag: tag.trim() || PRESET_ERROR_TAGS[category][0],
      note: note.trim(),
      suggestedSentence: suggestedSentence.trim() || undefined,
    };

    const nextList = sentenceFeedbacks.filter(
      (item) => item.sentenceIndex !== activeSentenceIndex
    );
    nextList.push(newItem);
    nextList.sort((a, b) => a.sentenceIndex - b.sentenceIndex);

    onChange(nextList);
    setActiveSentenceIndex(null);
  };

  const handleDeleteSentenceFeedback = () => {
    if (activeSentenceIndex === null || !onChange) return;
    const nextList = sentenceFeedbacks.filter(
      (item) => item.sentenceIndex !== activeSentenceIndex
    );
    onChange(nextList);
    setActiveSentenceIndex(null);
  };

  // Stats
  const categoryCounts = useMemo(() => {
    const counts: Record<ErrorCategory, number> = {
      GRAMMAR: 0,
      EXPRESSION: 0,
      STRUCTURE: 0,
      CONCEPT: 0,
    };
    sentenceFeedbacks.forEach((fb) => {
      if (counts[fb.category] !== undefined) {
        counts[fb.category]++;
      }
    });
    return counts;
  }, [sentenceFeedbacks]);

  if (!essayText || essayText.trim() === "") {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
        Chưa có văn bản bài làm để chấm theo câu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header Bar with Action Tip & Summary Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            {readOnly
              ? `Đánh giá chi tiết (${sentenceFeedbacks.length} câu có ghi chú):`
              : "Click vào bất kỳ câu nào dưới đây để gắn lỗi & nhận xét:"}
          </span>
        </div>

        {/* Category count breakdown */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {sentenceFeedbacks.length === 0 ? (
            <span className="text-[11px] text-muted-foreground italic">
              {readOnly ? "Không có câu nào bị gắn lỗi." : "Chưa gắn lỗi câu nào."}
            </span>
          ) : (
            (Object.keys(categoryCounts) as ErrorCategory[]).map((cat) => {
              const count = categoryCounts[cat];
              if (count === 0) return null;
              const color = CATEGORY_COLORS[cat];
              return (
                <Badge
                  key={cat}
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0.5 font-semibold", color.badgeBg)}
                >
                  {cat}: {count}
                </Badge>
              );
            })
          )}
        </div>
      </div>

      {/* Interactive Sentence-by-Sentence Reader */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-950 text-sm leading-relaxed space-y-2">
        <div className="flex flex-wrap gap-x-1.5 gap-y-2 select-text">
          {sentences.map((sentence, idx) => {
            const feedback = feedbackMap.get(idx);
            const isFlagged = !!feedback;
            const categoryStyle = feedback ? CATEGORY_COLORS[feedback.category] : null;

            return (
              <span
                key={idx}
                onClick={() => handleOpenDialog(idx)}
                className={cn(
                  "inline-block rounded-md px-1.5 py-0.5 transition-all cursor-pointer relative group",
                  isFlagged
                    ? cn(
                        "font-medium border shadow-2xs",
                        categoryStyle?.highlightBg,
                        categoryStyle?.border,
                        categoryStyle?.text
                      )
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-foreground border border-transparent"
                )}
                title={
                  feedback
                    ? `[${feedback.category}] ${feedback.tag}: ${feedback.note}`
                    : readOnly
                    ? sentence
                    : "Click để nhận xét câu này"
                }
              >
                <span className="inline-block">{sentence}</span>

                {/* Number tag for flagged sentences */}
                {isFlagged && (
                  <span
                    className={cn(
                      "ml-1 inline-flex items-center justify-center text-[9px] font-extrabold px-1 rounded-full border shrink-0",
                      categoryStyle?.badgeBg,
                      categoryStyle?.border
                    )}
                  >
                    #{idx + 1}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Render feedback card list if in readOnly mode or for easy review */}
      {sentenceFeedbacks.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Danh sách nhận xét chi tiết từng câu ({sentenceFeedbacks.length}):</span>
          </div>

          <div className="grid gap-2">
            {sentenceFeedbacks.map((item) => {
              const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.GRAMMAR;
              return (
                <div
                  key={item.sentenceIndex}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-xs space-y-1.5 bg-white dark:bg-neutral-900",
                    color.border
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        Câu #{item.sentenceIndex + 1}:
                      </span>
                      <Badge className={cn("text-[10px] font-bold", color.badgeBg)}>
                        {item.category}
                      </Badge>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.tag}
                      </span>
                    </div>

                    {!readOnly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(item.sentenceIndex)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Original sentence quote */}
                  <div className="pl-2 border-l-2 border-slate-300 dark:border-slate-700 text-muted-foreground italic line-clamp-2">
                    "{item.originalSentence}"
                  </div>

                  {/* Teacher Note */}
                  {item.note && (
                    <div className="text-slate-800 dark:text-slate-200 font-medium">
                      <strong>Nhận xét:</strong> {item.note}
                    </div>
                  )}

                  {/* Suggested Rewrite */}
                  {item.suggestedSentence && (
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs">
                      <Lightbulb className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Gợi ý viết lại:</strong> {item.suggestedSentence}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIALOG FOR EDITING SENTENCE ANNOTATION */}
      <Dialog
        open={activeSentenceIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveSentenceIndex(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              {activeSentenceIndex !== null && (
                <span>Nhận xét câu #{activeSentenceIndex + 1}</span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gắn loại lỗi, chọn nhãn lỗi nhanh và viết gợi ý chỉnh sửa cho câu này.
            </DialogDescription>
          </DialogHeader>

          {activeSentenceIndex !== null && (
            <div className="space-y-4 py-2">
              {/* Original sentence banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border text-xs font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed">
                "{sentences[activeSentenceIndex]}"
              </div>

              {/* Error Category Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nhóm lỗi (Category):</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(["GRAMMAR", "EXPRESSION", "STRUCTURE", "CONCEPT"] as ErrorCategory[]).map(
                    (cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant={category === cat ? "default" : "outline"}
                        size="sm"
                        disabled={readOnly}
                        onClick={() => {
                          setCategory(cat);
                          setTag(PRESET_ERROR_TAGS[cat][0]);
                        }}
                        className={cn(
                          "text-[11px] h-7 font-bold",
                          category === cat && "shadow-xs"
                        )}
                      >
                        {cat}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Quick Tag Pills */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nhãn lỗi nhanh (Tag):</Label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border rounded-lg bg-slate-50/50">
                  {PRESET_ERROR_TAGS[category].map((presetTag) => (
                    <button
                      key={presetTag}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setTag(presetTag)}
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-md border font-medium transition-all text-left",
                        tag === presetTag
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {presetTag}
                    </button>
                  ))}
                </div>
                <Input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Hoặc tự gõ nhãn lỗi khác..."
                  className="h-7 text-xs mt-1"
                  disabled={readOnly}
                />
              </div>

              {/* Teacher Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ghi chú của giáo viên (Note):</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Chỉ rõ điểm sai hoặc cách khắc phục..."
                  rows={2}
                  className="text-xs"
                  disabled={readOnly}
                />
              </div>

              {/* Suggested Rewrite */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Gợi ý viết lại câu chuẩn (Suggested Rewrite):</span>
                </Label>
                <Textarea
                  value={suggestedSentence}
                  onChange={(e) => setSuggestedSentence(e.target.value)}
                  placeholder="Gõ câu viết lại mẫu để học sinh tham khảo..."
                  rows={2}
                  className="text-xs border-emerald-300 dark:border-emerald-800"
                  disabled={readOnly}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            {feedbackMap.has(activeSentenceIndex || 0) && !readOnly ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteSentenceFeedback}
                className="h-8 text-xs gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa ghi chú</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveSentenceIndex(null)}
                className="h-8 text-xs"
              >
                Đóng
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveSentenceFeedback}
                  className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Lưu nhận xét</span>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
