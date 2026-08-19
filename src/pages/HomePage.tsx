// Student Welcome & Class Entry Portal — P0 Fix: lifecycle state machine
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { HomeworkEmptyState } from "@/components/homework/HomeworkEmptyState";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// ─── Lifecycle-derived sub-views ─────────────────────────────────────────────

function LifecycleLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 rounded-2xl bg-muted" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function LifecycleErrorBanner({
  icon,
  title,
  message,
  onRetry,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 flex flex-col items-center justify-center gap-4 text-center min-h-[220px]">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
        {icon}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h2 className="text-base font-extrabold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Thử lại
      </Button>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state, enrollments, lifecycleError, retry } = useStudentLifecycle();

  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const enrolledClass = enrollments[selectedClassIndex] ?? enrollments[0];
  const enrolledClassId = enrolledClass?.classId;
  const activeClassName = enrolledClass?.className ?? "Lớp học cá nhân";
  const courseTitle = enrolledClass?.courseTitle ?? "IELTS";

  // KPI submissions — only load when ENROLLED
  const { data: submissionsData } = useQuery({
    queryKey: ["my-student-kpis", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 100 }).catch(() => ({ data: [] })),
    enabled: !!user?.id && state === "ENROLLED",
  });

  const userSubmissions = Array.isArray(submissionsData?.data) ? submissionsData.data : [];
  const submittedCount = userSubmissions.filter((s: any) =>
    ["submitted", "SUBMITTED", "graded", "GRADED"].includes(s.status)
  ).length;
  const gradedCount = userSubmissions.filter((s: any) =>
    ["graded", "GRADED"].includes(s.status)
  ).length;
  const pendingCount = userSubmissions.filter((s: any) =>
    ["submitted", "SUBMITTED"].includes(s.status)
  ).length;

  // ── State machine render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* LOADING */}
        {state === "LOADING" && <LifecycleLoadingSkeleton />}

        {/* NETWORK_ERROR
            INVARIANT: Must NEVER show HomeworkEmptyState or "Chưa có lớp học" */}
        {state === "NETWORK_ERROR" && (
          <LifecycleErrorBanner
            icon={<WifiOff className="h-6 w-6" />}
            title="Không thể kết nối tới máy chủ"
            message={
              lifecycleError?.message
                ? `Lỗi kết nối: ${lifecycleError.message}. Vui lòng kiểm tra kết nối mạng và thử lại.`
                : "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
            }
            onRetry={retry}
          />
        )}

        {/* API_ERROR (4xx / 5xx)
            INVARIANT: Must NEVER show HomeworkEmptyState or "Chưa có lớp học" */}
        {state === "API_ERROR" && (
          <LifecycleErrorBanner
            icon={<AlertCircle className="h-6 w-6" />}
            title="Không thể tải thông tin lớp học"
            message={
              lifecycleError?.httpStatus === 401
                ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
                : lifecycleError?.message
                ? `Lỗi máy chủ: ${lifecycleError.message}. Vui lòng thử lại sau.`
                : "Máy chủ gặp sự cố. Vui lòng thử lại sau."
            }
            onRetry={retry}
          />
        )}

        {/* PRE_ENROLLMENT
            INVARIANT: Only shown when Backend confirms 200 + data:[] */}
        {state === "PRE_ENROLLMENT" && (
          <HomeworkEmptyState state="NO_ENROLLMENT" />
        )}

        {/* ENROLLED — full student dashboard */}
        {state === "ENROLLED" && (
          <div className="space-y-6">
            {/* HERO WELCOME BANNER */}
            <Card className="border-0 text-primary-foreground rounded-2xl shadow-md p-6 md:p-8 bg-primary space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-semibold backdrop-blur-md">
                  <BookOpen className="w-4 h-4 text-white/70" />
                  <span>Đang chọn: {activeClassName}</span>
                </div>

                {/* Multi-Class Selector */}
                {enrollments.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <span className="text-xs text-white/80 font-medium mr-1 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> Lớp khác:
                    </span>
                    {enrollments.map((item, idx) => {
                      const isSelected = idx === selectedClassIndex;
                      return (
                        <Button
                          key={item.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClassIndex(idx)}
                          className={`h-7 text-xs rounded-full px-3 transition-all ${
                            isSelected
                              ? "bg-white text-primary font-bold shadow-xs"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          {item.className}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-w-3xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Xin chào, {user?.fullName || "Học viên"}!
                </h1>
                <p className="text-sm md:text-base text-primary-foreground/90 font-normal leading-relaxed">
                  Bạn đang truy cập lớp{" "}
                  <strong className="text-white font-semibold">{activeClassName}</strong>{" "}
                  ({courseTitle}). Chọn bài tập để làm và nhận nhận xét từ giáo viên!
                </p>
              </div>

              {enrolledClassId && (
                <div className="pt-1">
                  <Button
                    onClick={() => navigate(`/class/${enrolledClassId}/lessons`)}
                    className="rounded-xl bg-white text-primary hover:bg-white/95 font-bold px-6 py-5 shadow-sm active:scale-95 text-sm transition-all gap-2 border-0"
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Vào Lớp {activeClassName} để Làm Bài</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              )}
            </Card>

            {/* 3 KPI CARDS */}
            <div className="grid gap-3.5 sm:grid-cols-3">
              <Card className="p-3.5 md:p-4 space-y-1.5 bg-card border border-border/70 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Tổng bài đã nộp
                  </span>
                  <Badge variant="muted" className="text-[10px] font-mono font-normal">
                    submitted + graded
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">{submittedCount} bài</h3>
                <p className="text-[11px] text-muted-foreground">Đã gửi cho giáo viên</p>
              </Card>

              <Card className="p-3.5 md:p-4 space-y-1.5 bg-card border border-border/70 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-info" />
                    Bài đã nhận xét
                  </span>
                  <Badge variant="info" className="text-[10px] font-mono font-normal">
                    graded
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-info tracking-tight">{gradedCount} bài</h3>
                <p className="text-[11px] text-muted-foreground">Đã có điểm & feedback</p>
              </Card>

              <Card className="p-3.5 md:p-4 space-y-1.5 bg-card border border-border/70 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-warning" />
                    Bài chờ giáo viên chấm
                  </span>
                  <Badge variant="warning" className="text-[10px] font-mono font-normal">
                    pending
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-warning tracking-tight">{pendingCount} bài</h3>
                <p className="text-[11px] text-muted-foreground">Đang trong hàng đợi chấm</p>
              </Card>
            </div>

            {/* 5-STEP WORKFLOW */}
            <Card className="rounded-2xl border border-border/70 bg-card p-5 md:p-7 space-y-4 shadow-xs">
              <h2 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider text-center">
                Lộ Trình Học 5 Bước Chuẩn IELTS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                {[
                  { label: "1. Đăng nhập", done: true },
                  { label: "2. Xếp lớp", done: true },
                  { label: "3. Vào Lớp làm bài", current: true },
                  { label: "4. Làm & Nộp bài", done: false },
                  { label: "5. GV nhận xét", done: false },
                ].map(({ label, done, current }) => (
                  <div
                    key={label}
                    className={`p-3.5 rounded-xl text-center space-y-1.5 flex flex-col items-center justify-center ${
                      current
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : done
                        ? "bg-success/10 border border-success/20"
                        : "bg-muted/40 border border-border/40"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full font-bold text-xs inline-flex items-center justify-center ${
                        current
                          ? "bg-white text-primary"
                          : done
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done && !current ? <CheckCircle2 className="w-3.5 h-3.5" /> : label.charAt(0)}
                    </span>
                    <div
                      className={`font-semibold text-xs ${
                        current ? "" : done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
