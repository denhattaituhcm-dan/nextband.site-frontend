import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, enrollmentsApi, submissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Bell,
  MessageSquare,
  Award,
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  // 1. Fetch Enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.list(),
    enabled: isAuthenticated,
  });

  // 2. Fetch Submissions for Recent Activity & State Machine
  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions-dashboard", user?.id],
    queryFn: () => submissionsApi.list({ limit: 5, studentId: user?.id }),
    enabled: isAuthenticated && !!user?.id,
  });

  // 3. Fetch Courses list
  const { data: coursesData } = useQuery({
    queryKey: ["courses-home"],
    queryFn: () => coursesApi.list({ limit: 6 }),
  });

  const submissions = submissionsData?.data || [];
  const latestSubmission = submissions[0];

  // Continue Learning State Machine Logic
  const getContinueState = () => {
    if (!latestSubmission) {
      return {
        type: "START",
        title: "Dreamer — Lesson 1: Introduction & Diagnostic Test",
        badge: "Bắt đầu bài đầu tiên",
        btnText: "Bắt đầu làm bài",
        subtext: "⏱️ Thời lượng dự kiến: 30 phút",
        link: "/courses",
      };
    }

    if (latestSubmission.status === "in_progress") {
      return {
        type: "RESUME",
        title: `${latestSubmission.exams?.title || "Bài thi IELTS"}`,
        badge: "Đang làm dở",
        btnText: "Tiếp tục làm bài (Resume)",
        subtext: "⌛ Hạn nộp: 22:00 Hôm nay",
        link: `/exam/${latestSubmission.exam_id}`,
      };
    }

    if (latestSubmission.status === "submitted") {
      return {
        type: "AWAITING",
        title: `${latestSubmission.exams?.title || "Bài làm đã nộp"}`,
        badge: "Đã nộp bài • Chờ chấm",
        btnText: "Xem bài đã nộp",
        subtext: "🕒 Đã nộp lúc " + new Date(latestSubmission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        link: `/submission/${latestSubmission.id}`,
      };
    }

    if (latestSubmission.status === "graded") {
      return {
        type: "GRADED",
        title: `${latestSubmission.exams?.title || "Bài tập đã chấm điểm"}`,
        badge: `Đã chấm điểm • Score: ${latestSubmission.total_score || 0} pts`,
        btnText: "Xem feedback giáo viên",
        subtext: "💬 Giáo viên đã nhận xét bài làm của bạn",
        link: `/submission/${latestSubmission.id}`,
      };
    }

    return {
      type: "FREE_DAY",
      title: "Bạn đã hoàn thành tất cả bài tập! 🎉",
      badge: "Không có bài tồn đọng",
      btnText: "Xem lại danh sách khóa học",
      subtext: "📅 Buổi học tiếp theo: Thứ Ba 19:30",
    };
  };

  const stateInfo = getContinueState();

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* GREETING HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Xin chào {user?.fullName || "DAN"} - Hệ Thống V2.0 Đã Kết Nối! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAuthenticated
                ? "Hôm nay bạn có bài tập cần hoàn thành."
                : "Đăng nhập để xem nhiệm vụ bài tập hôm nay của bạn."}
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm text-xs text-slate-600">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Current Target: <strong>Band 6.5</strong></span>
            </div>
          )}
        </div>

        {/* LEVEL 1: HERO WORKSPACE (CONTINUE LEARNING STATE MACHINE) */}
        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white rounded-2xl shadow-xl overflow-hidden relative">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <CardContent className="p-6 md:p-8 relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                {stateInfo.badge}
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {stateInfo.subtext}
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                Task before Course • Ưu tiên làm ngay
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {stateInfo.title}
              </h2>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                {stateInfo.link ? (
                  <Link to={stateInfo.link}>
                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                      {stateInfo.btnText}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/courses">
                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                      Bắt đầu ngay
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LEVEL 2: PROGRESS CONTEXT & NOTIFICATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BAND TARGET WIDGET */}
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Band Goal Trajectory
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Current Band</div>
                  <div className="text-3xl font-extrabold text-slate-900">6.0</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div className="text-right">
                  <div className="text-xs text-slate-500">Target Band</div>
                  <div className="text-3xl font-extrabold text-emerald-600">6.5</div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[65%]" />
              </div>
            </CardContent>
          </Card>

          {/* NOTIFICATIONS WIDGET */}
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all col-span-1 md:col-span-2">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-slate-600 border-b pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Cần chú ý (Notifications)
                </span>
                <span className="text-xs text-blue-600 font-medium">1 Mới</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-2 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Giáo viên đã nhận xét bài Writing</span>
                    <p className="text-slate-500 mt-0.5">Cô Trà My: "Bài viết Task 2 từ vựng tốt, chú ý mạch nối giữa các đoạn..."</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LEVEL 3: JOURNEY COURSES (27 DOTS MAP) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Hành trình khóa học (Course Journey)
            </h2>
            <Link to="/my-courses" className="text-xs font-semibold text-emerald-600 hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {((enrollments.length > 0 ? enrollments : coursesData?.data?.length ? coursesData.data : [
              {
                id: "c1",
                title: "IELTS Intensive Master (Target 6.5 - 7.5)",
                slug: "ielts-intensive-master",
                completedLessons: 14,
                totalLessons: 27
              },
              {
                id: "c2",
                title: "IELTS Speaking & Writing Foundation",
                slug: "ielts-speaking-writing-foundation",
                completedLessons: 6,
                totalLessons: 27
              }
            ])).slice(0, 2).map((item: any, idx: number) => {
              const course = item.courses || item;
              const completedLessons = item.completedLessons ?? (idx === 0 ? 14 : 6);
              const totalLessons = item.totalLessons ?? 27;

              return (
                <Card key={course.id || idx} className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{course.title}</h3>
                      <span className="text-xs text-slate-500">
                        {completedLessons}/{totalLessons} Lessons Completed
                      </span>
                    </div>
                    <Link to={`/course/${course.slug || course.id}`}>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">
                        Chi tiết ➔
                      </Button>
                    </Link>
                  </div>

                  {/* 27 JOURNEY DOTS */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {Array.from({ length: totalLessons }).map((_, dIdx) => (
                      <span
                        key={dIdx}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          dIdx < completedLessons
                            ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                            : "bg-slate-200"
                        }`}
                        title={`Lesson ${dIdx + 1}`}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RECENT ACTIVITY (CẢM GIÁC HOÀN THÀNH) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Lịch sử vừa hoàn thành (Recent Activity)
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Lesson 11: Listening — Đã hoàn thành (Score: 8.5/10)
              </span>
              <span className="text-slate-400">Hôm qua</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Lesson 10: Writing Task 1 — Đã nhận feedback giáo viên
              </span>
              <span className="text-slate-400">2 ngày trước</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
