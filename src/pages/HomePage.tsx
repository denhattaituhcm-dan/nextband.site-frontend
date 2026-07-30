import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, enrollmentsApi, homeworksApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useState } from "react";
import { JoinClassModal } from "@/components/auth/JoinClassModal";
import { HomeworkContinueCard } from "@/components/homework/HomeworkContinueCard";
import { HomeworkEmptyState } from "@/components/homework/HomeworkEmptyState";
import { HomeworkList } from "@/components/homework/HomeworkList";
import {
  BookOpen,
  Target,
  Bell,
  Calendar,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // 0. Fetch Workspace Data
  const { data: workspaceData, refetch: refetchWorkspace } = useQuery({
    queryKey: ["student-homework-workspace"],
    queryFn: () => homeworksApi.getWorkspace(),
    enabled: isAuthenticated,
  });

  const workspace = workspaceData?.data;
  const continueTask = workspace?.continue || null;
  const dueTodayTasks = workspace?.dueToday || [];
  const upcomingTasks = workspace?.upcoming || [];
  const completedTasks = workspace?.completed || [];

  // 1. Fetch Enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.list(),
    enabled: isAuthenticated,
  });

  // 2. Fetch Student Real Submissions for Recent Feedback & Progress
  const { data: submissionsData } = useQuery({
    queryKey: ["my-recent-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 50 }),
    enabled: !!user?.id,
  });

  const userSubmissions = submissionsData?.data || [];
  const gradedSubmissions = userSubmissions.filter((s: any) => s.status === "graded");
  const submittedTasksCount = userSubmissions.filter((s: any) => s.status === "graded" || s.status === "submitted").length;

  const totalCourseLessons = 27; // Tiêu chuẩn 27 bài tập của khóa học
  const completedCount = Math.min(submittedTasksCount, totalCourseLessons);
  const activeClassName = enrollments[0]?.courses?.title ? `${enrollments[0].courses.title} • STARTER01` : "STARTER01 • 04.2026";
  const hasClasses = enrollments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* HEADER & PROGRESS BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Lớp: {activeClassName}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Bàn làm việc bài tập</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Xin chào, {user?.fullName || "Học viên"} 👋
            </h1>
          </div>

          {/* PROGRESS TEXT & BAR */}
          <div className="w-full md:w-72 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Tiến độ bài tập khóa học</span>
              <span className="text-emerald-600 font-bold">
                Đã hoàn thành {completedCount} trong {totalCourseLessons} bài tập
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((completedCount / totalCourseLessons) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* HERO WORKSPACE CARD (BÀI TẬP CẦN LÀM BÂY GIỜ) */}
        {continueTask ? (
          <HomeworkContinueCard task={continueTask} />
        ) : (
          <HomeworkEmptyState
            hasClasses={hasClasses}
            onJoinClick={() => setJoinModalOpen(true)}
          />
        )}

        {/* MAIN LAYOUT: LEFT (WORKSPACES) & RIGHT (NEXT SESSION & ALERTS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: TASKS LISTS */}
          <div className="md:col-span-2 space-y-6">
            <HomeworkList title="Bài tập cần làm hôm nay" tasks={dueTodayTasks} />
            <HomeworkList title="Bài tập sắp tới" tasks={upcomingTasks} />
            <HomeworkList title="Bài tập đã làm & Đã chấm" tasks={completedTasks} variant="completed" />

            {/* TIMELINE TRẠNG THÁI TIẾN ĐỘ BÀI TẬP */}
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Lộ trình 27 buổi học & Bài tập Lớp {activeClassName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap pt-2">
                {Array.from({ length: totalCourseLessons }).map((_, idx) => {
                  const lessonNum = idx + 1;
                  const isDone = lessonNum <= completedCount;
                  const isCurrent = lessonNum === completedCount + 1;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                        isDone
                          ? "bg-emerald-500 text-white shadow-sm"
                          : isCurrent
                          ? "bg-amber-100 text-amber-900 border-2 border-amber-500 animate-pulse"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      title={`Buổi ${lessonNum}: ${isDone ? "Đã nộp" : isCurrent ? "Bài hiện tại" : "Chưa mở"}`}
                    >
                      {isDone ? "✓" : lessonNum}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Hoàn thành
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Đang làm
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> Chưa đến buổi
                </span>
              </div>
            </Card>
          </div>

          {/* RIGHT PANEL: NEXT CLASS SESSION & IMPORTANT ALERTS */}
          <div className="space-y-6">
            {/* BUỔI HỌC TIẾP THEO WIDGET */}
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Buổi học tiếp theo
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-900 font-extrabold text-lg">
                  <span>Buổi 13</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    Thứ Sáu, 15/08
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  18:00 - 20:00 (Phòng 302 • Cơ sở Trung tâm)
                </p>
                <div className="pt-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  📌 Hãy hoàn thành Homework Buổi 12 trước giờ lên lớp.
                </div>
              </div>
            </Card>

            {/* HOMEWORK QUÁ HẠN WIDGET */}
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-3">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Homework quá hạn (Reminders)
              </span>
              {dueTodayTasks.length === 0 && upcomingTasks.length === 0 ? (
                <p className="text-xs text-slate-500 py-1">
                  Không có bài tập quá hạn. Bạn đang hoàn thành rất tốt lịch học!
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-1">
                    <span className="font-bold text-rose-900">Cảnh báo nộp muộn</span>
                    <p className="text-rose-700">Hãy chú ý nộp bài đúng hạn để nhận phản hồi từ giáo viên.</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* BOTTOM CARD: FEEDBACK MỚI NHẤT (TEACHER FEEDBACK) */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Feedback mới nhất từ Giáo viên
          </h3>
          <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            {gradedSubmissions.length > 0 ? (
              gradedSubmissions.slice(0, 3).map((sub: any) => (
                <div key={sub.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {sub.exams?.title || "Bài tập Writing Task 2"}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      Điểm: {sub.total_score ?? "8.0"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{sub.feedback || "Bài làm bố cục rõ ràng, từ vựng phong phú. Cần lưu ý bổ sung từ nối ở đoạn 2."}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                    <span>Ngày chấm: {sub.graded_at ? new Date(sub.graded_at).toLocaleDateString("vi-VN") : "Hôm nay"}</span>
                    <Link to={`/submissions/${sub.id}`} className="text-emerald-600 font-semibold hover:underline">
                      Xem bài chữa chi tiết ➔
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">
                Chưa có nhận xét mới từ giáo viên. Hãy hoàn thành bài tập để nhận phản hồi bài chấm chi tiết!
              </div>
            )}
          </Card>
        </div>

        {/* Modal Onboarding Join Class */}
        <JoinClassModal
          open={joinModalOpen}
          onOpenChange={setJoinModalOpen}
          onSuccess={() => refetchWorkspace()}
        />
      </div>
    </div>
  );
}
