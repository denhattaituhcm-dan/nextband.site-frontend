import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  FileQuestion,
  Wrench,
  BookOpen,
  Send,
} from "lucide-react";
import { ContractViolation, ContentLifecycleStatus } from "@/lib/contentContract";

interface ActorAwareUnavailableScreenProps {
  examTitle?: string;
  courseId?: string;
  userRole?: string;
  status?: ContentLifecycleStatus;
  violations?: ContractViolation[];
}

export function ActorAwareUnavailableScreen({
  examTitle,
  courseId,
  userRole = "student",
  status = "INVALID",
  violations = [],
}: ActorAwareUnavailableScreenProps) {
  const isTeacher = userRole === "teacher";
  const isAdminOrAuthor = userRole === "admin" || userRole === "content_author";

  // 1. STUDENT ACTOR VIEW
  if (!isTeacher && !isAdminOrAuthor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Bài học đang được cập nhật
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nội dung bài học <strong className="text-foreground">{examTitle || "này"}</strong> đang được giáo viên tinh chỉnh để đảm bảo chất lượng tốt nhất. Vui lòng quay lại sau!
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button asChild className="rounded-xl px-6 font-bold shadow-xs">
              <Link to={courseId ? `/course/${courseId}` : "/my-courses"}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay về danh sách bài tập
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TEACHER ACTOR VIEW
  if (isTeacher) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
        <div className="max-w-lg w-full space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Bài học tạm ngưng do lỗi dữ liệu
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bài thi <strong className="text-foreground">{examTitle}</strong> hiện đang gặp sự cố về cấu hình dữ liệu và chưa sẵn sàng phát hành cho học viên.
            </p>
          </div>

          <Card className="bg-muted/40 border-muted text-left">
            <CardContent className="p-4 text-xs space-y-2">
              <div className="font-bold text-foreground">Ghi chú cho Giáo viên:</div>
              <p className="text-muted-foreground">
                Trạng thái bài thi hiện tại: <span className="font-bold text-amber-600">{status}</span>. Vui lòng thông báo cho Ban Chuyên môn để hoàn thiện nội dung.
              </p>
            </CardContent>
          </Card>

          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/my-courses">Quay lại lớp học</Link>
            </Button>
            <Button className="rounded-xl font-bold gap-2">
              <Send className="h-4 w-4" />
              Báo Ban Chuyên Môn
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. CONTENT AUTHOR / ADMIN ACTOR VIEW
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Content Diagnostic Panel (Admin / Author)
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Chi Tiết Vi Phạm Contract Bài Thi: {examTitle}
            </h2>
          </div>
        </div>

        <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold border-b border-destructive/20 pb-2">
              <span>Trạng Thái Cấu Trúc: <span className="text-destructive">{status}</span></span>
              <span>Tổng số lỗi: {violations.length}</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {violations.map((v, i) => (
                <div
                  key={i}
                  className="p-3 bg-card border rounded-lg text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-destructive">
                    <span>Rule: {v.ruleId}</span>
                    <span>[{v.severity}]</span>
                  </div>
                  <p className="text-foreground font-medium">{v.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" asChild className="rounded-xl">
            <Link to="/admin/exams">Quay về CMS Admin</Link>
          </Button>
          <Button className="rounded-xl font-bold gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Wrench className="h-4 w-4" />
            Sửa Nội Dung Trong CMS
          </Button>
        </div>
      </div>
    </div>
  );
}
