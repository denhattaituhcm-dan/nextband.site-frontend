// Student Welcome & Class Entry Portal
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { HomeworkEmptyState } from "@/components/homework/HomeworkEmptyState";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrollments } = useStudentLifecycle();

  const hasClasses = Array.isArray(enrollments) && enrollments.length > 0;
  const enrolledClass = enrollments[0];
  const enrolledClassId = enrolledClass?.classId || enrolledClass?.class_id;
  const activeClassName = enrolledClass?.className || enrolledClass?.courses?.title || "Lớp học cá nhân";
  const courseTitle = enrolledClass?.courseTitle || enrolledClass?.courses?.title || "IELTS Master";

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {!hasClasses ? (
          <HomeworkEmptyState state="NO_ENROLLMENT" />
        ) : (
          <div className="space-y-6">
            {/* HERO WELCOME BANNER - Single Action Focus */}
            <Card className="border-0 text-primary-foreground rounded-2xl shadow-lg p-6 md:p-8 bg-gradient-to-r from-primary via-primary/95 to-teal-700 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white border border-white/20 text-xs font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span>Mã Lớp: {activeClassName}</span>
              </div>
              
              <div className="space-y-2 max-w-3xl">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Xin chào, {user?.fullName || "Học viên"}! Sẵn sàng luyện tập hôm nay 🎉
                </h1>
                <p className="text-xs md:text-sm text-primary-foreground/90 font-medium leading-relaxed">
                  Bạn hiện là học viên của lớp <strong className="text-white font-bold">{activeClassName}</strong> ({courseTitle}). Truy cập vào lớp để bắt đầu làm bài tập ngay!
                </p>
              </div>

              {enrolledClassId && (
                <div className="pt-2">
                  <Button
                    onClick={() => navigate(`/class/${enrolledClassId}/lessons`)}
                    className="rounded-xl bg-white text-primary hover:bg-white/90 font-extrabold px-6 py-5 shadow-md active:scale-95 text-sm transition-all gap-2 border-0"
                  >
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>🏫 Vào Lớp {activeClassName} để Làm Bài</span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              )}
            </Card>

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
