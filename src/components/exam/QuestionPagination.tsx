import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Flag, Check, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Question {
  id: string;
  order_index?: number;
  isSubQuestion?: boolean;
  subIndex?: string;
  displayNumber?: number;
  focusId?: string;
}

interface QuestionPaginationProps {
  questions: Question[];
  answers: Record<string, any>;
  flaggedQuestions: Set<string>;
  currentQuestionId?: string;
  onQuestionClick: (questionId: string) => void;
  onToggleFlag: (questionId: string) => void;
  className?: string;
}

export function QuestionPagination({
  questions,
  answers,
  flaggedQuestions,
  currentQuestionId,
  onQuestionClick,
  onToggleFlag,
  className,
}: QuestionPaginationProps) {
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  const getQuestionState = (q: Question) => {
    const value = answers[q.id];
    let isAnswered = false;

    if (q.isSubQuestion && q.subIndex !== undefined) {
      if (value && typeof value === 'object') {
        const subVal = value[q.subIndex];
        isAnswered = typeof subVal === 'string' && subVal.trim().length > 0;
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          const subVal = parsed[q.subIndex];
          isAnswered = typeof subVal === 'string' && subVal.trim().length > 0;
        } catch {
          // fallback
        }
      }
    } else {
      isAnswered =
        typeof value === 'string'
          ? value.trim().length > 0
          : value && typeof value === 'object'
            ? Object.values(value).some(
                (item) => typeof item === 'string' && item.trim().length > 0,
              )
            : false;
    }

    const isFlagged = flaggedQuestions.has(q.focusId || q.id);
    const isCurrent = (q.focusId || q.id) === currentQuestionId;

    return { isAnswered, isFlagged, isCurrent };
  };

  const formatQuestionLabel = (q: Question, index: number) => {
    const baseNumber = q.displayNumber ?? q.order_index ?? index + 1;
    return String(baseNumber);
  };

  const currentIndex = questions.findIndex(
    (q) => (q.focusId || q.id) === currentQuestionId,
  );
  const currentLabel =
    currentIndex >= 0
      ? formatQuestionLabel(questions[currentIndex], currentIndex)
      : '1';

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevQ = questions[currentIndex - 1];
      onQuestionClick(prevQ.focusId || prevQ.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextQ = questions[currentIndex + 1];
      onQuestionClick(nextQ.focusId || nextQ.id);
    }
  };

  return (
    <div className={cn('flex items-center justify-between gap-2 w-full', className)}>
      {/* Mobile Compact Navigator */}
      <div className="flex sm:hidden items-center justify-between w-full px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex <= 0}
          className="h-8 px-2.5 text-xs font-semibold rounded-lg"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          Trước
        </Button>

        <Dialog open={mobilePaletteOpen} onOpenChange={setMobilePaletteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 font-bold text-xs rounded-lg border-primary/40 bg-primary/5 text-primary flex items-center gap-1.5"
            >
              <span>Câu {currentLabel}/{questions.length}</span>
              <LayoutGrid className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs sm:max-w-md p-5 rounded-2xl">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="text-sm font-bold">Danh sách câu hỏi</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-5 gap-2 py-3 max-h-[60vh] overflow-y-auto">
              {questions.map((q, index) => {
                const { isAnswered, isFlagged, isCurrent } = getQuestionState(q);
                const displayNumber = formatQuestionLabel(q, index);
                const targetId = q.focusId || q.id;

                return (
                  <button
                    key={targetId}
                    onClick={() => {
                      onQuestionClick(targetId);
                      setMobilePaletteOpen(false);
                    }}
                    className={cn(
                      'relative h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all border',
                      isCurrent && 'ring-2 ring-primary border-primary bg-primary/10 text-primary',
                      !isCurrent && isAnswered && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
                      !isCurrent && isFlagged && 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
                      !isCurrent && !isAnswered && !isFlagged && 'bg-card border-border/80 text-foreground/80'
                    )}
                  >
                    <span>{displayNumber}</span>
                    {isFlagged ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-0.5" />
                    ) : isAnswered ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-0.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-transparent mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex >= questions.length - 1}
          className="h-8 px-2.5 text-xs font-semibold rounded-lg"
        >
          Sau
          <ChevronRight className="h-4 w-4 ml-0.5" />
        </Button>
      </div>

      {/* Desktop/Tablet Full Navigator */}
      <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 mx-auto">
        {questions.map((q, index) => {
          const { isAnswered, isFlagged, isCurrent } = getQuestionState(q);
          const displayNumber = formatQuestionLabel(q, index);
          const targetId = q.focusId || q.id;

          return (
            <Tooltip key={targetId}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onQuestionClick(targetId)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onToggleFlag(targetId);
                  }}
                  className={cn(
                    'relative w-8 h-8 md:w-9 md:h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-150 border',
                    isCurrent
                      ? 'ring-2 ring-primary ring-offset-1 ring-offset-background border-primary bg-primary/10 text-primary font-extrabold scale-105'
                      : isAnswered && !isFlagged
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : isFlagged
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                      : 'bg-card border-border/80 text-foreground/70 hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  <span className="leading-none">{displayNumber}</span>
                  {/* Subtle semantic status dot */}
                  {isFlagged ? (
                    <span className="h-1 w-1 rounded-full bg-amber-500 mt-0.5" />
                  ) : isAnswered ? (
                    <span className="h-1 w-1 rounded-full bg-emerald-500 mt-0.5" />
                  ) : null}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-medium">
                <p className="font-bold">Câu {displayNumber}</p>
                <p className="text-muted-foreground">
                  {isFlagged ? '⚑ Đã đánh dấu' : isAnswered ? '● Đã trả lời' : '○ Chưa trả lời'}
                </p>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">Click để di chuyển • Phải chuột để gắn cờ</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
