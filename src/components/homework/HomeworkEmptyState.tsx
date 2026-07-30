import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, KeyRound, Sparkles } from "lucide-react";

interface HomeworkEmptyStateProps {
  onJoinClick: () => void;
  hasClasses: boolean;
}

export function HomeworkEmptyState({ onJoinClick, hasClasses }: HomeworkEmptyStateProps) {
  if (hasClasses) {
    return (
      <Card className="border-blue-100 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 text-white rounded-2xl shadow-lg p-6 md:p-8 text-center space-y-4 border-0">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white backdrop-blur-sm">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Bạn đã hoàn thành tất cả bài tập! 🎉
          </h2>
          <p className="text-xs md:text-sm text-blue-100 font-medium">
            Hiện tại không có bài tập nào tồn đọng. Hãy xem lại các bài học hoặc chuẩn bị cho buổi học tiếp theo.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Button
            onClick={onJoinClick}
            className="bg-white hover:bg-blue-50 text-blue-600 font-extrabold px-6 py-4 rounded-xl shadow-lg flex items-center gap-2 text-sm border-0"
          >
            <KeyRound className="w-4 h-4" />
            Nhập mã Lớp học mới
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. HERO WELCOME BANNER FOR UNENROLLED STUDENTS */}
      <Card className="border-blue-500 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl shadow-xl p-8 md:p-10 text-center space-y-6 border-0 relative overflow-hidden">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto text-white backdrop-blur-md">
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
            HỆ THỐNG QUẢN LÝ BÀI TẬP ARIS IELTS
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Chào mừng bạn đến với NextBand
          </h1>
          <p className="text-sm md:text-base text-blue-100 font-medium leading-relaxed">
            NextBand là hệ thống đồng hành học tập trực tuyến dành riêng cho học viên trung tâm ARIS IELTS. Đăng nhập ngay và nhập Mã Lớp học để bắt đầu lộ trình làm bài tập & nhận phản hồi trực tiếp từ Giáo viên.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            onClick={onJoinClick}
            className="bg-white hover:bg-blue-50 text-blue-600 font-extrabold px-8 py-6 rounded-xl shadow-2xl hover:shadow-blue-900/30 transition-all text-base flex items-center gap-2 border-0"
          >
            <KeyRound className="w-5 h-5" />
            Nhập Mã Lớp học (VD: STARTER01)
          </Button>
        </div>
      </Card>

      {/* 2. 5-STEP GUIDELINE WORKFLOW */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider text-center">
          Hệ thống hoạt động như thế nào? (5 Bước đơn giản)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">1</span>
            <div className="font-bold text-xs text-slate-900">Đăng nhập</div>
            <p className="text-[11px] text-slate-500">Tài khoản được cấp hoặc đăng ký</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">2</span>
            <div className="font-bold text-xs text-slate-900">Nhập mã lớp</div>
            <p className="text-[11px] text-slate-500">Mã ngắn do Giáo viên cấp</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">3</span>
            <div className="font-bold text-xs text-slate-900">Nhận bài tập</div>
            <p className="text-[11px] text-slate-500">Theo đúng lộ trình từng buổi</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">4</span>
            <div className="font-bold text-xs text-slate-900">Làm & Nộp bài</div>
            <p className="text-[11px] text-slate-500">Ghi âm, trắc nghiệm & tự luận</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">5</span>
            <div className="font-bold text-xs text-slate-900">Giáo viên nhận xét</div>
            <p className="text-[11px] text-slate-500">Chấm điểm & chữa bài chi tiết</p>
          </div>
        </div>
      </Card>

      {/* 3. 5-LEVEL IELTS ROADMAP SUMMARY */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider text-center">
          Khung 5 Cấp độ Khóa học tại ARIS IELTS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Cấp độ 1</span>
            <div className="font-extrabold text-xs text-slate-900">STARTER</div>
            <p className="text-[10px] text-slate-500">Nền tảng IELTS</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Cấp độ 2</span>
            <div className="font-extrabold text-xs text-slate-900">DREAMER</div>
            <p className="text-[10px] text-slate-500">Khởi động Band 4.5+</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Cấp độ 3</span>
            <div className="font-extrabold text-xs text-slate-900">BUILDER</div>
            <p className="text-[10px] text-slate-500">Xây dựng Band 5.5+</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Cấp độ 4</span>
            <div className="font-extrabold text-xs text-slate-900">MASTER</div>
            <p className="text-[10px] text-slate-500">Bứt phá Band 6.0+</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center space-y-1">
            <span className="text-[10px] font-bold text-red-600 uppercase">Cấp độ 5</span>
            <div className="font-extrabold text-xs text-red-900">LEADER</div>
            <p className="text-[10px] text-red-600 font-semibold">Chinh phục Band 6.5+</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
