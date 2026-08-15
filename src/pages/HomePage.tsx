// Student Welcome & Class Entry Portal - Multi-Class Support & KPI Metrics
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { submissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { HomeworkEmptyState } from "@/components/homework/HomeworkEmptyState";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrollments } = useStudentLifecycle();

  const enrollmentsList = Array.isArray(enrollments) ? enrollments : [];
  const hasClasses = enrollmentsList.length > 0;
  
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const enrolledClass = enrollmentsList[selectedClassIndex] || enrollmentsList[0];
  const enrolledClassId = enrolledClass?.classId || enrolledClass?.class_id || enrolledClass?.id;
  const activeClassName = enrolledClass?.className || enrolledClass?.name || enrolledClass?.courses?.title || "Lớp học cá nhân";
  const courseTitle = enrolledClass?.courseTitle || enrolledClass?.courses?.title || enrolledClass?.target_band ? `Target Band ${enrolledClass.target_band}` : "IELTS Master";

  // Query submissions for authentic KPI statistics
  const { data: submissionsData } = useQuery({
    queryKey: ["my-student-kpis", user?.id],
    queryFn: () => submissionsApi.list({ studentId: user?.id, limit: 100 }).catch(() => ({ data: [] })),
    enabled: !!user?.id,
  });

  const userSubmissions = Array.isArray(submissionsData?.data) ? submissionsData.data : [];
  
  // Scoped semantics
  const submittedCount = userSubmissions.filter((s: any) => s.status === "submitted" || s.status === "SUBMITTED" || s.status === "graded" || s.status === "GRADED").length;
  const gradedCount = userSubmissions.filter((s: any) => s.status === "graded" || s.status === "GRADED").length;
  const pendingCount = userSubmissions.filter((s: any) => s.status === "submitted" || s.status === "SUBMITTED").length;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {!hasClasses ? (
          <HomeworkEmptyState state="NO_ENROLLMENT" />
        ) : (
          <div className="space-y-6">
            {/* HERO WELCOME BANNER (L1 Prominent Hero Layer) */}
            <Card className="border-0 text-primary-foreground rounded-2xl shadow-md p-6 md:p-8 bg-primary space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-white/70" />
                  <span>Đang chọn: {activeClassName}</span>
                </div>

                {/* Multi-Class Selector Chips */}
                {enrollmentsList.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <span className="text-xs text-white/80 font-medium mr-1 flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" /> Lớp khác:
                    </span>
                    {enrollmentsList.map((item: any, idx: number) => {
                      const name = item.className || item.name || `Lớp ${idx + 1}`;
                      const isSelected = idx === selectedClassIndex;
                      return (
                        <Button
                          key={item.id || idx}
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClassIndex(idx)}
                          className={`h-7 text-xs rounded-full px-3 transition-all ${
                            isSelected
                              ? "bg-white text-primary font-bold shadow-xs"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          {name}
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
                  Bạn đang truy cập lớp <strong className="text-white font-semibold">{activeClassName}</strong> ({courseTitle}). Chọn bài tập để làm và nhận nhận xét từ giáo viên!
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

            {/* 3 STUDENT KPI CARDS (L3 Metric Supporting Layer) */}
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
                <p className="text-[11px] text-muted-foreground">Đã có điểm &amp; feedback</p>
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

            {/* 5-STEP WORKFLOW GUIDELINE (L2 Section / Step Guidance) */}
            <Card className="rounded-2xl border border-border/70 bg-card p-5 md:p-7 space-y-4 shadow-xs">
              <h2 className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wider text-center">
                Lộ Trình Học 5 Bước Chuẩn IELTS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 text-center space-y-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success font-bold text-xs inline-flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <div className="font-semibold text-xs text-foreground">1. Đăng nhập</div>
                </div>
                <div className="p-3.5 rounded-xl bg-success/10 border border-success/20 text-center space-y-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-success/20 text-success font-bold text-xs inline-flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  <div className="font-semibold text-xs text-foreground">2. Xếp lớp</div>
                </div>
                <div className="p-3.5 rounded-xl bg-primary text-primary-foreground shadow-xs text-center space-y-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-white text-primary font-bold text-xs inline-flex items-center justify-center">3</span>
                  <div className="font-bold text-xs">3. Vào Lớp làm bài</div>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground font-semibold text-xs inline-flex items-center justify-center">4</span>
                  <div className="font-medium text-xs text-muted-foreground">4. Làm &amp; Nộp bài</div>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40 text-center space-y-1.5 flex flex-col items-center justify-center">
                  <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground font-semibold text-xs inline-flex items-center justify-center">5</span>
                  <div className="font-medium text-xs text-muted-foreground">5. GV nhận xét</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

