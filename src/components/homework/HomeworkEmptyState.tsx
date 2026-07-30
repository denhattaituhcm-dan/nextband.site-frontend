import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, KeyRound, Sparkles, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface HomeworkEmptyStateProps {
  onJoinClick: () => void;
  hasClasses: boolean;
}

export function HomeworkEmptyState({ onJoinClick, hasClasses }: HomeworkEmptyStateProps) {
  const { settings } = useSiteSettings();

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
      {/* 1. HERO WELCOME BANNER FOR UNENROLLED STUDENTS (ZERO-CODE FRICTIONLESS ONBOARDING) */}
      <Card className="border-blue-500 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg p-6 md:p-8 text-center space-y-4 border-0 relative overflow-hidden">
        <div className="space-y-2 max-w-xl mx-auto">
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Chào mừng bạn đến với ARIS IELTS (NextBand)
          </h1>
          <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
            Tài khoản Email của bạn chưa được liên kết với Lớp học nào. Vui lòng liên hệ Giáo viên / Trung tâm ARIS IELTS để được xếp lớp.
          </p>
        </div>

        {/* SUPPORT BUTTON MATCHING LOGIN PAGE STYLE */}
        {settings.zaloLink && (
          <div className="flex justify-center pt-1">
            <a
              href={settings.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-sky-300" />
              <span>Support</span>
            </a>
          </div>
        )}
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

      {/* 4. TEACHING FACULTY & VERIFIED TRF CERTIFICATE */}
      <TeacherFacultySection />
    </div>
  );
}

function TeacherFacultySection() {
  const teachersList = [
    {
      id: "luu-van-dang",
      name: "Thầy Lưu Văn Đang",
      score: "8.0",
      role: "Giảng viên Chủ nhiệm ARIS IELTS",
      pdfUrl: "/IELTS CERTIFICATE_LUU_VAN-DANG.pdf",
      credentials: [
        "Chứng chỉ Nghiệp vụ Sư phạm — ĐH Sư phạm TP.HCM",
        "Hơn 5 năm kinh nghiệm giảng dạy & tư vấn lộ trình IELTS 6.5+",
        "Trực tiếp chấm & chữa bài Writing / Speaking cho học viên NextBand",
      ],
    },
  ];

  const [selectedTeacherId, setSelectedTeacherId] = useState(teachersList[0].id);
  const currentTeacher =
    teachersList.find((t) => t.id === selectedTeacherId) || teachersList[0];

  return (
    <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Bảng điểm Đội ngũ Giảng dạy ARIS IELTS
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            100% Giảng viên đạt IELTS 8.0+ với Chứng chỉ TRF được xác thực chính thức
          </p>
        </div>
        <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-extrabold bg-red-50 text-red-600 border border-red-200 shadow-2xs">
          VERIFIED TRF 8.0+
        </span>
      </div>

      {/* TEACHER TABS (FOR MULTIPLE TEACHERS SELECTION) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {teachersList.map((t) => {
          const isSelected = t.id === selectedTeacherId;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTeacherId(t.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                  isSelected ? "bg-white text-blue-600" : "bg-blue-100 text-blue-700"
                }`}
              >
                {t.score}
              </span>
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* SIDE-BY-SIDE GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: SELECTED TEACHER PROFILE CARD */}
        <div className="md:col-span-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/20">
                {currentTeacher.score}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  {currentTeacher.name}
                </h4>
                <div className="text-xs text-blue-600 font-extrabold">
                  IELTS Overall {currentTeacher.score}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {currentTeacher.role}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-200/60 pt-3">
              {currentTeacher.credentials.map((cred, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700 font-medium">
                  <span className="text-blue-600 font-bold">
                    {idx === 0 ? "🎓" : idx === 1 ? "👨‍🏫" : "✍️"}
                  </span>
                  <span>{cred}</span>
                </div>
              ))}
            </div>
          </div>

          <a
            href={currentTeacher.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-extrabold text-xs bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all shadow-xs"
          >
            📄 Mở xem Bảng điểm gốc (PDF) ➔
          </a>
        </div>

        {/* RIGHT COLUMN: FULL UNCLIPPED TRF CERTIFICATE PREVIEW */}
        <div className="md:col-span-7 bg-slate-100 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between px-1 pt-1 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-800 font-extrabold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Bảng điểm thi IELTS — {currentTeacher.name} (Bản gốc)
            </span>
            <a
              href={currentTeacher.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline font-extrabold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
            >
              Xem PDF gốc ↗
            </a>
          </div>

          {/* EMBEDDED FULL SIZE PDF VIEW */}
          <div className="w-full rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm min-h-[750px] md:min-h-[900px] relative">
            <object
              data={`${currentTeacher.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              type="application/pdf"
              className="w-full min-h-[750px] md:min-h-[900px] border-0 block"
            >
              <iframe
                key={currentTeacher.id}
                src={`${currentTeacher.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={`Bảng điểm IELTS ${currentTeacher.name}`}
                className="w-full min-h-[750px] md:min-h-[900px] border-0 block"
              />
            </object>
          </div>
        </div>
      </div>
    </Card>
  );
}
