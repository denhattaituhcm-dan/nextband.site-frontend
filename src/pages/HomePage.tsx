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

  const totalCourseLessons = classLessons.length > 0 ? classLessons.length : 27;
  const completedCount = Math.min(submittedTasksCount, totalCourseLessons);
  const activeClassName = enrollments[0]?.courses?.title ? `${enrollments[0].courses.title} • STARTER01` : "STARTER01 • 04.2026";
  const hasClasses = enrollments.length > 0;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCourseLessons) * 100));

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* 1. GREETING & COURSE PROGRESS (VISUAL HIERARCHY TOP LEVEL) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  {activeClassName}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Bàn làm việc bài tập</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Xin chào, {user?.fullName || "Daniel"} 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Hãy hoàn thành bài tập về nhà hôm nay để duy trì tiến độ học tập nhé!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Tiến độ khóa học</span>
                <span className="text-blue-600 text-sm">
                  {completedCount} / {totalCourseLessons} bài tập ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* QUICK STATS CARD (RIGHT HEADER) */}
          <div className="md:col-span-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng quan cá nhân</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" /> Đã hoàn thành
                </span>
                <span className="font-extrabold text-slate-900">{completedCount} bài</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Bài còn lại
                </span>
                <span className="font-extrabold text-slate-900">{totalCourseLessons - completedCount} bài</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 text-center font-medium">
              Bạn đang giữ tiến độ rất tốt! 🚀
            </div>
          </div>
        </div>

        {/* 2. CURRENT LESSON / HERO WORKSPACE CARD (#2563EB GRADIENT BLUE) */}
        {continueTask ? (
          <HomeworkContinueCard task={continueTask} />
        ) : (
          <HomeworkEmptyState
            hasClasses={hasClasses}
            onJoinClick={() => setJoinModalOpen(true)}
          />
        )}

        {/* 3. MAIN WORKSPACE GRID: LEFT (TIMELINE & TASKS) & RIGHT (NEXT SESSION & ALERTS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS */}
          <div className="md:col-span-2 space-y-6">
            
            {/* TIMELINE TRẠNG THÁI 27 BUỔI HỌC (CARD VIEW HIỆN ĐẠI THEO DEMO 8.8/10) */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Hành trình khóa học ({totalCourseLessons} buổi)
                </h3>
                <span className="text-xs text-blue-600 font-bold">Lớp {activeClassName}</span>
              </div>
              
              <div className="overflow-x-auto pb-3 scrollbar-thin">
                <div className="flex items-center gap-3 min-w-[680px] pt-2">
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
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-14 h-16 rounded-xl p-2 transition-all border ${
                          isDone
                            ? "bg-blue-50/60 border-blue-200 text-blue-600"
                            : isCurrent
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                            : "bg-slate-50 border-slate-100 text-slate-400"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Buổi {lessonNum}
                        </span>
                        <div className="font-extrabold text-xs">
                          {isDone ? "✓" : isCurrent ? "★" : lessonNum}
                        </div>
                        <span className="text-[9px] font-semibold">
                          {isDone ? "Đã nộp" : isCurrent ? "Hiện tại" : "Khóa"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Đang làm (Bài hiện tại)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-200 inline-block" /> Hoàn thành
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" /> Chưa đến buổi
                </span>
              </div>
            </Card>

            {/* TASK LISTS */}
            <HomeworkList title="Bài tập cần làm hôm nay" tasks={dueTodayTasks} />
            <HomeworkList title="Bài tập sắp tới" tasks={upcomingTasks} />
            <HomeworkList title="Bài tập đã làm & Đã chấm" tasks={completedTasks} variant="completed" />
          </div>

          {/* RIGHT PANEL: NEXT CLASS & NOTICES */}
          <div className="space-y-6">
            {/* BUỔI HỌC TIẾP THEO WIDGET */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                Buổi học tiếp theo
              </span>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-900 font-extrabold text-lg">
                  <span>Buổi {nextSessionLesson?.sessionNumber || 13}</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold">
                    {nextSessionLesson?.sessionDate
                      ? new Date(nextSessionLesson.sessionDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                      : "15/08"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-4 h-4 text-slate-400" />
                  18:00 - 20:00
                </p>
                <div className="pt-2 text-xs text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-100 font-medium">
                  📌 Hãy hoàn thành Bài tập Buổi {Math.max(1, (nextSessionLesson?.sessionNumber || 13) - 1)} trước giờ lên lớp.
                </div>
              </div>
            </Card>

            {/* THÔNG BÁO TỪ TRUNG TÂM WIDGET */}
            {/* TODO: Waiting for Announcement module in future phase. Kept minimal placeholder without extra backend APIs. */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-3">
                <Bell className="w-4 h-4 text-blue-600" />
                Thông báo từ Trung tâm
              </span>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">Lịch nghỉ lễ Quốc Khánh 2/9</div>
                  <p className="text-slate-500">Trung tâm nghỉ từ 01/09 đến 03/09. Lịch học bù sẽ được cập nhật.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-900">Mở đăng ký Lớp MASTER02</div>
                  <p className="text-slate-500">Dành cho học viên hoàn thành khóa BUILDER với đầu ra Band 6.0+.</p>
                </div>
              </div>
            </Card>

            {/* REMINDERS QUÁ HẠN */}
            <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-3">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Nhắc nhở nộp bài
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

        {/* 4. FEEDBACK MỚI NHẤT TỪ GIÁO VIÊN */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Feedback mới nhất từ Giáo viên
          </h3>
          <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
            {gradedSubmissions.length > 0 ? (
              gradedSubmissions.slice(0, 3).map((sub: any) => (
                <div key={sub.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {sub.exams?.title || "Listening Session 11"}
                      </span>
                      <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                        Band {sub.total_score ?? "7.5"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate italic">
                      "{sub.feedback || "Cần chú ý danh từ số nhiều và nối âm ở Part 2..."}"
                    </p>
                  </div>
                  <Link to={`/submissions/${sub.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700">
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
