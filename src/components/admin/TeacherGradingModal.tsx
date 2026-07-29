import { useState } from "react";
import { homeworksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Award } from "lucide-react";

interface TeacherGradingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homeworkId: string;
  studentId: string;
  studentName?: string;
  onSuccess?: () => void;
}

export function TeacherGradingModal({
  open,
  onOpenChange,
  homeworkId,
  studentId,
  studentName,
  onSuccess,
}: TeacherGradingModalProps) {
  const [score, setScore] = useState("8.5");
  const [feedback, setFeedback] = useState("## Nhận xét bài làm\n- **Ưu điểm**: Làm tốt các câu đọc lướt.\n- **Cần chú ý**: Giới hạn số từ cho phép.");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGrade = async () => {
    setLoading(true);
    try {
      await homeworksApi.grade({
        homeworkId,
        studentId,
        score: parseFloat(score),
        feedback,
      });
      toast({
        title: "Đã chấm điểm thành công",
        description: `Đã lưu điểm ${score} và trả bài cho học viên.`,
      });
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Lỗi chấm bài",
        description: err.message || "Không thể lưu điểm.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Award className="h-5 w-5 text-primary" />
            Chấm điểm & Nhận xét Bài làm
          </DialogTitle>
          <DialogDescription>
            Học viên: <span className="font-semibold text-foreground">{studentName || studentId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="score">Score (Điểm số / Band điểm)</Label>
            <Input
              id="score"
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="font-bold text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Nhận xét - Hỗ trợ Markdown)</Label>
            <Textarea
              id="feedback"
              rows={6}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="font-mono text-sm"
              placeholder="Nhập nhận xét Markdown..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleGrade} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Lưu điểm & Trả bài
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
