import React from "react";
import { RichContent } from "./RichContent";
import { cn } from "@/lib/utils";
import { formatStorageUrl } from "@/lib/api";

interface QuestionGroupHeaderProps {
  partNumber?: number;
  title?: string;
  instructions?: string | null;
  audioUrl?: string | null;
  passage?: string | null;
  className?: string;
}

export function QuestionGroupHeader({
  partNumber,
  title,
  instructions,
  audioUrl,
  passage,
  className,
}: QuestionGroupHeaderProps) {
  const rawTitle = title || "";
  const hasPartInTitle = /part|phần/i.test(rawTitle);
  const displayTitle = rawTitle || (partNumber ? `Phần ${partNumber}` : "");

  if (!displayTitle && !instructions && !audioUrl && !passage) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky top-14 md:top-16 z-20 bg-background/95 backdrop-blur-md border-b border-border/80 pb-3.5 pt-3 transition-all duration-200",
        className,
      )}
    >
      <div className="space-y-2.5">
        {/* Title row */}
        {displayTitle && (
          <div className="flex items-center gap-2.5">
            {partNumber && !hasPartInTitle && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide border border-primary/20">
                Phần {partNumber}
              </span>
            )}
            <h3 className="text-base md:text-lg font-bold text-foreground tracking-tight">
              {displayTitle}
            </h3>
          </div>
        )}

        {/* Instructions box */}
        {instructions && (
          <div className="p-3.5 bg-muted/50 dark:bg-muted/30 border border-border/70 rounded-xl text-sm text-foreground/90 font-medium leading-relaxed">
            <RichContent html={instructions} />
          </div>
        )}

        {/* Audio Player if present in group */}
        {audioUrl && (
          <div className="bg-muted/40 p-2.5 rounded-xl border border-border/60 flex items-center gap-3 max-w-md">
            <audio src={formatStorageUrl(audioUrl)} controls className="h-8 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
