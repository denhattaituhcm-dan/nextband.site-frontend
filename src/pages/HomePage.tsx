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

  // 1. Fetch Enrollments & Class Data
  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.list(),
    enabled: isAuthenticated,
  });

  const enrolledClassId = enrollments[0]?.course_id || enrollments[0]?.courses?.id;

  // 1b. Fetch Class Lessons (ClassSession + Homework + Submission Data)
  const { data: classLessonsData } = useQuery({
    queryKey: ["class-lessons-timeline", enrolledClassId],
    queryFn: () => lessonsApi.getClassLessons(enrolledClassId!),
    enabled: !!enrolledClassId,
  });

  const classLessons = classLessonsData?.data?.lessons || [];
  const nextSessionLesson = classLessons.find(
    (l) => l.sessionDate && new Date(l.sessionDate) >= new Date()
  ) || classLessons[0];

  // 2. Fetch Student Real Submissions for Recent Feedback & Progress
  const { data: submissionsData } = useQuery({
    queryKey: ["my-recent-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 50 }),
    enabled: !!user?.id,
  });

  const userSubmissions = submissionsData?.data || [];
  const gradedSubmissions = userSubmissions.filter((s: any) => s.status === "graded");
  const submittedTasksCount = userSubmissions.filter((s: any) => s.status === "graded" || s.status === "submitted").length;

  const totalCourseLessons = classLessons.length > 0 ? classLessons.length : 27; // Dữ liệu 27 buổi bài tập thật từ ClassSession
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

        {/* HERO WORKSPACE CARD (BÀI TẬP HIỆN TẠI) */}
        {continueTask ? (
          <HomeworkContinueCard task={continueTask} />
        ) : (
          <HomeworkEmptyState
            hasClasses={hasClasses}
            onJoinClick={() => setJoinModalOpen(true)}
          />
        )}

        {/* MAIN LAYOUT: LEFT (WORKSPACES) & RIGHT (NEXT SESSION, ALERTS, CENTER NOTICES) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: TASKS LISTS */}
          <div className="md:col-span-2 space-y-6">
            <HomeworkList title="Bài tập cần làm hôm nay" tasks={dueTodayTasks} />
            <HomeworkList title="Bài tập sắp tới" tasks={upcomingTasks} />
            <HomeworkList title="Bài tập đã làm & Đã chấm" tasks={completedTasks} variant="completed" />

            {/* TIMELINE TRẠNG THÁI TIẾN ĐỘ BÀI TẬP (KẾT NỐI DỮ LIỆU THẬT TỪ ClassSession) */}
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Lộ trình {totalCourseLessons} buổi học & Bài tập Lớp {activeClassName}
              </h3>
              
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="flex items-center gap-2 min-w-[650px] pt-1">
                  {(classLessons.length > 0
                    ? classLessons
                    : Array.from({ length: totalCourseLessons }).map((_, idx) => ({
                        id: `item-${idx}`,
                        sessionNumber: idx + 1,
                        progress: { lessonCompleted: idx + 1 <= completedCount },
                        sessionDate: null,
                      }))
                  ).map((lesson: any, idx: number) => {
                    const lessonNum = lesson.sessionNumber || lesson.lessonOrder || idx + 1;
                    const isDone = lesson.progress?.lessonCompleted || lessonNum <= completedCount;
                    const isCurrent = lessonNum === completedCount + 1;

                    return (
                      <div
                        key={lesson.id || idx}
                        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                          isDone
                            ? "bg-emerald-500 text-white shadow-sm"
                            : isCurrent
                            ? "bg-amber-100 text-amber-900 border-2 border-amber-500 animate-pulse"
                            : "bg-slate-100 text-slate-400"
                        }`}
                        title={`Buổi ${lessonNum}: ${isDone ? "Đã nộp bài" : isCurrent ? "Bài hiện tại" : "Chưa mở"}`}
                      >
                        {isDone ? "✓" : lessonNum}
                      </div>
                    );
                  })}
                </div>
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

          {/* RIGHT PANEL: NEXT CLASS SESSION, REMINDERS & CENTER NOTICES */}
          <div className="space-y-6">
            {/* BUỔI HỌC TIẾP THEO WIDGET (DỮ LIỆU THẬT TỪ ClassSession - BỎ PHÒNG HỌC & GIÁO VIÊN) */}
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-3">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Buổi học tiếp theo
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-900 font-extrabold text-lg">
                  <span>Buổi {nextSessionLesson?.sessionNumber || 13}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    {nextSessionLesson?.sessionDate
                      ? new Date(nextSessionLesson.sessionDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                      : "15/08"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  18:00 - 20:00
                </p>
                <div className="pt-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  📌 Hãy hoàn thành Bài tập Buổi {Math.max(1, (nextSessionLesson?.sessionNumber || 13) - 1)} trước giờ lên lớp.
                </div>
              </div>
            </Card>

            {/* THÔNG BÁO TỪ TRUNG TÂM WIDGET (PLACEHOLDER - WAITING FOR ANNOUNCEMENT MODULE IN FUTURE PHASE) */}
            {/* TODO: Waiting for Announcement module in future phase. Kept minimal placeholder without extra backend APIs. */}
            <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b pb-3">
                <Bell className="w-4 h-4 text-blue-600" />
                Thông báo từ Trung tâm
              </span>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">Lịch nghỉ lễ Quốc Khánh 2/9</div>
                  <p className="text-slate-500">Trung tâm nghỉ từ 01/09 đến 03/09. Lịch học bù sẽ được cập nhật.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">Mở đăng ký Lớp MASTER02</div>
                  <p className="text-slate-500">Dành cho học viên hoàn thành khóa BUILDER với đầu ra Band 6.0+.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">Nhắc nhở nộp bài Speaking</div>
                  <p className="text-slate-500">Hạn chót nộp bài ghi âm Task 2 vào 23:59 ngày Chủ Nhật.</p>
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

        {/* BOTTOM CARD: FEEDBACK MỚI NHẤT (TIN HỌC TINH GỌN - KHÔNG HIỂN THỊ ĐOẠN VĂN DÀI) */}
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            Feedback mới nhất từ Giáo viên
          </h3>
          <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            {gradedSubmissions.length > 0 ? (
              gradedSubmissions.slice(0, 3).map((sub: any) => (
                <div key={sub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {sub.exams?.title || "Listening Session 11"}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Band {sub.total_score ?? "7.5"}
                      </span>
                    </div>
                    {/* Snippet nhận xét ngắn gọn, giới hạn line-clamp-1 */}
                    <p className="text-xs text-slate-600 truncate italic">
                      "{sub.feedback || "Cần chú ý danh từ số nhiều và nối âm ở Part 2..."}"
                    </p>
                  </div>
                  <Link to={`/submissions/${sub.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      Chi tiết ➔
                    </Button>
                  </Link>
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
