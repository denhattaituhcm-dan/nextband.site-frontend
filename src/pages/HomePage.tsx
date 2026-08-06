// Student Welcome & Class Entry Portal
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { HomeworkEmptyState } from "@/components/homework/HomeworkEmptyState";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrollments } = useStudentLifecycle();

  const hasClasses = Array.isArray(enrollments) && enrollments.length > 0;
  const enrolledClass = enrollments[0];
  const enrolledClassId = enrolledClass?.classId || enrolledClass?.class_id;
  const activeClassName = enrolledClass?.className || enrolledClass?.courses?.title || "M01 07.2026";
  const courseTitle = enrolledClass?.courseTitle || enrolledClass?.courses?.title || "MASTER";

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {!hasClasses ? (
          <HomeworkEmptyState state="NO_ENROLLMENT" />
        ) : (
          /* ========================================================================= */
          /* WELCOME SCREEN FOR ENROLLED STUDENTS (SHOWS CLASS ENTRY CARD)              */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* HERO WELCOME BANNER */}
            <Card className="border-0 text-white rounded-2xl shadow-lg p-6 md:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-sky-300" />
                <span>Mã Lớp học: {activeClassName}</span>
              </div>
              
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Xin chào, {user?.fullName || "Học viên"}! Bạn đã được xếp vào lớp thành công 🎉
                </h1>
                <p className="text-xs md:text-sm text-blue-100 font-medium leading-relaxed">
                  Bạn hiện là học viên chính thức của lớp <strong className="text-white font-bold">{activeClassName}</strong> ({courseTitle}). Click vào Lớp học bên dưới để bắt đầu làm bài tập ngay!
                </p>
              </div>

              {enrolledClassId && (
                <div className="pt-2">
                  <Button
                    onClick={() => navigate(`/class/${enrolledClassId}/lessons`)}
                    className="rounded-full bg-white text-blue-700 hover:bg-blue-50 font-extrabold px-6 py-3 shadow-md active:scale-95 text-xs transition-all gap-2"
                  >
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>🏫 Vào Lớp {activeClassName} để Làm bài</span>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </Button>
                </div>
              )}
            </Card>

            {/* ENROLLED CLASS CARDS LIST */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                Lớp học của bạn ({enrollments.length} Lớp)
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {enrollments.map((item: any, idx: number) => {
                  const clsId = item.classId || item.class_id;
                  const clsName = item.className || item.courses?.title || `Lớp ${idx + 1}`;
                  const crsTitle = item.courseTitle || item.courses?.title || "MASTER";

                  return (
                    <Card
                      key={clsId || idx}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs font-extrabold text-blue-700 border-blue-200 bg-blue-50">
                            {clsName}
                          </Badge>
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                            Đã kích hoạt
                          </Badge>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900">
                          Khóa học {crsTitle}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Toàn bộ bài tập luyện tập của khóa {crsTitle} đã mở hoàn toàn. Hãy vào lớp để chọn bài làm ngay.
                        </p>
                      </div>

                      <Button
                        onClick={() => navigate(`/class/${clsId}/lessons`)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-2 shadow-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        Vào Lớp làm bài ngay ➔
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 5-STEP WORKFLOW GUIDELINE */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-6 md:p-8 space-y-5 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider text-center">
                Hệ thống hoạt động như thế nào? (5 Bước đơn giản)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs inline-flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div className="font-bold text-xs text-slate-900">1. Đăng nhập</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs inline-flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div className="font-bold text-xs text-slate-900">2. Giáo viên xếp lớp</div>
                </div>
                <div className="p-4 rounded-xl bg-blue-600 text-white shadow-md text-center space-y-2 flex flex-col items-center justify-center scale-105">
                  <span className="w-7 h-7 rounded-full bg-white text-blue-700 font-extrabold text-xs inline-flex items-center justify-center">3</span>
                  <div className="font-bold text-xs">3. Vào Lớp làm bài</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-extrabold text-xs inline-flex items-center justify-center">4</span>
                  <div className="font-bold text-xs text-slate-900">4. Làm & Nộp bài</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-extrabold text-xs inline-flex items-center justify-center">5</span>
                  <div className="font-bold text-xs text-slate-900">5. Giáo viên nhận xét</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
