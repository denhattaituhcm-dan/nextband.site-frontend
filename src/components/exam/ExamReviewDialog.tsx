import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Flag, AlertCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text?: string;
  questionText?: string;
  order_index?: number;
  orderIndex?: number;
  displayNumber?: number;
}

interface QuestionGroup {
  id: string;
  title?: string;
  instructions?: string;
  questions?: Question[];
}

interface Section {
  id: string;
  section_type?: string;
  sectionType?: string;
  title: string;
  question_groups?: QuestionGroup[];
  questionGroups?: QuestionGroup[];
}

interface ExamReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  answers: Record<string, any>;
  flaggedQuestions: Set<string>;
  onGoToQuestion: (sectionType: string, questionId: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

const isAnsweredValue = (value: any): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object") {
    return Object.values(value).some(
      (item) => typeof item === "string" && item.trim().length > 0,
    );
  }
  return false;
};

export function ExamReviewDialog({
  open,
  onOpenChange,
  sections,
  answers,
  flaggedQuestions,
  onGoToQuestion,
  onSubmit,
  isSubmitting,
}: ExamReviewDialogProps) {
  let globalIndex = 0;
  const allGroups: {
    sectionType: string;
    sectionTitle: string;
    groupTitle: string;
    questions: { question: Question; displayNumber: number }[];
  }[] = [];

  let totalQuestionsCount = 0;
  let answeredCount = 0;
  let flaggedCount = 0;

  sections.forEach((section) => {
    const sType = section.sectionType || section.section_type || "general";
    const groups = section.questionGroups || section.question_groups || [];

    groups.forEach((group, gIdx) => {
      const gQuestions = group.questions || [];
      if (gQuestions.length === 0) return;

      const groupTitle =
        group.title || `Phần ${gIdx + 1}`;

      const mappedQuestions = gQuestions.map((q) => {
        globalIndex++;
        const num = q.displayNumber ?? globalIndex;
        totalQuestionsCount++;
        if (isAnsweredValue(answers[q.id])) answeredCount++;
        if (flaggedQuestions.has(q.id)) flaggedCount++;
        return { question: q, displayNumber: num };
      });

      allGroups.push({
        sectionType: sType,
        sectionTitle: section.title,
        groupTitle,
        questions: mappedQuestions,
      });
    });
  });

  const unansweredCount = totalQuestionsCount - answeredCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] p-0 flex flex-col overflow-hidden rounded-2xl">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <AlertCircle className="h-5 w-5 text-primary" />
            Tổng quan bài làm
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kiểm tra trạng thái các phần thi và câu hỏi trước khi nộp bài
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-4 mx-5 my-3 bg-muted/40 rounded-xl border border-border/60">
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {answeredCount}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Đã trả lời</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-muted-foreground">
              {unansweredCount}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Chưa trả lời</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-amber-500">
              {flaggedCount}
            </div>
            <div className="text-xs font-semibold text-muted-foreground mt-0.5">Đã đánh dấu</div>
          </div>
        </div>

        {/* Group-by-Group Question Breakdown */}
        <ScrollArea className="flex-1 px-5 py-2 max-h-[45vh]">
          <div className="space-y-4 pb-2">
            {allGroups.map((grp, idx) => (
              <div key={idx} className="space-y-2 rounded-xl bg-card border p-3.5 shadow-2xs">
                <div className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                  {grp.groupTitle}
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {grp.questions.map(({ question, displayNumber }) => {
                    const isAnswered = isAnsweredValue(answers[question.id]);
                    const isFlagged = flaggedQuestions.has(question.id);

                    return (
                      <button
                        key={question.id}
                        onClick={() => {
                          onGoToQuestion(grp.sectionType, question.id);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "relative h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all border",
                          isAnswered && !isFlagged && "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20",
                          isFlagged && "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25",
                          !isAnswered && !isFlagged && "bg-background border-border/80 text-foreground/70 hover:border-primary/40"
                        )}
                      >
                        {isFlagged ? (
                          <Flag className="h-3.5 w-3.5 fill-current" />
                        ) : isAnswered ? (
                          <span className="flex items-center gap-0.5">
                            <Check className="h-3 w-3" />
                            {displayNumber}
                          </span>
                        ) : (
                          displayNumber
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Warning if unanswered */}
        {(unansweredCount > 0 || flaggedCount > 0) && (
          <div className="px-5 py-2">
            <div className="flex items-center gap-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {unansweredCount > 0
                  ? `Bạn còn ${unansweredCount} câu chưa trả lời. `
                  : ""}
                {flaggedCount > 0
                  ? `Bạn có ${flaggedCount} câu đã gắn cờ xem lại.`
                  : ""}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t gap-2 bg-muted/20">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="font-semibold rounded-xl">
            Tiếp tục làm bài
          </Button>
          <Button size="sm" onClick={onSubmit} disabled={isSubmitting} className="font-bold rounded-xl bg-primary text-primary-foreground shadow-xs">
            {isSubmitting ? (
              <>Đang nộp...</>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Nộp bài thi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
