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
  MessageSquare,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // 0. Fetch Projection Workspace Data from Backend DTO
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

  // 2. Fetch Courses list
  const { data: coursesData } = useQuery({
    queryKey: ["courses-home"],
    queryFn: () => coursesApi.list({ limit: 6 }),
  });

  const hasClasses = enrollments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-8">
        {/* GREETING HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Xin chào {user?.fullName || "DAN"} - NextBand V2.0 Workspaces 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAuthenticated
                ? "Hệ điều hành bài tập dành cho trung tâm IELTS."
                : "Đăng nhập để xem bài tập của bạn."}
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border shadow-sm text-xs text-slate-600">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Current Target: <strong>Band 6.5</strong></span>
            </div>
          )}
        </div>

        {/* LEVEL 1: HERO WORKSPACE MODULAR COMPONENTS */}
        {continueTask ? (
          <HomeworkContinueCard task={continueTask} />
        ) : (
          <HomeworkEmptyState
            hasClasses={hasClasses}
            onJoinClick={() => setJoinModalOpen(true)}
          />
        )}

        {/* WORKSPACE SECTIONS LISTS */}
        <div className="space-y-6">
          <HomeworkList title="Due Today (Hạn hôm nay)" tasks={dueTodayTasks} />
          <HomeworkList title="Upcoming (Sắp tới)" tasks={upcomingTasks} />
          <HomeworkList title="Completed (Đã làm & Đã chấm)" tasks={completedTasks} variant="completed" />
        </div>

        {/* Modal Onboarding Join Class */}
        <JoinClassModal
          open={joinModalOpen}
          onOpenChange={setJoinModalOpen}
          onSuccess={() => refetchWorkspace()}
        />

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
            {(enrollments.length > 0 ? enrollments : coursesData?.data || []).slice(0, 2).map((item: any, idx: number) => {
              const course = item.courses || item;
              const completedLessons = idx === 0 ? 14 : 2;
              const totalLessons = 27;

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
