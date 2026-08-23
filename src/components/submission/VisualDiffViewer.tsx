import { useMemo, useState } from "react";
import { diffWords, diffSentences, Change } from "diff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompare, Columns, AlignLeft, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualDiffViewerProps {
  attempt1Text: string;
  attempt2Text: string;
  attempt1Label?: string;
  attempt2Label?: string;
}

export function VisualDiffViewer({
  attempt1Text,
  attempt2Text,
  attempt1Label = "Bản gốc (Attempt 1)",
  attempt2Label = "Bản sửa (Attempt 2)",
}: VisualDiffViewerProps) {
  const [diffGranularity, setDiffGranularity] = useState<"words" | "sentences">("words");
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");

  // Compute diff chunks
  const diffChunks: Change[] = useMemo(() => {
    const text1 = attempt1Text || "";
    const text2 = attempt2Text || "";

    if (diffGranularity === "sentences") {
      return diffSentences(text1, text2);
    }
    return diffWords(text1, text2);
  }, [attempt1Text, attempt2Text, diffGranularity]);

  // Statistics
  const stats = useMemo(() => {
    let addedCount = 0;
    let removedCount = 0;
    diffChunks.forEach((chunk) => {
      if (chunk.added) addedCount += chunk.value.split(/\s+/).filter(Boolean).length;
      if (chunk.removed) removedCount += chunk.value.split(/\s+/).filter(Boolean).length;
    });
    return { addedCount, removedCount };
  }, [diffChunks]);

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden bg-card">
      <CardHeader className="p-4 border-b bg-slate-50/70 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <GitCompare className="h-4 w-4 text-primary" />
            <span>So Sánh Thay Đổi (Attempt 1 vs Attempt 2)</span>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              - {stats.removedCount} từ đã xóa
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              + {stats.addedCount} từ đã thêm/sửa
            </span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            variant={diffGranularity === "words" ? "default" : "outline"}
            onClick={() => setDiffGranularity("words")}
            className="h-7 text-xs font-semibold px-2.5"
          >
            Theo từ
          </Button>
          <Button
            type="button"
            size="sm"
            variant={diffGranularity === "sentences" ? "default" : "outline"}
            onClick={() => setDiffGranularity("sentences")}
            className="h-7 text-xs font-semibold px-2.5"
          >
            Theo câu
          </Button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <Button
            type="button"
            size="sm"
            variant={viewMode === "unified" ? "secondary" : "ghost"}
            onClick={() => setViewMode(viewMode === "unified" ? "split" : "unified")}
            className="h-7 text-xs font-semibold px-2 gap-1 text-muted-foreground hover:text-foreground"
            title="Chuyển chế độ xem"
          >
            {viewMode === "unified" ? (
              <>
                <Columns className="h-3.5 w-3.5" />
                <span>2 Cột</span>
              </>
            ) : (
              <>
                <AlignLeft className="h-3.5 w-3.5" />
                <span>Gộp chung</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {viewMode === "unified" ? (
          /* UNIFIED DIFF VIEW */
          <div className="p-4 rounded-xl border bg-slate-50/50 dark:bg-neutral-950 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {diffChunks.map((chunk, idx) => {
              if (chunk.added) {
                return (
                  <span
                    key={idx}
                    className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 font-medium px-1 py-0.5 rounded-sm border border-emerald-300 dark:border-emerald-700 decoration-emerald-500"
                  >
                    {chunk.value}
                  </span>
                );
              }
              if (chunk.removed) {
                return (
                  <span
                    key={idx}
                    className="bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 line-through opacity-80 px-1 py-0.5 rounded-sm border border-rose-300 dark:border-rose-700 decoration-rose-500"
                  >
                    {chunk.value}
                  </span>
                );
              }
              return <span key={idx} className="text-foreground">{chunk.value}</span>;
            })}
          </div>
        ) : (
          /* SPLIT SIDE-BY-SIDE DIFF VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attempt 1 column */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                <span>{attempt1Label}</span>
                <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200">
                  Bản gốc
                </Badge>
              </div>
              <div className="p-4 rounded-xl border bg-slate-50/40 text-xs leading-relaxed whitespace-pre-wrap min-h-[160px] text-muted-foreground">
                {attempt1Text || "Không có nội dung."}
              </div>
            </div>

            {/* Attempt 2 column */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                <span>{attempt2Label}</span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                  Bản đã sửa
                </Badge>
              </div>
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 text-xs leading-relaxed whitespace-pre-wrap min-h-[160px] text-foreground font-medium">
                {attempt2Text || "Không có nội dung."}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" />
            <span>Nội dung mới / Đã sửa (Attempt 2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block line-through" />
            <span>Nội dung cũ đã gỡ bỏ (Attempt 1)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
