import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, enrollmentsApi, homeworksApi, lessonsApi, submissionsApi, workspaceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 0. Fetch Unified Workspace ViewModel (/me/workspace)
  const { data: studentWorkspaceData } = useQuery({
    queryKey: ["student-me-workspace"],
    queryFn: () => workspaceApi.getStudentWorkspace().catch(() => ({ success: false, data: null as any })),
    enabled: isAuthenticated,
    retry: false,
  });

  const workspaceViewModel = studentWorkspaceData?.data;

  // 0b. Legacy Homework Workspace Projection (Safe failover)
  const { data: workspaceData } = useQuery({
    queryKey: ["student-homework-workspace"],
    queryFn: () => homeworksApi.getWorkspace().catch(() => ({ success: false, data: null as any })),
    enabled: isAuthenticated,
    retry: false,
  });

  const workspace = workspaceData?.data;
  const continueTask = workspace?.continue || null;
  const dueTodayTasks = Array.isArray(workspace?.dueToday) ? workspace.dueToday : [];
  const upcomingTasks = Array.isArray(workspace?.upcoming) ? workspace.upcoming : [];
  const completedTasks = Array.isArray(workspace?.completed) ? workspace.completed : [];

  // 1. Fetch Enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => enrollmentsApi.list().catch(() => []),
    enabled: isAuthenticated,
    retry: false,
  });

  const hasClasses = Array.isArray(enrollments) && enrollments.length > 0;
  const enrolledClassId = workspaceViewModel?.classes?.[0]?.id || enrollments[0]?.course_id || enrollments[0]?.courses?.id;

  // Evaluate State from ViewModel or fallback
  const workspaceState = workspaceViewModel?.state || (hasClasses ? "ACTIVE_STUDENT" : "NO_ENROLLMENT");
  const nextAction = workspaceViewModel?.nextAction;

  // Handler for "Tiếp tục học" dynamic action
  const handleContinueLearning = () => {
    if (nextAction?.type === "HOMEWORK" && nextAction.classId) {
      navigate(`/class/${nextAction.classId}/lessons`);
    } else if (nextAction?.classId) {
      navigate(`/class/${nextAction.classId}/lessons`);
    } else if (enrolledClassId) {
      navigate(`/class/${enrolledClassId}/lessons`);
    }
  };

  // 1b. Fetch Class Lessons
  const { data: classLessonsData } = useQuery({
    queryKey: ["class-timeline", enrolledClassId],
    queryFn: () => lessonsApi.getClassLessons(enrolledClassId!).catch(() => ({ success: false, data: null as any })),
    enabled: !!enrolledClassId,
    retry: false,
  });

  const classLessons = classLessonsData?.data?.lessons || [];
  const totalCourseLessons = classLessons.length > 0 ? classLessons.length : 27;

  // 2. Fetch Student Real Submissions
  const { data: submissionsData } = useQuery({
    queryKey: ["my-recent-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 50 }).catch(() => ({ data: [] })),
    enabled: !!user?.id,
    retry: false,
  });

  const userSubmissions = Array.isArray(submissionsData?.data) ? submissionsData.data : [];
  const submittedTasksCount = userSubmissions.filter((s: any) => s && (s.status === "graded" || s.status === "submitted")).length;
  const completedCount = Math.min(submittedTasksCount, totalCourseLessons);
  const activeClassName = workspaceViewModel?.classes?.[0]?.name || enrollments[0]?.courses?.title || "STARTER01 • 04.2026";
  const progressPercent = Math.min(100, Math.round((completedCount / totalCourseLessons) * 100));

  const isOverdue = dueTodayTasks.length > 0;
  const isDailyCompleted = workspaceState === "ACTIVE_STUDENT" && dueTodayTasks.length === 0 && !continueTask;

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* STATE: NO_ENROLLMENT, PENDING_ACTIVATION or SUSPENDED_STUDENT            */}
        {/* ========================================================================= */}
        {workspaceState !== "ACTIVE_STUDENT" ? (
          <HomeworkEmptyState state={workspaceState} />
        ) : (
          /* ========================================================================= */
          /* STATE: ACTIVE_STUDENT (STUDENT WORKSPACE CONTROL TOWER)                   */
          /* ========================================================================= */
          <>
            {/* 1. BRAND IDENTITY HEADER WITH PERSONAL TARGET MATRIX & PROGRESS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {activeClassName}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-600 border border-red-200">
                      MỤC TIÊU: BAND 6.0+
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Xin chào, {user?.fullName || "Daniel"} 👋
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" /> Có bài cần làm ngay!
                      </span>
                    ) : isDailyCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã hoàn thành nhiệm vụ hôm nay!
                      </span>
                    ) : null}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {isDailyCompleted
                      ? "Bạn đã xuất sắc hoàn thành tất cả bài tập về nhà hôm nay. Hãy sẵn sàng cho buổi học tiếp theo!"
                      : "Hoàn thành bài tập về nhà hôm nay để duy trì tiến độ học tập nhé."}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Tiến độ khóa học</span>
                    <span className="text-blue-600 text-sm font-extrabold">
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

              {/* HOMEWORK SUMMARY CARD (GÓC NHÌN HỌC VIÊN HMS: "CÒN BAO NHIÊU VIỆC?") */}
              <div className="md:col-span-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tình trạng Bài tập cá nhân</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-pulse" title="Live homework status" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Đã hoàn thành</span>
                    <div className="font-extrabold text-emerald-600 text-sm">{completedCount} bài</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Cần làm</span>
                    <div className="font-extrabold text-blue-600 text-sm">{dueTodayTasks.length + upcomingTasks.length} bài</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Chờ chấm</span>
                    <div className="font-extrabold text-amber-600 text-sm">
                      {userSubmissions.filter((s: any) => s.status === "submitted").length} bài
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase">Quá hạn</span>
                    <div className="font-extrabold text-red-600 text-sm">{dueTodayTasks.length} bài</div>
                  </div>
                </div>
                <Button
                  onClick={handleContinueLearning}
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-xl"
                >
                  Tiếp tục học ➔
                </Button>
              </div>
            </div>

            {/* 2. STATE D: COMPLETED SESSION BANNER OR HERO TASK CARD */}
            {isDailyCompleted ? (
              <Card className="border border-emerald-200 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl shadow-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:-translate-y-0.5 transition-transform duration-200">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white backdrop-blur-md">
                    🎉 Hoàn thành xuất sắc nhiệm vụ ngày hôm nay!
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                    Tất cả bài tập đã được hoàn thành 100%
                  </h2>
                  <p className="text-xs md:text-sm text-emerald-100">
                    Nghỉ ngơi thả lỏng tinh thần hoặc sẵn sàng cho Buổi học tiếp theo lúc 18:00 - 20:00.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold px-6 py-5 rounded-xl text-sm border-0 shadow-md"
                  onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
                >
                  Xem lộ trình 27 buổi ➔
                </Button>
              </Card>
            ) : (
              continueTask && <HomeworkContinueCard task={continueTask} />
            )}

            {/* 3. MAIN WORKSPACE GRID: LEFT (TIMELINE & TASKS) & RIGHT (STRICT PRIORITY TODAY'S FOCUS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LEFT 2 COLUMNS: TIMELINE & WORKSPACE TASKS */}
              <div className="md:col-span-2 space-y-6">
                
                {/* TIMELINE TRẠNG THÁI BUỔI HỌC (HOVER ZOOM INTERACTIVE ROADMAP) */}
                <Card className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
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
                            className={`flex-shrink-0 flex flex-col items-center justify-between w-14 h-16 rounded-xl p-2 transition-all duration-200 cursor-pointer border hover:scale-110 hover:shadow-md ${
                              isDone
                                ? "bg-blue-50/60 border-blue-200 text-blue-600"
                                : isCurrent
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 scale-105"
                                : "bg-slate-50 border-slate-100 text-slate-400"
                            }`}
                            title={`Buổi ${lessonNum}: ${isDone ? "Đã nộp bài" : isCurrent ? "Bài hiện tại" : "Chưa mở"}`}
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

              {/* RIGHT PANEL: STRICT PRIORITY ORDERED TODAY'S FOCUS CARD */}
              <div className="space-y-6">
                <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5 hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-red-600" />
                      Today's Focus
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-100">
                      STRICT PRIORITY
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* PRIORITY 1: DEADLINE ALERTS (HIGHEST WEIGHT) */}
                    {isOverdue && (
                      <div className="p-3.5 bg-red-50 rounded-xl border border-red-100 space-y-1">
                        <div className="font-bold text-red-900 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" /> PRIORITY 1: Cảnh báo nộp muộn
                        </div>
                        <p className="text-red-700">Bạn có bài tập sắp hết hạn. Hãy làm ngay để nhận điểm chữa từ giáo viên!</p>
                      </div>
                    )}

                    {/* PRIORITY 2: NEW TEACHER FEEDBACK */}
                    {gradedSubmissions.length > 0 && (
                      <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                        <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-emerald-600" /> PRIORITY 2: Feedback mới từ Giáo viên
                        </div>
                        <p className="text-emerald-700">
                          {gradedSubmissions[0]?.exams?.title || "Bài thi gần nhất"} đã được chấm Band {gradedSubmissions[0]?.total_score ?? "7.5"}.
                        </p>
                      </div>
                    )}

                    {/* PRIORITY 3: CENTER ANNOUNCEMENT */}
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5">
                        📢 PRIORITY 3: Lịch nghỉ lễ Quốc Khánh 2/9
                      </div>
                      <p className="text-blue-700">Trung tâm nghỉ từ 01/09 đến 03/09. Lịch học bù sẽ được cập nhật.</p>
                    </div>

                    {/* PRIORITY 4: NEXT CLASS SESSION */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        📅 PRIORITY 4: Buổi học tiếp theo
                      </div>
                      <div className="flex items-center justify-between font-extrabold text-slate-900 text-sm">
                        <span>Buổi {nextSessionLesson?.sessionNumber || 13}</span>
                        <span className="text-xs text-blue-600 font-bold">
                          {nextSessionLesson?.sessionDate
                            ? new Date(nextSessionLesson.sessionDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
                            : "15/08"}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> 18:00 - 20:00
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* 4. FEEDBACK MỚI NHẤT TỪ GIÁO VIÊN */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Feedback mới nhất từ Giáo viên
              </h3>
              <Card className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:-translate-y-0.5 transition-transform duration-200 space-y-3">
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
          </>
        {/* Student Hub Page Footer / Spacing */}
      </div>
    </div>
  );
}
