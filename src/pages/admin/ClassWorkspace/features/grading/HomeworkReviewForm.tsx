import React, { useState } from "react";
import { SubmissionItem } from "./SubmissionQueueItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Headphones, Send, Save, Paperclip, Clock, RotateCcw } from "lucide-react";

interface HomeworkReviewFormProps {
  submission: SubmissionItem | null;
  onGradedSuccess?: () => void;
}

export const HomeworkReviewForm: React.FC<HomeworkReviewFormProps> = ({
  submission,
  onGradedSuccess,
}) => {
  const [feedback, setFeedback] = useState("");
  const [optionalScore, setOptionalScore] = useState("");
  const { toast } = useToast();

  if (!submission) {
    return (
      <div className="h-full flex items-center justify-center p-8 border rounded-xl bg-card text-muted-foreground text-sm">
        Chọn một bài nộp từ hàng đợi bên trái để bắt đầu chấm.
      </div>
    );
  }

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      toast({ title: "Thông báo", description: "Vui lòng nhập nhận xét cho học viên", variant: "destructive" });
      return;
    }
    toast({ title: "Đã phản hồi!", description: `Đã gửi nhận xét đến học viên ${submission.studentName}` });
    setFeedback("");
    setOptionalScore("");
    onGradedSuccess?.();
  };

  return (
    <Card className="h-full border bg-card flex flex-col justify-between">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              {submission.homeworkTitle}
              <Badge variant="outline" className="text-xs font-normal">
                Học viên: {submission.studentName}
              </Badge>
            </CardTitle>
          </div>
          <Badge className="bg-emerald-600 text-white text-xs">Homework Review</Badge>
        </div>

        {/* Submission Metadata Section */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="h-3.5 w-3.5" />
            Nộp: {submission.submittedAt} (⏳ {submission.waitingTime} trước)
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <RotateCcw className="h-3.5 w-3.5" />
            Lần nộp: {submission.attemptsCount || 1}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Paperclip className="h-3.5 w-3.5" />
            File đính kèm: Audio & Text
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Homework Content Display */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nội dung bài làm của học viên
          </label>
          <div className="p-3.5 rounded-lg border bg-muted/30 text-xs leading-relaxed space-y-2">
            <p className="italic text-slate-600 dark:text-slate-400">
              "Em đã hoàn thành phần nghe Listening Section 4 và bài trả lời Speaking Part 2 trong file âm thanh đính kèm."
            </p>
            <div className="flex items-center gap-2 p-2 rounded bg-card border text-xs">
              <Headphones className="h-4 w-4 text-emerald-600" />
              <span className="font-mono text-xs">student_audio_speaking_hw12.mp3</span>
            </div>
          </div>
        </div>

        {/* General Feedback Textarea */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Nhận xét của giáo viên (Tự do ghi chú)
          </label>
          <Textarea
            placeholder="Ví dụ: Listening còn mất tập trung ở Section 4. Speaking phát âm tốt hơn tuần trước..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[110px] text-xs"
          />
        </div>

        {/* Optional Score Input */}
        <div className="space-y-1 w-44">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Điểm số (Tùy chọn)
          </label>
          <Input
            placeholder="Ví dụ: 8.0"
            value={optionalScore}
            onChange={(e) => setOptionalScore(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </CardContent>

      <div className="p-4 border-t flex items-center justify-end gap-2 bg-muted/10">
        <Button variant="outline" size="sm" className="text-xs gap-1">
          <Save className="h-3.5 w-3.5" />
          Lưu nháp
        </Button>
        <Button
          size="sm"
          className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleSubmitFeedback}
        >
          <Send className="h-3.5 w-3.5" />
          Phản hồi học viên
        </Button>
      </div>
    </Card>
  );
};
