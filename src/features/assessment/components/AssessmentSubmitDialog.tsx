import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { AssessmentSkill } from "../domain/assessment.types";

interface AssessmentSubmitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  skillCounts: Record<AssessmentSkill, { answered: number; total: number }>;
  isSubmitting: boolean;
  onConfirmSubmit: () => void;
}

export function AssessmentSubmitDialog({
  isOpen,
  onOpenChange,
  skillCounts,
  isSubmitting,
  onConfirmSubmit,
}: AssessmentSubmitDialogProps) {
  const totalAnswered = Object.values(skillCounts).reduce((sum, s) => sum + s.answered, 0);
  const totalQuestions = Object.values(skillCounts).reduce((sum, s) => sum + s.total, 0);
  const unansweredCount = Math.max(0, totalQuestions - totalAnswered);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-6 sm:p-7 rounded-3xl bg-background border border-border">
        <DialogHeader className="text-left space-y-1.5">
          <DialogTitle className="text-xl font-black text-foreground">
            Xác Nhận Nộp Bài Khảo Thí
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Hệ thống sẽ chấm điểm phần Trắc nghiệm & Ngữ pháp ngay lập tức và phân tích báo cáo chẩn đoán năng lực ARIS-7.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Breakdown */}
        <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 space-y-2.5 my-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Listening (Nghe hiểu):</span>
            <span className="font-bold text-foreground">
              {skillCounts.listening.answered} / {skillCounts.listening.total} câu
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Reading (Đọc hiểu):</span>
            <span className="font-bold text-foreground">
              {skillCounts.reading.answered} / {skillCounts.reading.total} câu
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">Grammar & Vocab (Ngữ pháp):</span>
            <span className="font-bold text-foreground">
              {skillCounts.grammar.answered} / {skillCounts.grammar.total} câu
            </span>
          </div>

          <div className="pt-2 border-t border-border/80 flex justify-between text-xs font-black">
            <span className="text-foreground">Tổng số câu đã hoàn thành:</span>
            <span className="text-brand-blue">
              {totalAnswered} / {totalQuestions} câu
            </span>
          </div>
        </div>

        {unansweredCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Bạn còn {unansweredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài ngay?</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-1/3 h-11 rounded-xl font-bold text-xs"
          >
            Làm tiếp
          </Button>

          <Button
            onClick={onConfirmSubmit}
            disabled={isSubmitting}
            className="w-2/3 h-11 rounded-xl font-black text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-md gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Đang chấm điểm..." : "Nộp Bài Ngay"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
