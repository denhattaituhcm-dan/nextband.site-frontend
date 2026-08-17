// Student Class Practice Workspace - Course-Driven Action Hub
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { lessonsApi, submissionsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Headphones,
  FileText,
  Mic,
  HelpCircle,
  Edit3,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  Clock,
  Circle,
} from "lucide-react";

export default function StudentLessonViewerPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleOpenExam = (hwId: string) => {
    const returnUrl = location.pathname;
    navigate(`/exam/${hwId}?returnUrl=${encodeURIComponent(returnUrl)}`, {
      state: {
        exitContext: {
          destination: returnUrl,
          source: "class_homework",
          classId,
        },
        returnUrl,
      },
    });
  };

  const { data: classLessonData, isLoading, error } = useQuery({
    queryKey: ["class-lessons", classId],
    queryFn: () => lessonsApi.getClassLessons(classId!),
    enabled: !!classId,
  });

  const { data: submissionsData } = useQuery({
    queryKey: ["my-recent-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 100 }).catch(() => ({ data: [] })),
    enabled: !!user?.id,
  });

  const classData = classLessonData?.data;
  const lessons = classData?.lessons || [];
  const userSubmissions = Array.isArray(submissionsData?.data) ? submissionsData.data : [];

  // Sort submissions by createdAt DESC (latest attempt ordering)
  const sortedSubmissions = [...userSubmissions].sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || a.created_at || a.submittedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.created_at || b.submittedAt || 0).getTime();
    return timeB - timeA;
  });

  // Map latest submission per homework/exam
  const submissionsMap: Record<string, any> = {};
  sortedSubmissions.forEach((s: any) => {
    const targetId = s.homework_id || s.homeworkId || s.exam_id || s.examId;
    if (targetId && !submissionsMap[targetId]) {
      submissionsMap[targetId] = s;
    }
  });

  // Homework items formatted for Practice Platform
  const homeworkList = lessons.map((item: any, idx: number) => {
    const sub = submissionsMap[item.id] || item.submission;
    let status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" = "NOT_STARTED";

    // Sole Source of Truth: submission.status
    if (sub?.status === "graded" || sub?.status === "GRADED" || sub?.grade_status === "graded") {
      status = "REVIEWED";
    } else if (sub?.status === "submitted" || sub?.status === "SUBMITTED") {
      status = "SUBMITTED";
    } else if (sub?.status === "in_progress" || sub?.status === "IN_PROGRESS") {
      status = "IN_PROGRESS";
    }

    return {
      id: item.id,
      hwNum: String(idx + 1).padStart(2, "0"),
      title: item.title || `Homework ${String(idx + 1).padStart(2, "0")}`,
      description: item.description || `Bài tập buổi ${idx + 1}`,
      status,
      resources: item.resources || [],
      submission: sub,
    };
  });

  const nextHomework = homeworkList.find((hw) => hw.status === "NOT_STARTED" || hw.status === "IN_PROGRESS") || homeworkList[0];

  const notStartedCount = homeworkList.filter((hw) => hw.status === "NOT_STARTED").length;
  const submittedCount = homeworkList.filter((hw) => hw.status === "SUBMITTED").length;
  const reviewedCount = homeworkList.filter((hw) => hw.status === "REVIEWED").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REVIEWED":
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            Đã nhận xét
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3" />
            Chờ phản hồi
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="info">
            <Edit3 className="h-3 w-3" />
            Đang làm
          </Badge>
        );
      default:
        return (
          <Badge variant="muted">
            <Circle className="h-3 w-3" />
            Chưa làm
          </Badge>
        );
    }
  };

  const getSkillIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "listening":
        return <Headphones className="h-3.5 w-3.5 text-listening" />;
      case "reading":
        return <BookOpen className="h-3.5 w-3.5 text-reading" />;
      case "writing":
        return <FileText className="h-3.5 w-3.5 text-writing" />;
      case "speaking":
        return <Mic className="h-3.5 w-3.5 text-speaking" />;
      default:
        return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Đang tải danh sách Bài tập Lớp học...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Không thể tải bài tập Lớp học</h2>
        <p className="text-sm text-muted-foreground">{(error as any)?.message || "Bạn không có quyền truy cập lớp học này."}</p>
        <Button onClick={() => navigate("/app")} variant="outline">
          Quay lại Trang Welcome
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* HEADER & BACK TO WELCOME */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app")} className="rounded-full">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary border border-primary/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  Không Gian Lớp Học
                </span>
                {classData.courseTitle && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Khóa {classData.courseTitle}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex flex-wrap items-center gap-2">
                <span>Lớp {classData.className}</span>
              </h1>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate("/app")} className="text-xs font-semibold rounded-xl">
            Về Sảnh Chính
          </Button>
        </div>

        {/* HERO PRACTICE BANNER FOR THIS CLASS (L1 Hero Layer) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 bg-primary text-primary-foreground p-6 md:p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Sẵn sàng làm bài hôm nay
              </h2>
              <p className="text-xs md:text-sm text-primary-foreground/90 mt-1">
                Toàn bộ {homeworkList.length} bài tập của khóa học đã sẵn sàng. Hãy chọn bài tập để thực hành ngay.
              </p>
            </div>

            {nextHomework && (
              <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/80">
                    Bài tập cần làm tiếp theo:
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                    {nextHomework.title}
                    {getStatusBadge(nextHomework.status)}
                  </h3>
                </div>

                <Button
                  onClick={() => handleOpenExam(nextHomework.id)}
                  className="bg-white text-primary hover:bg-white/95 font-bold px-6 py-2.5 rounded-xl text-xs shadow-xs shrink-0"
                >
                  <span>Làm bài ngay</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            )}
          </div>

          {/* SIDEBAR KPI SUMMARY */}
          <div className="md:col-span-4 bg-card p-5 md:p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tình trạng Bài tập cá nhân
              </h3>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground font-medium block">Chưa làm</span>
                <div className="font-bold text-foreground text-base mt-1">{notStartedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                <span className="text-[10px] text-warning font-semibold block">Đã nộp</span>
                <div className="font-bold text-warning text-base mt-1">{submittedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-success/5 border border-success/20">
                <span className="text-[10px] text-success font-semibold block">Đã chấm</span>
                <div className="font-bold text-success text-base mt-1">{reviewedCount}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary-soft border border-primary/20 text-xs text-primary font-medium leading-relaxed">
              <strong>Gợi ý:</strong> Nộp bài tập sớm để nhận bài chấm chi tiết từ Giáo viên.
            </div>
          </div>
        </div>

        {/* MAIN PRACTICE LIST SECTION (L2 Section Layer) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" />
                Danh sách Bài tập Luyện tập ({homeworkList.length} Bài)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chọn bài tập bất kỳ để vào màn hình thực hành kỹ năng.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {homeworkList.map((hw) => (
              <Card
                key={hw.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-sm text-foreground">{hw.title}</h3>
                    {getStatusBadge(hw.status)}
                  </div>

                  {hw.resources && hw.resources.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Hoạt động:</span>
                      {hw.resources.map((res: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold bg-muted text-foreground px-2 py-0.5 rounded-md"
                        >
                          {getSkillIcon(res.type)}
                          {res.type?.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{hw.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={hw.status === "REVIEWED" ? "outline" : "default"}
                    className="font-bold text-xs gap-1.5"
                    onClick={() => handleOpenExam(hw.id)}
                  >
                    {hw.status === "REVIEWED"
                      ? "Xem phản hồi"
                      : hw.status === "SUBMITTED"
                      ? "Xem bài làm"
                      : "Làm bài ngay"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
