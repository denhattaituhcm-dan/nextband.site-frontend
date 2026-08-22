import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonsApi, submissionsApi, examsApi } from "@/lib/api";
import {
  deriveCanonicalVisualStatus,
  formatDeadlineCountdown,
  deriveSubmissionTiming,
  CanonicalVisualStatus,
} from "@/lib/homeworkStatusHelper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import { useGatewayHealth } from "@/hooks/useGatewayHealth";
import { isValidUUID, classifyClassError } from "@/lib/classContext";
import {
  BookOpen,
  ArrowLeft,
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
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  WifiOff,
  Calendar,
} from "lucide-react";

export default function StudentLessonViewerPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { state: lifecycleState, resolveClass } = useStudentLifecycle();
  const { isHealthy: isGatewayHealthy, isWarmingUp: isGatewayWarmingUp, checkHealthNow } = useGatewayHealth();

  const handlePrefetchExam = (targetExamId?: string) => {
    if (!targetExamId) return;
    queryClient.prefetchQuery({
      queryKey: ["exam", targetExamId],
      queryFn: () => examsApi.getById(targetExamId),
      staleTime: 1000 * 60 * 5,
    });
  };

  const handleOpenExam = (targetExamId: string) => {
    const returnUrl = location.pathname;
    navigate(`/exam/${targetExamId}?returnUrl=${encodeURIComponent(returnUrl)}`, {
      state: {
        exitContext: {
          destination: returnUrl,
          source: "class_lessons",
          classId,
          examId: targetExamId,
        },
        returnUrl,
      },
    });
  };

  const {
    data: classLessonData,
    isLoading: isLessonsLoading,
    isError: isLessonsError,
    error: lessonsError,
    refetch: refetchLessons,
  } = useQuery({
    queryKey: ["class-lessons", classId],
    queryFn: () => lessonsApi.getClassLessons(classId || ""),
    enabled: !!classId && isValidUUID(classId),
    retry: 2,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: submissionsData,
    isLoading: isSubmissionsLoading,
  } = useQuery({
    queryKey: ["my-submissions", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 100 }),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = isLessonsLoading || isSubmissionsLoading;

  if (!classId || !isValidUUID(classId)) {
    return (
      <div className="container max-w-4xl py-12 px-4 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10 text-destructive max-w-md mx-auto space-y-2 border border-destructive/20">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h2 className="text-lg font-bold">Mã lớp học không hợp lệ</h2>
          <p className="text-xs text-muted-foreground">
            Đường dẫn không hợp lệ hoặc lớp học không tồn tại trên hệ thống.
          </p>
        </div>
        <Button onClick={() => navigate("/app")} variant="outline" className="font-bold rounded-xl">
          Quay lại Bàn làm việc
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4 space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-muted rounded-md w-1/3" />
            <div className="h-4 bg-muted rounded-md w-1/4" />
          </div>
        </div>
        <div className="h-36 bg-muted rounded-2xl" />
        <div className="space-y-3 pt-4">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (isLessonsError || !classLessonData?.data) {
    const errorDetails = classifyClassError(lessonsError);
    return (
      <div className="container max-w-md py-16 px-4 text-center space-y-6 mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs border border-destructive/20">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            {errorDetails.type === "AUTH_REQUIRED"
              ? "Yêu cầu đăng nhập lại"
              : errorDetails.type === "NETWORK_ERROR"
              ? "Không thể kết nối máy chủ"
              : "Không thể tải bài tập Lớp học"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {errorDetails.message}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button onClick={() => refetchLessons()} variant="default" className="font-bold rounded-xl gap-2">
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
          <Button onClick={() => navigate("/app")} variant="outline" className="font-bold rounded-xl">
            Về Trang Chính
          </Button>
        </div>
      </div>
    );
  }

  const classData = classLessonData.data;
  const lessons = classData.lessons || [];
  const userSubmissions = Array.isArray(submissionsData?.data) ? submissionsData.data : [];

  const sortedSubmissions = [...userSubmissions].sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || a.created_at || a.submittedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.created_at || b.submittedAt || 0).getTime();
    return timeB - timeA;
  });

  const submissionsMap: Record<string, any> = {};
  sortedSubmissions.forEach((s: any) => {
    const targetId = s.homework_id || s.homeworkId || s.exam_id || s.examId;
    if (targetId && !submissionsMap[targetId]) {
      submissionsMap[targetId] = s;
    }
  });

  const homeworkList = lessons.map((item: any, idx: number) => {
    const sub = submissionsMap[item.id] || item.submission;
    const deadline = item.homework?.deadline;
    const visualStatus = deriveCanonicalVisualStatus({
      submissionStatus: sub?.status,
      revisionRequired: sub?.revisionRequired,
      deadline,
    });
    const countdown = formatDeadlineCountdown(deadline);
    const submissionTiming = deriveSubmissionTiming(sub?.submittedAt || sub?.createdAt, deadline);

    return {
      id: item.id,
      examId: item.id,
      hwNum: String(idx + 1).padStart(2, "0"),
      title: item.title || `Homework ${String(idx + 1).padStart(2, "0")}`,
      description: item.description || `Bài tập buổi ${idx + 1}`,
      status: visualStatus,
      deadline,
      deadlineSource: item.homework?.deadlineSource,
      countdown,
      submissionTiming,
      resources: item.resources || [],
      submission: sub,
    };
  });

  const nextHomework = homeworkList.find((hw) => hw.status === "REVISION_REQUIRED" || hw.status === "OVERDUE" || hw.status === "UPCOMING" || hw.status === "IN_PROGRESS") || homeworkList[0];

  const overdueCount = homeworkList.filter((hw) => hw.status === "OVERDUE").length;
  const notStartedCount = homeworkList.filter((hw) => hw.status === "UPCOMING" || hw.status === "IN_PROGRESS").length;
  const submittedCount = homeworkList.filter((hw) => hw.status === "SUBMITTED").length;
  const reviewedCount = homeworkList.filter((hw) => hw.status === "GRADED").length;

  const getStatusBadge = (
    status: CanonicalVisualStatus,
    countdown?: { text: string; isOverdue: boolean } | null,
    timing?: { isLate: boolean; lateDays: number }
  ) => {
    switch (status) {
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 font-bold gap-1 animate-pulse">
            <AlertCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
            {countdown?.text || "Quá hạn nộp"}
          </Badge>
        );
      case "REVISION_REQUIRED":
        return (
          <Badge variant="destructive" className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold gap-1">
            <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            Cần sửa bài (Attempt 2)
          </Badge>
        );
      case "GRADED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {timing?.isLate ? `Đã hoàn thành (Trễ ${timing.lateDays} ngày)` : "Đã hoàn thành"}
          </Badge>
        );
      case "SUBMITTED":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            {timing?.isLate ? `Chờ phản hồi (Trễ ${timing.lateDays} ngày)` : "Chờ phản hồi"}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="info">
            <Edit3 className="h-3 w-3" />
            Đang làm
          </Badge>
        );
      case "UPCOMING":
      default:
        return countdown ? (
          <Badge variant="outline" className="font-mono text-muted-foreground gap-1">
            <Calendar className="h-3 w-3" />
            {countdown.text}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
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

        {/* CIRCUIT BREAKER / GATEWAY STATUS BANNER */}
        {isGatewayWarmingUp && (
          <div className="bg-warning/10 border border-warning/30 text-warning-foreground px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-warning/20 text-warning flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-foreground">Đang kết nối đến máy chủ phòng thi</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Dịch vụ phòng thi đang được chuẩn bị. Bạn vẫn có thể xem danh sách bài học, nhưng bắt đầu làm bài có thể cần đợi vài giây.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => checkHealthNow()}
              className="h-8 text-xs border-warning/40 hover:bg-warning/20 shrink-0 gap-1.5 font-semibold rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Kiểm tra lại
            </Button>
          </div>
        )}

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
                  onClick={() => handleOpenExam(nextHomework.examId || nextHomework.id)}
                  onMouseEnter={() => handlePrefetchExam(nextHomework.examId || nextHomework.id)}
                  onFocus={() => handlePrefetchExam(nextHomework.examId || nextHomework.id)}
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
              <FileText className="w-4 h-4 text-primary" />
            </div>

            <div className={`grid ${overdueCount > 0 ? "grid-cols-4" : "grid-cols-3"} gap-2 text-center`}>
              {overdueCount > 0 && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-300 dark:border-rose-800">
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">Quá hạn</span>
                  <div className="font-bold text-rose-700 dark:text-rose-400 text-base mt-0.5">{overdueCount}</div>
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground font-medium block">Chưa làm</span>
                <div className="font-bold text-foreground text-base mt-0.5">{notStartedCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-warning/5 border border-warning/20">
                <span className="text-[10px] text-warning font-semibold block">Đã nộp</span>
                <div className="font-bold text-warning text-base mt-0.5">{submittedCount}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-success/5 border border-success/20">
                <span className="text-[10px] text-success font-semibold block">Đã chấm</span>
                <div className="font-bold text-success text-base mt-0.5">{reviewedCount}</div>
              </div>
            </div>

            <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${overdueCount > 0 ? "bg-rose-500/10 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300" : "bg-primary-soft border border-primary/20 text-primary"}`}>
              {overdueCount > 0 ? (
                <span><strong>Lưu ý khẩn:</strong> Bạn có {overdueCount} bài tập đã quá hạn. Hãy làm bù ngay để kịp tiến độ lớp.</span>
              ) : (
                <span><strong>Gợi ý:</strong> Nộp bài tập sớm để nhận bài chấm chi tiết từ Giáo viên.</span>
              )}
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

          {homeworkList.length === 0 ? (
            <Card className="p-10 text-center space-y-4 border-dashed rounded-2xl bg-muted/20">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-bold text-base text-foreground">Lớp học chưa có bài tập nào được giao</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toàn bộ danh sách bài tập của khóa học sẽ hiển thị tại đây ngay khi giáo viên cập nhật bài tập mới.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/app")} className="rounded-xl font-bold">
                Quay lại Bàn làm việc
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {homeworkList.map((hw) => {
                const isOverdue = hw.status === "OVERDUE";
                const isRevision = hw.status === "REVISION_REQUIRED";

                return (
                  <Card
                    key={hw.id}
                    onMouseEnter={() => handlePrefetchExam(hw.examId || hw.id)}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isOverdue
                        ? "border-rose-300 dark:border-rose-800 bg-rose-500/5 hover:border-rose-500 shadow-xs"
                        : isRevision
                        ? "border-amber-300 dark:border-amber-800 bg-amber-500/5 hover:border-amber-500"
                        : "border-border bg-card hover:border-primary/40 hover:shadow-xs"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className={`font-bold text-sm ${isOverdue ? "text-rose-900 dark:text-rose-200" : "text-foreground"}`}>
                          {hw.title}
                        </h3>
                        {getStatusBadge(hw.status, hw.countdown, hw.submissionTiming)}
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
                        variant={hw.status === "GRADED" ? "outline" : "default"}
                        className={`font-bold text-xs gap-1.5 rounded-xl ${
                          isOverdue
                            ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                            : isRevision
                            ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                            : ""
                        }`}
                        onMouseEnter={() => handlePrefetchExam(hw.examId || hw.id)}
                        onFocus={() => handlePrefetchExam(hw.examId || hw.id)}
                        onClick={() => {
                          if (hw.submission?.id && (hw.status === "GRADED" || hw.status === "REVISION_REQUIRED")) {
                            navigate(`/submission/${hw.submission.id}`);
                          } else {
                            handleOpenExam(hw.examId || hw.id);
                          }
                        }}
                      >
                        {isOverdue
                          ? "🚨 Làm bù ngay"
                          : isRevision
                          ? "Làm bài sửa (Attempt 2)"
                          : hw.status === "GRADED"
                          ? "Xem phản hồi"
                          : hw.status === "SUBMITTED"
                          ? "Xem bài làm"
                          : "Làm bài ngay"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
