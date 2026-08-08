import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesApi, examsApi, submissionsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  // 1. Fetch Course Detail
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => coursesApi.getById(slug!),
    enabled: !!slug,
  });

  // 2. Fetch Exams in Course
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ["course-exams", course?.id || slug],
    queryFn: () =>
      examsApi.list({
        courseId: course?.id || slug,
        limit: 100,
      }),
    enabled: !!course?.id || !!slug,
  });

  // 3. Fetch Submissions for Progress & Status
  const { data: submissionsData } = useQuery({
    queryKey: ["my-submissions-course", user?.id],
    queryFn: () => submissionsApi.list({ limit: 100, studentId: user?.id }),
    enabled: !!user?.id,
  });

  const exams = examsData?.data || [];
  const submissions = submissionsData?.data || [];

  // Map submissions by examId
  const submissionMap = new Map();
  submissions.forEach((sub: any) => {
    submissionMap.set(sub.exam_id, sub);
  });

  // Separate exams into Completed, Current, and Upcoming
  const completedExams: any[] = [];
  let currentExam: any = null;
  const upcomingExams: any[] = [];

  exams.forEach((exam: any) => {
    const sub = submissionMap.get(exam.id);
    if (sub && (sub.status === "graded" || sub.status === "submitted")) {
      completedExams.push({ ...exam, submission: sub });
    } else if (!currentExam) {
      currentExam = { ...exam, submission: sub };
    } else {
      upcomingExams.push(exam);
    }
  });

  if (!currentExam && upcomingExams.length > 0) {
    currentExam = upcomingExams.shift();
  }

  const totalExams = exams.length || 27;
  const completedCount = completedExams.length;
  const progressPercent = Math.round((completedCount / totalExams) * 100);

  if (courseLoading || examsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-500 font-medium animate-pulse">
          Đang tải thông tin khóa học...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {/* COURSE HEADER & JOURNEY DOTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {course?.level || "IELTS Course"}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {course?.title || "Khóa học Dreamer"}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                {progressPercent}%
              </span>
              <div className="text-xs text-slate-500 font-medium">
                {completedCount}/{totalExams} Bài hoàn thành
              </div>
            </div>
          </div>

          {/* 27 JOURNEY DOTS */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Hành trình học tập (Lesson Journey)</span>
              <span>Buổi học tiếp theo: Lesson {completedCount + 1}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {Array.from({ length: totalExams }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-3 rounded-full transition-all ${
                    idx < completedCount
                      ? "w-3 bg-emerald-500 shadow-sm shadow-emerald-500/50"
                      : idx === completedCount
                      ? "w-6 bg-emerald-600 ring-4 ring-emerald-100 animate-pulse"
                      : "w-3 bg-slate-200"
                  }`}
                  title={`Lesson ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 1: CURRENT LESSON HERO (LESSON-CENTRIC ARCHITECTURE) */}
        {currentExam ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-wider font-bold">
              <span>🎯 Bài học hiện tại cần hoàn thành (Current Lesson)</span>
              <span className="text-emerald-600">Predictive: Completing this hits {Math.min(100, Math.round(((completedCount + 1) / totalExams) * 100))}%</span>
            </div>

            <Card className="border-emerald-200 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-2xl shadow-xl overflow-hidden relative">
              <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
              <CardContent className="p-6 md:p-8 space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    Lesson {completedCount + 1} of {totalExams}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {currentExam.duration_minutes || 60} phút
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                    {currentExam.title}
                  </h2>
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {currentExam.description || "Bài tập về nhà rèn luyện kỹ năng IELTS theo buổi học tại trung tâm."}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Nhiệm vụ: Hoàn thành bài tập để duy trì tiến độ lớp học
                  </div>
                  <Link
                    to={`/exam/${currentExam.id}?returnUrl=${encodeURIComponent(location.pathname)}`}
                    state={{
                      exitContext: {
                        destination: location.pathname,
                        source: "course_detail",
                        courseId: id,
                      },
                      returnUrl: location.pathname,
                    }}
                  >
                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                      <Play className="w-4 h-4 fill-slate-950" />
                      {currentExam.submission?.status === "in_progress"
                        ? "Tiếp tục làm bài (Resume)"
                        : "Bắt đầu làm bài (Start Lesson)"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-emerald-50 border-emerald-200 rounded-2xl p-6 text-center space-y-2">
            <h3 className="font-bold text-emerald-900 text-lg">Bạn đã hoàn thành tất cả bài tập trong khóa học này! 🎉</h3>
            <p className="text-xs text-emerald-700">Hãy xem lại lịch sử các bài đã làm bên dưới để tiếp tục ôn luyện.</p>
          </Card>
        )}

        {/* SECTION 2: COMPLETED LESSONS (ACCORDION THU GỌN) */}
        {completedExams.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bài học đã hoàn thành ({completedExams.length})
            </h3>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="completed" className="border-none">
                <AccordionTrigger className="bg-white hover:bg-slate-50 px-5 py-4 rounded-2xl border border-slate-200/80 font-bold text-sm text-slate-800 shadow-sm no-underline hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Xem danh sách {completedExams.length} bài đã làm</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-3 space-y-2">
                  {completedExams.map((item: any, idx: number) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center justify-between text-xs shadow-sm hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.title}
                          </div>
                          <div className="text-slate-500 text-xs">
                            Status: <span className="font-semibold text-emerald-600 uppercase">{item.submission?.status}</span>
                            {item.submission?.total_score !== null && ` • Score: ${item.submission.total_score} pts`}
                          </div>
                        </div>
                      </div>
                      <Link to={`/submission/${item.submission?.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                          Xem bài làm
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* SECTION 3: UPCOMING LESSONS (BÀI HỌC SẮP TỚI - KHÓA) */}
        {upcomingExams.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bài học sắp tới ({upcomingExams.length})
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-sm overflow-hidden opacity-75">
              {upcomingExams.slice(0, 5).map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-50/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="font-semibold text-slate-700 text-sm">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        Sẽ mở sau buổi học tiếp theo trên lớp
                      </div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                    Chưa mở
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
