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
            {/* HERO WELCOME BANNER */}
            <Card className="border-0 text-primary-foreground rounded-2xl shadow-lg p-6 md:p-8 bg-gradient-to-r from-primary via-primary/95 to-teal-700 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-bold backdrop-blur-md">
                  <Sparkles className="w-4 h-4 text-teal-200" />
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
                              ? "bg-white text-primary font-bold shadow-2xs"
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
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Xin chào, {user?.fullName || "Học viên"}!
                </h1>
                <p className="text-xs md:text-sm text-primary-foreground/90 font-medium leading-relaxed">
                  Bạn đang truy cập lớp <strong className="text-white font-bold">{activeClassName}</strong> ({courseTitle}). Chọn bài tập để làm và nhận nhận xét từ giáo viên!
                </p>
              </div>

              {enrolledClassId && (
                <div className="pt-2">
                  <Button
                    onClick={() => navigate(`/class/${enrolledClassId}/lessons`)}
                    className="rounded-xl bg-white text-primary hover:bg-white/90 font-extrabold px-6 py-5 shadow-md active:scale-95 text-sm transition-all gap-2 border-0"
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Vào Lớp {activeClassName} để Làm Bài</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              )}
            </Card>

            {/* 3 STUDENT KPI CARDS (Real CSDL Semantics) */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4 space-y-1 bg-card border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Tổng bài đã nộp
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    submitted + graded
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-foreground">{submittedCount} bài</h3>
                <p className="text-[11px] text-muted-foreground">Đã gửi cho giáo viên</p>
              </Card>

              <Card className="p-4 space-y-1 bg-card border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-blue-600" />
                    Bài đã nhận xét
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono text-blue-600 border-blue-200">
                    graded
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-blue-600">{gradedCount} bài</h3>
                <p className="text-[11px] text-muted-foreground">Đã có điểm & feedback</p>
              </Card>

              <Card className="p-4 space-y-1 bg-card border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600" />
                    Bài chờ giáo viên chấm
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono text-amber-600 border-amber-200">
                    pending
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-amber-600">{pendingCount} bài</h3>
                <p className="text-[11px] text-muted-foreground">Đang trong hàng đợi chấm</p>
              </Card>
            </div>

            {/* 5-STEP WORKFLOW GUIDELINE */}
            <Card className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-xs">
              <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider text-center">
                Lộ Trình Học 5 Bước Chuẩn IELTS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold text-xs inline-flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div className="font-bold text-xs text-foreground">1. Đăng nhập</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 font-extrabold text-xs inline-flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div className="font-bold text-xs text-foreground">2. Giáo viên xếp lớp</div>
                </div>
                <div className="p-4 rounded-xl bg-primary text-primary-foreground shadow-sm text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-white text-primary font-extrabold text-xs inline-flex items-center justify-center">3</span>
                  <div className="font-bold text-xs">3. Vào Lớp làm bài</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-muted text-muted-foreground font-extrabold text-xs inline-flex items-center justify-center">4</span>
                  <div className="font-bold text-xs text-foreground">4. Làm & Nộp bài</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border/60 text-center space-y-2 flex flex-col items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-muted text-muted-foreground font-extrabold text-xs inline-flex items-center justify-center">5</span>
                  <div className="font-bold text-xs text-foreground">5. Giáo viên nhận xét</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
