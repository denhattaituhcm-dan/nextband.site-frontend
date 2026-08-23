import React, { useState, useRef, useCallback, useMemo } from "react";
import { BookOpen, Highlighter, RotateCcw, Clock } from "lucide-react";
import { AssessmentQuestion } from "../domain/assessment.types";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FillBlankHtmlRenderer, hasFillBlankPlaceholders } from "@/components/exam/FillBlankHtmlRenderer";
import { sanitizeHtml } from "@/lib/sanitize";

interface HighlightItem {
  id: string;
  startIndex: number;
  endIndex: number;
}

interface ReadingPanelProps {
  title: string;
  passage: string;
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

export function ReadingPanel({
  title,
  passage,
  questions,
  answers,
  onAnswerChange,
}: ReadingPanelProps) {
  const hasPassage = passage && passage.trim().length > 20;

  // Ensure questions are strictly sorted by orderIndex
  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [questions]);

  // Formatted passage HTML for consistent DOM structure
  const formattedPassageHtml = useMemo(() => {
    if (!passage) return "";
    if (/<[a-z][\s\S]*>/i.test(passage)) {
      return passage;
    }
    return passage
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim().replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }, [passage]);

  // Highlighter Tool State (Zero-jitter native highlight)
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [highlightCount, setHighlightCount] = useState(0);
  const passageContentRef = useRef<HTMLDivElement>(null);
  const activeRangesRef = useRef<Range[]>([]);

  // Clear all highlights
  const handleClearHighlights = useCallback(() => {
    activeRangesRef.current = [];
    if (typeof CSS !== "undefined" && "highlights" in CSS && (CSS as any).highlights) {
      try {
        (CSS as any).highlights.delete("aris-reading-highlight");
      } catch {}
    }
    if (passageContentRef.current) {
      const marks = passageContentRef.current.querySelectorAll("mark.aris-hl");
      marks.forEach((m) => {
        const parent = m.parentNode;
        while (m.firstChild) {
          parent?.insertBefore(m.firstChild, m);
        }
        parent?.removeChild(m);
      });
    }
    setHighlightCount(0);
  }, []);

  const handleTextSelection = useCallback(() => {
    if (!isHighlightActive) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageContentRef.current) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    if (!passageContentRef.current.contains(range.commonAncestorContainer)) return;

    if (typeof CSS !== "undefined" && "highlights" in CSS && (CSS as any).highlights && typeof (window as any).Highlight !== "undefined") {
      try {
        activeRangesRef.current.push(range.cloneRange());
        const hl = new (window as any).Highlight(...activeRangesRef.current);
        (CSS as any).highlights.set("aris-reading-highlight", hl);
        setHighlightCount(activeRangesRef.current.length);
        selection.removeAllRanges();
        return;
      } catch (e) {
        console.warn("[ReadingPanel] CSS.highlights notice:", e);
      }
    }

    // Fallback: DOM Range wrapping without re-rendering the whole tree
    try {
      const mark = document.createElement("mark");
      mark.className = "aris-hl bg-yellow-200/90 dark:bg-yellow-400/30 text-stone-900 dark:text-yellow-100 rounded-xs px-0.5 py-0 font-inherit";
      range.surroundContents(mark);
      setHighlightCount((prev) => prev + 1);
      selection.removeAllRanges();
    } catch (e) {
      console.warn("[ReadingPanel] surroundContents fallback notice:", e);
    }
  }, [isHighlightActive]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <style>{`
        ::highlight(aris-reading-highlight) {
          background-color: #fef08a;
          color: #1c1917;
        }
      `}</style>
      {/* Left Column: Academic Reading Passage */}
      {hasPassage && (
        <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground">Reading</h3>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                  <Button
                    type="button"
                    size="sm"
                    variant={isHighlightActive ? "default" : "ghost"}
                    onClick={() => setIsHighlightActive(!isHighlightActive)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold gap-1.5 transition-all ${
                      isHighlightActive
                        ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={isHighlightActive ? "Bôi đen văn bản để highlight (Đang bật)" : "Bật tính năng Highlight"}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Highlight</span>
                  </Button>

                  {highlightCount > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleClearHighlights}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                      title="Xóa tất cả highlight"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                  <Clock className="w-3 h-3" />
                  Gợi ý: ~15 phút
                </span>

                <Badge variant="outline" className="text-xs font-bold shrink-0 bg-background">
                  Passage Text
                </Badge>
              </div>
            </div>

            {/* Passage Text Container with Justified alignment */}
            <div
              ref={passageContentRef}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-4 max-h-[68vh] overflow-y-auto pr-2 text-justify select-text"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedPassageHtml) }}
            />
          </div>
        </div>
      )}

      {/* Right Column: Reading Questions (Strictly sorted by orderIndex) */}
      <div className={hasPassage ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
        {sortedQuestions.map((q) => {
          const promptText = q?.prompt || "";
          const isFillBlankWithSlots = q?.questionType === "fill_blank" && hasFillBlankPlaceholders(promptText);
          const hasHtml = promptText.includes("<") && promptText.includes(">");
          const subTag = cleanSectionTag(q.sectionTitle);

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs"
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

                  {/* Multiple Choice & True/False/Not Given Options */}
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


