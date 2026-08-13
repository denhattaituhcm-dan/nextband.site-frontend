import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { QuestionFormProps } from "./QuestionFormTypes";

function getOptionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

// Convert Roman numeral or Letter or Number string to Letter label e.g. "I" -> "A", "0" -> "A"
function normalizeToLabel(val: string): string {
  if (!val) return "";
  const str = val.trim().toUpperCase();
  if (/^[A-Z]$/.test(str)) return str;

  const romanMap: Record<string, string> = {
    I: "A", II: "B", III: "C", IV: "D", V: "E",
    VI: "F", VII: "G", VIII: "H", IX: "I", X: "J",
  };
  if (str in romanMap) return romanMap[str];

  if (/^\d+$/.test(str)) {
    const idx = parseInt(str, 10);
    if (!isNaN(idx) && idx >= 0) return getOptionLabel(idx);
  }
  return str;
}

function parseMatching(correctAnswer: string): {
  items: string[];
  options: string[];
  pairs: Record<string, string>;
} {
  try {
    const parsed = JSON.parse(correctAnswer);
    if (parsed && typeof parsed === "object" && parsed.items && parsed.options) {
      const normalizedPairs: Record<string, string> = {};
      if (parsed.pairs && typeof parsed.pairs === "object") {
        Object.entries(parsed.pairs).forEach(([k, v]) => {
          normalizedPairs[k] = normalizeToLabel(String(v));
        });
      }
      return {
        items: parsed.items || [],
        options: parsed.options || [],
        pairs: normalizedPairs,
      };
    }
  } catch {}
  return { items: ["", ""], options: ["", ""], pairs: {} };
}

function stringifyMatching(
  items: string[],
  options: string[],
  pairs: Record<string, string>,
): string {
  return JSON.stringify({ items, options, pairs });
}

export function MatchingForm({ form, onChange }: QuestionFormProps) {
  const [items, setItems] = useState<string[]>(["", ""]);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pairs, setPairs] = useState<Record<string, string>>({});

  useEffect(() => {
    const data = parseMatching(form.correctAnswer);
    if (data.items.length > 0) setItems(data.items);
    if (data.options.length > 0) {
      const migratedOptions = data.options.map((opt) => {
        if (/^Option [A-Z]$/.test(opt) || /^Lựa chọn [A-Z]$/.test(opt)) {
          return "";
        }
        return opt;
      });
      setOptions(migratedOptions);
    }
    setPairs(data.pairs || {});
  }, []);

  const syncToForm = (
    newItems: string[],
    newOptions: string[],
    newPairs: Record<string, string>,
  ) => {
    setItems(newItems);
    setOptions(newOptions);
    setPairs(newPairs);
    onChange({
      correctAnswer: stringifyMatching(newItems, newOptions, newPairs),
    });
  };

  const addItem = () => syncToForm([...items, ""], options, pairs);
  const addOption = () => syncToForm(items, [...options, ""], pairs);

  const removeItem = (idx: number) => {
    if (items.length <= 2) return;
    const newItems = items.filter((_, i) => i !== idx);
    const newPairs = { ...pairs };
    delete newPairs[String(idx)];
    const reindexed: Record<string, string> = {};
    Object.entries(newPairs).forEach(([k, v]) => {
      const ki = parseInt(k, 10);
      if (ki > idx) reindexed[String(ki - 1)] = v;
      else reindexed[k] = v;
    });
    syncToForm(newItems, options, reindexed);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const removedLabel = getOptionLabel(idx);
    const newOptions = options.filter((_, i) => i !== idx);
    const newPairs: Record<string, string> = {};
    Object.entries(pairs).forEach(([k, v]) => {
      if (v !== removedLabel) {
        newPairs[k] = v;
      }
    });
    syncToForm(items, newOptions, newPairs);
  };

  const updateItem = (idx: number, value: string) => {
    const newItems = [...items];
    newItems[idx] = value;
    syncToForm(newItems, options, pairs);
  };

  const updateOption = (idx: number, value: string) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    syncToForm(items, newOptions, pairs);
  };

  const setPair = (itemIdx: number, optionLabel: string) => {
    const newPairs = { ...pairs, [String(itemIdx)]: optionLabel };
    syncToForm(items, options, newPairs);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-5">
        <div className="flex items-center gap-2 text-sm font-bold text-primary pb-2 border-b border-primary/10">
          <ArrowRightLeft className="h-4 w-4" />
          CÂU HỎI NỐI ĐÁP ÁN
        </div>

        {/* Question text / Instructions */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Hướng dẫn / Câu hỏi *
          </Label>
          <RichTextEditor
            placeholder="VD: Match each area of the world with its correct feature."
            value={form.questionText}
            onChange={(html) => onChange({ questionText: html })}
            minHeight={100}
          />
        </div>

        {/* Two columns */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Items (left) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Danh sách câu hỏi (trái)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-6 text-[10px]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm câu hỏi
              </Button>
            </div>
            <div className="grid gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-5 text-teal-600">
                    {i + 1}.
                  </span>
                  <Input
                    placeholder={`Câu hỏi ${i + 1}`}
                    value={item}
                    onChange={(e) => updateItem(i, e.target.value)}
                    className="bg-background h-8 text-sm"
                  />
                  <Select
                    value={pairs[String(i)] || ""}
                    onValueChange={(v) => setPair(i, v)}
                  >
                    <SelectTrigger className="w-16 h-8 text-xs bg-background px-2 font-bold text-teal-700">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent className="z-[70] max-h-44">
                      {options.map((_, oi) => {
                        const label = getOptionLabel(oi);
                        return (
                          <SelectItem key={oi} value={label}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {items.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Options (right) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Các lựa chọn (phải)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="h-6 text-[10px]"
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm lựa chọn
              </Button>
            </div>
            <div className="grid gap-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-6 text-teal-600 text-right pr-1">
                    {getOptionLabel(i)}.
                  </span>
                  <Input
                    placeholder={`Lựa chọn ${getOptionLabel(i)}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="bg-background h-8 text-sm"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeOption(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview pairs */}
        {Object.keys(pairs).length > 0 && (
          <div className="rounded-lg border border-teal-200 bg-white/50 dark:bg-teal-950/10 p-3 space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
              Đáp án nối
            </Label>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(pairs)
                .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
                .map(([itemIdx, optLabel]) => (
                  <span
                    key={itemIdx}
                    className="px-2 py-1 rounded bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-semibold"
                  >
                    {parseInt(itemIdx, 10) + 1} → {optLabel}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Points */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Điểm
            </Label>
            <Input
              type="number"
              min={1}
              value={form.points}
              onChange={(e) =>
                onChange({ points: parseInt(e.target.value, 10) || 1 })
              }
              className="bg-background"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
