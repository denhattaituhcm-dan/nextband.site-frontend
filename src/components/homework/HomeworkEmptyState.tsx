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
      {/* 1. HERO WELCOME BANNER FOR UNENROLLED STUDENTS (COMPACT 100% VIEWPORT FIT) */}
      <Card className="border-blue-500 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg p-5 md:p-6 text-center space-y-4 border-0 relative overflow-hidden">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto text-white backdrop-blur-md">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="space-y-1.5 max-w-xl mx-auto">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md">
            HỆ THỐNG QUẢN LÝ BÀI TẬP ARIS IELTS
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Chào mừng bạn đến với NextBand
          </h1>
          <p className="text-xs md:text-sm text-blue-100 font-medium leading-normal max-w-lg mx-auto">
            NextBand là hệ thống đồng hành học tập trực tuyến dành riêng cho học viên ARIS IELTS. Hãy nhập Mã Lớp học để nhận bài tập & phản hồi trực tiếp từ Giáo viên.
          </p>
        </div>

        <div className="pt-1 flex justify-center">
          <Button
            onClick={onJoinClick}
            className="bg-white hover:bg-blue-50 text-blue-600 font-extrabold px-6 py-3.5 rounded-xl shadow-md hover:shadow-blue-900/30 transition-all text-sm flex items-center gap-2 border-0"
          >
            <KeyRound className="w-4 h-4" />
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

      {/* 3. 5-LEVEL IELTS ROADMAP SUMMARY MATCHING EXACT COURSEBOOK COVER COLORS */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider text-center">
          Khung 5 Cấp độ Khóa học tại ARIS IELTS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1">
          {/* 1. STARTER - MAGENTA PINK (#D84B85) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#F8D7E4] rounded-xl translate-y-1 translate-x-1 transition-transform group-hover:translate-y-1.5 group-hover:translate-x-1.5" />
            <div className="relative p-3.5 rounded-xl bg-[#D84B85] text-white text-center space-y-1 border border-[#C23A73]">
              <span className="text-[10px] font-extrabold text-pink-100 uppercase tracking-widest">Cấp độ 1</span>
              <div className="font-black text-sm text-white tracking-tight">STARTER</div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white backdrop-blur-xs">
                PRE-IELTS
              </div>
            </div>
          </div>

          {/* 2. DREAMER - TEAL CYAN (#0093A8) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#D2F2F7] rounded-xl translate-y-1 translate-x-1 transition-transform group-hover:translate-y-1.5 group-hover:translate-x-1.5" />
            <div className="relative p-3.5 rounded-xl bg-[#0093A8] text-white text-center space-y-1 border border-[#007D8F]">
              <span className="text-[10px] font-extrabold text-cyan-100 uppercase tracking-widest">Cấp độ 2</span>
              <div className="font-black text-sm text-white tracking-tight">DREAMER</div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white backdrop-blur-xs">
                IELTS 3.0 - 4.0
              </div>
            </div>
          </div>

          {/* 3. BUILDER - ORANGE (#EE771D) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FCE8D5] rounded-xl translate-y-1 translate-x-1 transition-transform group-hover:translate-y-1.5 group-hover:translate-x-1.5" />
            <div className="relative p-3.5 rounded-xl bg-[#EE771D] text-white text-center space-y-1 border border-[#D66510]">
              <span className="text-[10px] font-extrabold text-orange-100 uppercase tracking-widest">Cấp độ 3</span>
              <div className="font-black text-sm text-white tracking-tight">BUILDER</div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white backdrop-blur-xs">
                IELTS 4.0 - 5.0
              </div>
            </div>
          </div>

          {/* 4. MASTER - EMERALD GREEN (#00B956) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#D1F7E2] rounded-xl translate-y-1 translate-x-1 transition-transform group-hover:translate-y-1.5 group-hover:translate-x-1.5" />
            <div className="relative p-3.5 rounded-xl bg-[#00B956] text-white text-center space-y-1 border border-[#009E48]">
              <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest">Cấp độ 4</span>
              <div className="font-black text-sm text-white tracking-tight">MASTER</div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white backdrop-blur-xs">
                IELTS 5.0 - 6.0
              </div>
            </div>
          </div>

          {/* 5. LEADER - CRIMSON RED (#B82B37) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FAD6D9] rounded-xl translate-y-1 translate-x-1 transition-transform group-hover:translate-y-1.5 group-hover:translate-x-1.5" />
            <div className="relative p-3.5 rounded-xl bg-[#B82B37] text-white text-center space-y-1 border border-[#9E202B]">
              <span className="text-[10px] font-extrabold text-rose-100 uppercase tracking-widest">Cấp độ 5</span>
              <div className="font-black text-sm text-white tracking-tight">LEADER</div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-white backdrop-blur-xs">
                IELTS 6.5 - 7.0+
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. TEACHING FACULTY (ĐỘI NGŨ GIẢNG DẠY ARIS IELTS CHỨNG CHỈ IELTS 8.0+ TRF) */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Đội ngũ Giảng dạy & Chấm bài ARIS IELTS
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-600 border border-red-200">
            VERIFIED TRF 8.0+
          </span>
        </div>
        <div className="max-w-md mx-auto pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3 shadow-sm hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-md">
                8.0
              </div>
              <div className="text-left space-y-0.5">
                <div className="font-extrabold text-sm text-slate-900">Thầy Lưu Văn Đang</div>
                <div className="text-xs text-blue-600 font-bold">IELTS Overall 8.0 (Verified TRF)</div>
                <div className="text-[11px] text-slate-500">Giảng viên Chủ nhiệm & Đội ngũ Chấm bài ARIS IELTS</div>
              </div>
            </div>
            <a
              href="/IELTS CERTIFICATE_LUU_VAN-DANG.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl font-extrabold text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
            >
              📄 Xem Chứng chỉ IELTS TRF (PDF)
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
