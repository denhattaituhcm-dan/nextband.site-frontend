import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, KeyRound, Sparkles } from "lucide-react";

interface HomeworkEmptyStateProps {
  onJoinClick: () => void;
  hasClasses: boolean;
}

export function HomeworkEmptyState({ onJoinClick, hasClasses }: HomeworkEmptyStateProps) {
  return (
    <Card className="border-blue-100 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 text-white rounded-2xl shadow-lg p-6 md:p-8 text-center space-y-4 border-0">
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white backdrop-blur-sm">
        {hasClasses ? <CheckCircle2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h2 className="text-xl md:text-2xl font-extrabold text-white">
          {hasClasses ? "Bạn đã hoàn thành tất cả bài tập! 🎉" : "Gia nhập Lớp học của bạn"}
        </h2>
        <p className="text-xs md:text-sm text-blue-100 font-medium">
          {hasClasses
            ? "Hiện tại không có bài tập nào tồn đọng. Hãy xem lại các bài học hoặc lịch học sắp tới."
            : "Nhập mã Lớp học do Trung tâm/Giáo viên cấp để bắt đầu nhận bài tập về nhà."}
        </p>
      </div>

      <div className="pt-2 flex justify-center">
        <Button
          onClick={onJoinClick}
          className="bg-white hover:bg-blue-50 text-blue-600 font-extrabold px-6 py-4 rounded-xl shadow-lg flex items-center gap-2 text-sm border-0"
        >
          <KeyRound className="w-4 h-4" />
          {hasClasses ? "Nhập mã Lớp học mới" : "Tham gia Lớp học bằng mã ngắn (DREAM31)"}
        </Button>
      </div>
    </Card>
  );
}
