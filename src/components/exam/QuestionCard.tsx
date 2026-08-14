import React, { forwardRef } from "react";
import { RichContent } from "./RichContent";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionCardProps {
  questionId: string;
  displayNumber: number | string;
  questionText: string;
  points?: number;
  isFlagged?: boolean;
  onToggleFlag?: (questionId: string) => void;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}

export const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(
  (
    {
      questionId,
      displayNumber,
      questionText,
      points,
      isFlagged = false,
      onToggleFlag,
      children,
      className,
      isActive = false,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        id={`question-${questionId}`}
        data-question-id={questionId}
        className={cn(
          "rounded-2xl border bg-card p-5 sm:p-6 transition-all duration-200 shadow-2xs space-y-4",
          isActive
            ? "border-primary/50 ring-2 ring-primary/10 shadow-xs"
            : "border-border/80 hover:border-border",
          className,
        )}
      >
        {/* Question Header: Number + Text + Flag */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground/80 border border-border/80",
            )}
          >
            {displayNumber}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <RichContent
              html={questionText}
              className="text-base text-foreground font-medium leading-relaxed"
            />
          </div>

          {onToggleFlag && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFlag(questionId)}
              title={isFlagged ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
              className={cn(
                "h-8 w-8 p-0 rounded-lg shrink-0 transition-colors",
                isFlagged
                  ? "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                  : "text-muted-foreground/50 hover:text-foreground",
              )}
            >
              <Flag
                className={cn("h-4 w-4", isFlagged && "fill-current")}
              />
            </Button>
          )}
        </div>

        {/* Answer Input Control Slot */}
        <div className="pt-1">{children}</div>
      </div>
    );
  },
);

QuestionCard.displayName = "QuestionCard";
