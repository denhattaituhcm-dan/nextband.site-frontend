import React, { useState, useRef, useCallback, useMemo } from "react";
import { BookOpen, Highlighter, RotateCcw } from "lucide-react";
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

const mergeHighlights = (hls: HighlightItem[]): HighlightItem[] => {
  if (hls.length <= 1) return hls;
  const sorted = [...hls].sort((a, b) => a.startIndex - b.startIndex);
  const result: HighlightItem[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = result[result.length - 1];

    if (current.startIndex <= prev.endIndex) {
      // Overlap or adjacent - merge into a single continuous range
      prev.endIndex = Math.max(prev.endIndex, current.endIndex);
    } else {
      result.push({ ...current });
    }
  }
  return result;
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

  // Formatted passage HTML for consistent DOM structure across highlighted and unhighlighted states
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

  // Highlighter Tool State (Classic Lemon Yellow only)
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const passageContentRef = useRef<HTMLDivElement>(null);

  // Helper to calculate character offset from text selection inside container
  const getRangeOffsets = useCallback((range: Range) => {
    if (!passageContentRef.current) return null;
    if (!passageContentRef.current.contains(range.commonAncestorContainer)) return null;

    const preRange = range.cloneRange();
    preRange.selectNodeContents(passageContentRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preRange.toString().length;
    const selected = range.toString();
    const endIndex = startIndex + selected.length;
    return { startIndex, endIndex, text: selected };
  }, []);

  const handleTextSelection = useCallback(() => {
    if (!isHighlightActive) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageContentRef.current) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
    const offsets = getRangeOffsets(range);
    if (!offsets || offsets.endIndex <= offsets.startIndex) return;

    // Add highlight and merge overlapping ranges
    const newHighlight: HighlightItem = {
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startIndex: offsets.startIndex,
      endIndex: offsets.endIndex,
    };

    setHighlights((prev) => mergeHighlights([...prev, newHighlight]));
    selection.removeAllRanges();
  }, [isHighlightActive, getRangeOffsets]);

  // Render passage with lemon-yellow highlights
  const renderHighlightedPassage = useCallback(() => {
    if (!formattedPassageHtml) return null;

    // Fast path: if no highlights, render sanitized HTML directly without DOM tree reconstruction
    if (!highlights || highlights.length === 0) {
      return (
        <div
          className="prose prose-sm max-w-none text-justify select-text"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedPassageHtml) }}
        />
      );
    }

    try {
      if (typeof window === "undefined" || typeof DOMParser === "undefined") {
        return (
          <div
            className="prose prose-sm max-w-none text-justify select-text"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedPassageHtml) }}
          />
        );
      }

      const sortedHls = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
      const parser = new DOMParser();
      const doc = parser.parseFromString(formattedPassageHtml, "text/html");
      const body = doc.body;

      let globalOffset = 0;

      const renderNode = (node: ChildNode, pathKey: string): React.ReactNode => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          const parts: React.ReactNode[] = [];
          const start = globalOffset;
          const end = start + text.length;
          let cursor = start;

          sortedHls.forEach((h) => {
            const hStart = Math.max(h.startIndex, start);
            const hEnd = Math.min(h.endIndex, end);
            if (hStart >= hEnd) return;

            const safeStart = Math.max(hStart, cursor);
            if (safeStart > cursor) {
              parts.push(text.slice(cursor - start, safeStart - start));
            }

            if (safeStart < hEnd) {
              parts.push(
                <mark
                  key={`${h.id}-${safeStart}`}
                  className="bg-yellow-200/90 dark:bg-yellow-400/30 text-stone-900 dark:text-yellow-100 rounded-xs px-0.5 py-0 cursor-pointer font-inherit hover:bg-yellow-300 dark:hover:bg-yellow-400/50 transition-colors shadow-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Click highlight to remove it
                    setHighlights((prev) => prev.filter((item) => item.id !== h.id));
                  }}
                  title="Nhấp để xóa highlight này"
                >
                  {text.slice(safeStart - start, hEnd - start)}
                </mark>
              );
              cursor = hEnd;
            }
          });

          if (cursor < end) {
            parts.push(text.slice(cursor - start));
          }
          globalOffset = end;
          if (parts.length === 1 && typeof parts[0] === "string") {
            return parts[0];
          }
          return <React.Fragment key={pathKey}>{parts}</React.Fragment>;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const children = Array.from(el.childNodes).map((child, idx) => (
            renderNode(child, `${pathKey}-${idx}`)
          ));

          const props: Record<string, any> = {
            key: pathKey,
          };
          Array.from(el.attributes).forEach((attr) => {
            if (attr.name === "class") {
              props.className = attr.value;
            } else if (attr.name !== "style" && !attr.name.startsWith("on")) {
              props[attr.name] = attr.value;
            }
          });

          const tag = el.tagName.toLowerCase();
          return React.createElement(tag, props, children);
        }

        return null;
      };

      const rendered = Array.from(body.childNodes).map((child, idx) => (
        renderNode(child, `root-${idx}`)
      ));

      return <>{rendered}</>;
    } catch (err) {
      console.warn("[ReadingPanel] Highlight render fallback:", err);
      return (
        <div
          className="prose prose-sm max-w-none text-justify select-text"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(formattedPassageHtml) }}
        />
      );
    }
  }, [formattedPassageHtml, highlights]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Academic Reading Passage */}
      {hasPassage && (
        <div className="lg:col-span-6 lg:sticky lg:top-20 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
              <div className="flex items-center gap-2 text-foreground font-extrabold text-sm sm:text-base">
                <BookOpen className="w-4 h-4 text-brand-blue shrink-0" />
                <span>{title || "Reading Passage"}</span>
              </div>

              {/* Toolbar: Highlighter Tool positioned to the left of Passage Text Badge */}
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
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    title={isHighlightActive ? "Tắt chế độ Highlight" : "Bật bút Highlight màu vàng chanh"}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Highlight</span>
                  </Button>

                  {highlights.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setHighlights([])}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                      title="Xóa tất cả highlight"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>

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
              className={`text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-4 max-h-[68vh] overflow-y-auto pr-2 text-justify select-text ${
                isHighlightActive
                  ? "cursor-text ring-2 ring-amber-400/50 rounded-2xl p-3 bg-amber-50/40 dark:bg-amber-950/10 transition-all"
                  : ""
              }`}
            >
              {renderHighlightedPassage()}
            </div>
          </div>
        </div>
      )}

      {/* Right Column: Reading Questions (Strictly sorted by orderIndex) */}
      <div className={hasPassage ? "lg:col-span-6 space-y-4" : "lg:col-span-12 space-y-4"}>
        {sortedQuestions.map((q) => {
          const promptText = q?.prompt || "";
          const isFillBlankWithSlots = q?.questionType === "fill_blank" && hasFillBlankPlaceholders(promptText);
          const hasHtml = promptText.includes("<") && promptText.includes(">");

          return (
            <div
              key={q.id}
              id={`question-${q.id}`}
              className="p-5 sm:p-6 rounded-3xl bg-card border border-border space-y-3.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-blue uppercase tracking-wide">
                  {q.sectionTitle || "Reading"}
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">
                  {q.blankCount && q.blankCount > 1 ? `${q.blankCount} chỗ trống` : `Câu ${q.orderIndex || 1}`}
                </span>
              </div>

              {/* Rich FillBlank HTML Slot Renderer */}
              {isFillBlankWithSlots ? (
                <div className="pt-1">
                  <FillBlankHtmlRenderer
                    html={promptText}
                    answers={typeof answers?.[q.id] === "object" ? answers[q.id] || {} : {}}
                    questionId={q.id}
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


