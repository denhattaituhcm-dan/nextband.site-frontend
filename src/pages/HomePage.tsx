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

  // 2. Fetch Student Real Submissions
  const { data: submissionsData } = useQuery({
    queryKey: ["my-recent-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 50 }),
    enabled: !!user?.id,
  });

  const userSubmissions = submissionsData?.data || [];
  const gradedOrSubmitted = userSubmissions.filter((s: any) => s.status === "graded" || s.status === "submitted");

  // 3. Fetch Courses list
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
              Xin chào {user?.fullName || user?.email?.split("@")[0] || "Học viên"} 👋
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
              <span>Mục tiêu: <strong>IELTS Band 6.5</strong></span>
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
                  Tiến độ mục tiêu (Band Goal)
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Đã làm</div>
                  <div className="text-3xl font-extrabold text-slate-900">{gradedOrSubmitted.length} Bài</div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300" />
                <div className="text-right">
                  <div className="text-xs text-slate-500">Mục tiêu</div>
                  <div className="text-3xl font-extrabold text-emerald-600">Band 6.5</div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, gradedOrSubmitted.length * 5))}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* NOTIFICATIONS WIDGET */}
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all col-span-1 md:col-span-2">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between text-slate-600 border-b pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Thông báo (Notifications)
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {gradedOrSubmitted.length > 0 ? `${gradedOrSubmitted.length} Bài đã nộp` : "Chưa có thông báo mới"}
                </span>
              </div>
              <div className="space-y-2">
                {gradedOrSubmitted.length > 0 ? (
                  gradedOrSubmitted.slice(0, 2).map((sub: any) => (
                    <div key={sub.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900">
                          {sub.status === "graded" ? "Bài thi đã được chấm điểm" : "Bài thi đã nộp thành công"}
                        </span>
                        <p className="text-slate-500 mt-0.5">
                          {sub.exams?.title || "Bài thi IELTS"} — {sub.status === "graded" ? `Điểm số: ${sub.total_score ?? 'N/A'}` : "Đang chờ giáo viên chấm."}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-2">
                    Bạn chưa có thông báo mới. Hãy tham gia lớp học hoặc làm bài thi để xem phản hồi từ giáo viên.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LEVEL 3: JOURNEY COURSES (REAL DYNAMIC DOTS MAP) */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(enrollments.length > 0 ? enrollments : coursesData?.data || []).slice(0, 6).map((item: any) => {
              const course = item.courses || item;
              const totalLessons = 27; // Tiêu chuẩn 27 ngày học IELTS

              // Tính số bài thật học viên đã nộp trong khóa này
              const completedCount = userSubmissions.filter((sub: any) =>
                sub.exams?.course_id === course.id && (sub.status === "submitted" || sub.status === "graded")
              ).length;

              return (
                <Card key={course.id} className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-5 space-y-4 hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{course.title}</h3>
                      <span className="text-xs text-slate-500">
                        {completedCount}/{totalLessons} Bài học hoàn thành
                      </span>
                    </div>
                    <Link to={`/course/${course.slug || course.id}`}>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">
                        Chi tiết ➔
                      </Button>
                    </Link>
                  </div>

                  {/* 27 JOURNEY DOTS DỰA TRÊN DỮ LIỆU THẬT */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {Array.from({ length: totalLessons }).map((_, dIdx) => (
                      <span
                        key={dIdx}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          dIdx < completedCount
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

        {/* RECENT ACTIVITY (DỮ LIỆU THẬT) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Lịch sử làm bài gần đây (Recent Activity)
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 text-xs">
            {gradedOrSubmitted.length > 0 ? (
              gradedOrSubmitted.slice(0, 5).map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {sub.exams?.title || "Bài thi IELTS"} — {sub.status === "graded" ? `Đã chấm (Điểm: ${sub.total_score ?? 'N/A'})` : "Đã nộp bài"}
                  </span>
                  <span className="text-slate-400">
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("vi-VN") : "Gần đây"}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 py-2 text-center">
                Chưa có lịch sử nộp bài. Chọn một khóa học để bắt đầu làm bài luyện tập!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
