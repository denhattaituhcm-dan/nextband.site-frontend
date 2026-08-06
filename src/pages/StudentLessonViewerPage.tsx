import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lessonsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonResourceItem } from "@/components/lesson/LessonResourceItem";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export default function StudentLessonViewerPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const { data: classLessonData, isLoading, error } = useQuery({
    queryKey: ["class-lessons", classId],
    queryFn: () => lessonsApi.getClassLessons(classId!),
    enabled: !!classId,
  });

  const classData = classLessonData?.data;
  const lessons = classData?.lessons || [];
  const progress = classData?.progress;

  // Selected active lesson for Detail view
  const activeLesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0] || null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Đang tải bài học và lộ trình Lớp học...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">Không thể tải bài học</h2>
        <p className="text-sm text-slate-500">{(error as any)?.message || "Bạn không có quyền truy cập lớp học này."}</p>
        <Button onClick={() => navigate("/")} variant="outline">
          Quay lại Trang chủ
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* HEADER & BACK BUTTON */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{classData.className}</Badge>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">{classData.courseTitle}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Lộ trình Buổi học & Tài liệu</h1>
          </div>
        </div>

        {/* PROGRESS OVERVIEW BAR */}
        {progress && (
          <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Tiến độ học tập
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Đã hoàn thành {progress.completedLessons} / {progress.totalLessons} bài học
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-600">{progress.percentage}%</div>
                </div>
                <div className="w-36 bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TWO-COLUMN LAYOUT: LESSON LIST & LESSON DETAIL */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* LEFT: LESSON LIST */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Danh sách Buổi học ({lessons.length})
            </h3>

            <div className="space-y-2">
              {lessons.map((lesson, idx) => {
                const isSelected = activeLesson?.id === lesson.id;
                const isCompleted = lesson.status === "COMPLETED";

                return (
                  <Card
                    key={lesson.id}
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`cursor-pointer rounded-xl border transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : isSelected
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : lesson.week || idx + 1}
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                            {lesson.title}
                          </h4>
                          {lesson.estimatedMinutes && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {lesson.estimatedMinutes} phút
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 ${
                          isSelected ? "text-emerald-600" : "text-slate-300"
                        }`}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* RIGHT: LESSON DETAIL & RESOURCES VIEWER */}
          <div className="md:col-span-7">
            {activeLesson ? (
              <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-sm space-y-6 sticky top-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">Buổi {activeLesson.lessonOrder}</Badge>
                    {activeLesson.sessionDate && (
                      <span className="text-xs text-slate-400">
                        Ngày học: {new Date(activeLesson.sessionDate).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{activeLesson.title}</h2>
                  {activeLesson.description && (
                    <p className="text-sm text-slate-500 mt-2">{activeLesson.description}</p>
                  )}
                </div>

                {/* RESOURCE FILES LIST */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    Tài liệu bài giảng ({activeLesson.resources.length})
                  </h4>

                  {activeLesson.resources.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">Chưa có tài liệu đính kèm cho bài học này.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeLesson.resources.map((res) => (
                        <LessonResourceItem key={res.id} resource={res} />
                      ))}
                    </div>
                  )}
                </div>

                {/* HOMEWORK ATTACHED & DO EXERCISE BUTTON */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Thực hành bài tập
                  </h4>

                  <Card className="rounded-xl border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-slate-900">{activeLesson.title}</h5>
                      <span className="text-xs text-slate-500">
                        {activeLesson.resources?.length || 0} Hoạt động luyện tập (Checklist)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={() => navigate(`/exam/${activeLesson.id}`)}
                    >
                      {activeLesson.status === "COMPLETED" ? "Xem kết quả" : "✍️ Làm bài ngay"}
                    </Button>
                  </Card>
                </div>
              </Card>
            ) : (
              <Card className="rounded-2xl border-slate-200 bg-white p-12 text-center text-slate-400">
                Chọn một bài học từ danh sách để xem chi tiết tài liệu.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
