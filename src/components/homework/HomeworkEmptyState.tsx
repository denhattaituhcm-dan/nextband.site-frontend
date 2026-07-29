import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, KeyRound, Sparkles } from "lucide-react";

interface HomeworkEmptyStateProps {
  onJoinClick: () => void;
  hasClasses: boolean;
}

export function HomeworkEmptyState({ onJoinClick, hasClasses }: HomeworkEmptyStateProps) {
  return (
    <Card className="border-emerald-100 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl shadow-xl p-8 text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
        {hasClasses ? <CheckCircle2 className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white">
          {hasClasses ? "Bạn đã hoàn thành tất cả bài tập! 🎉" : "Chào mừng bạn đến với NextBand V2.0"}
        </h2>
        <p className="text-sm text-slate-400">
          {hasClasses
            ? "Hiện tại không có bài tập nào tồn đọng. Hãy nghỉ ngơi hoặc xem lại các bài học cũ."
            : "Hãy gia nhập Lớp học của bạn bằng Mã mời do Giáo viên cấp để bắt đầu nhận bài tập về nhà."}
        </p>
      </div>

      <div className="pt-2 flex justify-center">
        <Button
          onClick={onJoinClick}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg flex items-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          {hasClasses ? "Nhập mã Lớp học mới" : "Tham gia Lớp học bằng mã ngắn (DREAM31)"}
        </Button>
      </div>
    </Card>
  );
}
