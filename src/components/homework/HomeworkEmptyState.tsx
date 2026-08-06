import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, KeyRound, Sparkles, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface HomeworkEmptyStateProps {
  onJoinClick?: () => void;
  hasClasses?: boolean;
  state?: "NO_ENROLLMENT" | "PENDING_ACTIVATION" | "SUSPENDED_STUDENT" | "ACTIVE_STUDENT";
}

export function HomeworkEmptyState({ onJoinClick, hasClasses, state }: HomeworkEmptyStateProps) {
  const { settings } = useSiteSettings();

  const isSuspended = state === "SUSPENDED_STUDENT";
  const isPending = state === "PENDING_ACTIVATION";

  return (
    <div className="space-y-6">
      {/* 1. HERO WELCOME BANNER FOR UNENROLLED OR PENDING/SUSPENDED STUDENTS */}
      <Card className={`border-0 text-white rounded-2xl shadow-lg p-6 md:p-8 text-center space-y-4 relative overflow-hidden ${
        isSuspended
          ? "bg-gradient-to-r from-amber-600 via-red-600 to-rose-700"
          : isPending
          ? "bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700"
          : "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"
      }`}>
        <div className="space-y-2 max-w-3xl mx-auto">
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {isSuspended
              ? "Tài khoản Lớp học tạm thời bị tạm dừng"
              : isPending
              ? "Tài khoản của bạn đang chờ Giáo viên Kích hoạt"
              : "Chào mừng bạn đến với ARIS IELTS (NextBand)"}
          </h1>
          <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
            {isSuspended
              ? "Lớp học của bạn đang ở trạng thái Tạm dừng. Vui lòng liên hệ Giáo viên hoặc Trung tâm để kiểm tra thông tin và mở lại quyền học."
              : isPending
              ? "Hệ thống đã ghi nhận lớp học của bạn. Giáo viên sẽ bật Kích hoạt để bạn bắt đầu truy cập bài học."
              : "Tài khoản Email của bạn chưa được liên kết với Lớp học nào. Vui lòng liên hệ Giáo viên / Trung tâm ARIS IELTS để được xếp lớp."}
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
              <span>Support / Liên hệ Giáo viên</span>
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">1</span>
            <div className="font-bold text-xs text-slate-900">Đăng nhập</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">2</span>
            <div className="font-bold text-xs text-slate-900">Giáo viên xếp lớp</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">3</span>
            <div className="font-bold text-xs text-slate-900">Nhận bài tập</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">4</span>
            <div className="font-bold text-xs text-slate-900">Làm & Nộp bài</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-extrabold text-xs inline-flex items-center justify-center">5</span>
            <div className="font-bold text-xs text-slate-900">Giáo viên nhận xét</div>
          </div>
        </div>
      </Card>

      {/* 3. 5-LEVEL IELTS ROADMAP SUMMARY - YOUR IELTS GROWTH PATH (BUILDER JOURNEY METAPHOR) */}
      <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-6 shadow-sm overflow-hidden">
        <div className="text-center space-y-1.5 max-w-3xl mx-auto">
          <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
            YOUR IELTS GROWTH PATH
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Từng bước kiến tạo tri thức – Từ nền tảng vững chắc đến vị thế Leader
          </p>
        </div>

        {/* ROADMAP GRID (5 COLUMNS DESKTOP / VERTICAL TIMELINE MOBILE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 relative">
          {/* LEVEL 1: STARTER */}
          <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-pink-50/30 border border-slate-200/80 hover:border-[#D84B85]/60 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1">
            {/* TOP IELTS BAND BADGE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#D84B85] text-white text-[11px] font-black shadow-xs">
                  BAND 3.0
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  LVL 01
                </span>
              </div>

              <div>
                <div className="font-black text-base text-slate-900 tracking-tight">STARTER</div>
                <div className="text-[11px] font-bold text-[#D84B85] italic">"I start"</div>
              </div>

              {/* PROGRESSIVE METAPHOR ILLUSTRATION: FOUNDATION STONE */}
              <div className="py-3 flex justify-center items-center">
                <div className="w-14 h-14 rounded-2xl bg-pink-100/80 text-[#D84B85] flex items-center justify-center shadow-inner border border-pink-200 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
              </div>

              {/* REAL ACADEMIC BENEFITS */}
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-extrabold text-slate-800">Hiểu bản chất một câu văn</div>
                <ul className="text-[11px] text-slate-600 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D84B85]" />
                    <span>Cách các thành phần liên hệ</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D84B85]" />
                    <span>Áp dụng để tự tin Viết/Đọc/Nói</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D84B85]" />
                    <span>Nền tảng từ vựng Pre IELTS</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>⏱ 27 buổi (9 tuần)</span>
              <span className="text-[10px] text-slate-400">Phase 1</span>
            </div>
          </div>

          {/* LEVEL 2: DREAMER */}
          <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-cyan-50/30 border border-slate-200/80 hover:border-[#0093A8]/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#0093A8] text-white text-[11px] font-black shadow-xs">
                  BAND 4.0
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  LVL 02
                </span>
              </div>

              <div>
                <div className="font-black text-base text-slate-900 tracking-tight">DREAMER</div>
                <div className="text-[11px] font-bold text-[#0093A8] italic">"I dream"</div>
              </div>

              {/* PROGRESSIVE METAPHOR ILLUSTRATION: BLUEPRINT */}
              <div className="py-3 flex justify-center items-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-100/80 text-[#0093A8] flex items-center justify-center shadow-inner border border-cyan-200 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-extrabold text-slate-800">Sự mạch lạc của đoạn văn</div>
                <ul className="text-[11px] text-slate-600 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0093A8]" />
                    <span>Liên kết các câu văn với nhau</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0093A8]" />
                    <span>Tự tin viết/đọc/nói đoạn dài</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0093A8]" />
                    <span>Tư duy phản xạ bài thi IELTS</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>⏱ 27 buổi (9 tuần)</span>
              <span className="text-[10px] text-slate-400">Phase 2</span>
            </div>
          </div>

          {/* LEVEL 3: BUILDER */}
          <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-orange-50/30 border border-slate-200/80 hover:border-[#EE771D]/60 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#EE771D] text-white text-[11px] font-black shadow-xs">
                  BAND 5.0
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  LVL 03
                </span>
              </div>

              <div>
                <div className="font-black text-base text-slate-900 tracking-tight">BUILDER</div>
                <div className="text-[11px] font-bold text-[#EE771D] italic">"I build"</div>
              </div>

              {/* PROGRESSIVE METAPHOR ILLUSTRATION: BUILDING UNDER CONSTRUCTION */}
              <div className="py-3 flex justify-center items-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-100/80 text-[#EE771D] flex items-center justify-center shadow-inner border border-orange-200 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
                    <path d="M6 12h12" />
                    <path d="M6 7h12" />
                    <path d="M6 17h12" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-extrabold text-slate-800">Thi IELTS cơ bản</div>
                <ul className="text-[11px] text-slate-600 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EE771D]" />
                    <span>Hiểu bản chất kỳ thi IELTS</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EE771D]" />
                    <span>Trả lời tự nhiên & logic</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EE771D]" />
                    <span>Ứng dụng được Tiếng Anh thực tế</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>⏱ 27 buổi (9 tuần)</span>
              <span className="text-[10px] text-slate-400">Phase 3</span>
            </div>
          </div>

          {/* LEVEL 4: MASTER */}
          <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/30 border border-slate-200/80 hover:border-[#00B956]/60 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#00B956] text-white text-[11px] font-black shadow-xs">
                  BAND 6.0
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  LVL 04
                </span>
              </div>

              <div>
                <div className="font-black text-base text-slate-900 tracking-tight">MASTER</div>
                <div className="text-[11px] font-bold text-[#00B956] italic">"I master"</div>
              </div>

              {/* PROGRESSIVE METAPHOR ILLUSTRATION: COMPLETED ACADEMY */}
              <div className="py-3 flex justify-center items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 text-[#00B956] flex items-center justify-center shadow-inner border border-emerald-200 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-extrabold text-slate-800">Luyện thi nâng cao</div>
                <ul className="text-[11px] text-slate-600 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B956]" />
                    <span>Lập luận tốt tất cả dạng đề</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B956]" />
                    <span>Nắm rõ xử lý các dạng đề khó</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B956]" />
                    <span>Tối ưu hóa thời gian thi thực tế</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>⏱ 27 buổi (9 tuần)</span>
              <span className="text-[10px] text-slate-400">Phase 4</span>
            </div>
          </div>

          {/* LEVEL 5: LEADER */}
          <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-rose-50/40 border border-slate-200/80 hover:border-[#B82B37]/60 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 hover:-translate-y-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-[#B82B37] text-white text-[11px] font-black shadow-xs">
                  BAND 7.0+
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  LVL 05
                </span>
              </div>

              <div>
                <div className="font-black text-base text-slate-900 tracking-tight">LEADER</div>
                <div className="text-[11px] font-bold text-[#B82B37] italic">"I lead"</div>
              </div>

              {/* PROGRESSIVE METAPHOR ILLUSTRATION: LANDMARK WITH CROWN */}
              <div className="py-3 flex justify-center items-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-100/80 text-[#B82B37] flex items-center justify-center shadow-inner border border-rose-200 group-hover:scale-110 transition-transform duration-300 relative">
                  <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-extrabold text-slate-800">Master & Chinh phục 7.0+</div>
                <ul className="text-[11px] text-slate-600 space-y-1 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B82B37]" />
                    <span>Tư duy & lập luận chuyên sâu</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B82B37]" />
                    <span>Lưu khoát & tự nhiên như bản xứ</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B82B37]" />
                    <span>Dẫn dắt & định hình phản xạ</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span>⏱ 30 buổi (10 tuần)</span>
              <span className="text-[10px] text-slate-400">Phase 5</span>
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
      imageUrl: "/IELTS CERTIFICATE_LUU_VAN-DANG_page-0001.jpg",
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
  const [imgError, setImgError] = useState(false);

  return (
    <div className="rounded-3xl border border-blue-200/60 bg-[#eef6ff] p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-200/50 pb-4 gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Bảng điểm Đội ngũ Giảng dạy ARIS IELTS
          </h3>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
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
              onClick={() => {
                setSelectedTeacherId(t.id);
                setImgError(false);
              }}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-700 border-blue-200/60 hover:bg-blue-50/80"
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
        <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-blue-100/90 shadow-sm flex flex-col justify-between space-y-4">
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

            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
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
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-extrabold text-xs bg-blue-50/80 border border-blue-200/80 text-blue-600 hover:bg-blue-100 transition-all shadow-xs"
          >
            📄 Mở xem Bảng điểm gốc (PDF) ➔
          </a>
        </div>

        {/* RIGHT COLUMN: FLAT NATURAL IMAGE DISPLAY ON PAGE */}
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-700">
            <span className="text-slate-800 font-extrabold text-sm">
              Bảng điểm thi IELTS
            </span>
            <a
              href={currentTeacher.imageUrl || currentTeacher.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline font-extrabold flex items-center gap-1"
            >
              Phóng to
            </a>
          </div>

          {/* DIRECT FLAT IMAGE VIEW (NO PDF VIEWER FRAME) */}
          <div className="w-full rounded-2xl bg-white border border-blue-100/90 p-2 sm:p-3 shadow-sm relative overflow-hidden flex items-center justify-center">
            {!imgError && currentTeacher.imageUrl ? (
              <img
                key={currentTeacher.id}
                src={currentTeacher.imageUrl}
                alt={`Bảng điểm IELTS ${currentTeacher.name}`}
                onError={() => setImgError(true)}
                className="w-full h-auto max-h-[750px] object-contain rounded-xl"
              />
            ) : (
              <iframe
                key={currentTeacher.id}
                src={`${currentTeacher.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                title={`Bảng điểm IELTS ${currentTeacher.name}`}
                className="w-full h-[620px] sm:h-[750px] border-0 rounded-xl bg-white"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

