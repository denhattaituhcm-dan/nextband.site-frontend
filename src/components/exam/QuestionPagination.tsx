import { cn } from '@/lib/utils';
import { Flag, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {questions.map((q, index) => {
        const { isAnswered, isFlagged, isCurrent } = getQuestionState(q);
        const displayNumber = formatQuestionLabel(q, index);
        const targetId = q.focusId || q.id;
        const uniqueKey = targetId;

        return (
          <Tooltip key={uniqueKey}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onQuestionClick(targetId)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onToggleFlag(targetId);
                }}
                className={cn(
                  'relative w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all duration-100',
                  'border-2 hover:scale-105 active:scale-95',
                  isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background font-bold scale-105',
                  isAnswered && !isFlagged && 'bg-emerald-600 border-emerald-600 text-white shadow-2xs',
                  isFlagged && 'bg-amber-500 border-amber-500 text-white shadow-2xs',
                  !isAnswered && !isFlagged && 'bg-card border-border text-foreground hover:border-primary/50'
                )}
              >
                {isFlagged ? (
                  <Flag className="h-3.5 w-3.5 fill-current" />
                ) : isAnswered ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : (
                  displayNumber
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs font-medium">
              <p className="font-bold">Câu {displayNumber}</p>
              <p className="text-muted-foreground">
                {isFlagged ? 'Đã đánh dấu' : isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}
              </p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">Click để di chuyển • Nhấp chuột phải để gắn cờ</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
