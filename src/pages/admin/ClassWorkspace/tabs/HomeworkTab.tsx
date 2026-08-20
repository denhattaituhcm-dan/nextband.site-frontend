import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeworkSidebar, HomeworkItemData } from "../components/HomeworkSidebar";
import { ActivityChecklist } from "../components/ActivityChecklist";
import { PendingSubmissionsList } from "../components/PendingSubmissionsList";
import { BookOpen, Users, Inbox, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const HomeworkTab: React.FC = () => {
  const { classData, setActiveTab } = useWorkspace();

  const lessons = classData?.lessons || [];
  const submissions = classData?.submissions || [];
  const students = classData?.students || [];
  const totalStudents = students.length || 0;

  // Transform lessons to Course-driven Homework list with real workload & heatmap metrics
  const homeworkList: HomeworkItemData[] = lessons.map((lesson: any, i: number) => {
    const hwNum = String(i + 1).padStart(2, "0");
    const hwTitle = lesson.title || `Homework ${hwNum}`;
    
    // Calculate submissions for this lesson/homework
    const lessonSubmissions = submissions.filter(
      (s: any) =>
        s.examId === lesson.exam_id ||
        s.examId === lesson.id ||
        s.exam_id === lesson.exam_id ||
        s.exam_id === lesson.id ||
        s.homework_id === lesson.id ||
        s.lesson_id === lesson.id ||
        s.homework_title?.includes(hwNum)
    );

    const pendingSubmissions = lessonSubmissions
      .filter((s: any) => s.grade_status === "pending" || s.status === "submitted" || s.status === "overdue")
      .map((s: any) => {
        const student = students.find((st: any) => (st.id || st.studentId) === (s.studentId || s.student_id));
        return {
          id: s.id,
          studentName: student?.fullName || student?.full_name || student?.email || "Học viên",
          submittedAt: (s.submittedAt || s.createdAt || s.created_at)
            ? new Date(s.submittedAt || s.createdAt || s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : "Chưa xác định",
        };
      });

    const submittedCount = lessonSubmissions.length;
    const waitingReviewCount = pendingSubmissions.length;
    const gradedCount = lessonSubmissions.filter(
      (s: any) => s.grade_status === "graded" || s.status === "graded"
    ).length;

    // Progress percentage of total enrolled class (Heatmap metric)
    const progressPercent =
      totalStudents > 0
        ? Math.min(100, Math.round((submittedCount / totalStudents) * 100))
        : 0;

    // Map DB sections if present, otherwise map standard activity types
    const dbSections = lesson.exam_sections || [];
    let skills = dbSections.map((sec: any) => ({
      type: sec.section_type || "general",
      name: sec.title || `Skill - ${sec.section_type.toUpperCase()}`,
      detail: sec.instructions || `Nội dung luyện tập phần ${sec.section_type.toUpperCase()}`,
    }));

    // Fallback if no sections in DB yet
    if (skills.length === 0) {
      skills = [
        { type: "listening", name: "Listening Activity", detail: "Luyện nghe chọn đáp án & hoàn thành ghi chú" },
        { type: "reading", name: "Reading Activity", detail: "Đọc hiểu passage & trả lời câu hỏi" },
        { type: "writing", name: "Writing Activity", detail: "Bài luận ngắn / Phản hồi câu hỏi" },
        { type: "speaking", name: "Speaking Activity", detail: "Ghi âm bài nói theo yêu cầu" },
      ];
    }

    return {
      id: lesson.id || `hw-${i + 1}`,
      hwNum,
      title: hwTitle,
      submittedCount,
      waitingReviewCount,
      gradedCount,
      progressPercent,
      skills,
      pendingSubmissions,
    };
  });

  const [selectedHwId, setSelectedHwId] = useState<string>(homeworkList[0]?.id || "");
  
  // Empty State handling if course has 0 exams in DB
  if (homeworkList.length === 0) {
    return (
      <div className="pt-4 text-center">
        <div className="p-12 border rounded-xl bg-card text-center space-y-3">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto" />
          <h4 className="text-base font-bold">Khóa học này chưa được khởi tạo nội dung học</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Chưa tìm thấy bản ghi bài tập nào thuộc khóa học này trong cơ sở dữ liệu. Vui lòng liên hệ Quản trị viên để bổ sung dữ liệu nội dung học.
          </p>
          <Button asChild size="sm" className="mt-2 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Link to="/admin/courses">
              <PlusCircle className="h-4 w-4" />
              Quản trị viên bổ sung dữ liệu
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectedHw = homeworkList.find((hw) => hw.id === selectedHwId) || homeworkList[0];

  return (
    <div className="space-y-4 pt-2">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Nội dung học tập & Heatmap Tiến độ (Course-Driven Curriculum)
            </h3>
            <p className="text-xs text-muted-foreground">
              Toàn bộ bài học mở hoàn toàn. Theo dõi chỉ số Workload (bài chờ chấm) & Heatmap nộp bài trực tiếp ở Sidebar.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs border-emerald-500 text-emerald-700 bg-emerald-50">
          {homeworkList.length} Bài học
        </Badge>
      </div>

      {/* 2-Column Course-driven Layout */}
      <div className="grid gap-6 md:grid-cols-12 min-h-[540px]">
        {/* Left Column: HomeworkSidebar Component */}
        <div className="md:col-span-4">
          <HomeworkSidebar
            homeworkList={homeworkList}
            selectedHwId={selectedHw?.id || ""}
            onSelectHw={setSelectedHwId}
            totalStudents={totalStudents}
          />
        </div>

        {/* Right Column: Dynamic ActivityChecklist & PendingSubmissionsList */}
        <div className="md:col-span-8">
          {selectedHw ? (
            <Card className="h-full border bg-card flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      {selectedHw.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Checklist {selectedHw.skills.length} hoạt động thực tế thuộc bài học này
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold text-emerald-700 border-emerald-300">
                      Đã nộp: {selectedHw.submittedCount}/{totalStudents} HV ({selectedHw.progressPercent}%)
                    </Badge>
                    {selectedHw.waitingReviewCount > 0 && (
                      <Badge className="bg-amber-500 text-white text-xs font-bold">
                        {selectedHw.waitingReviewCount} bài chờ chấm
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5 flex-1 overflow-y-auto">
                {/* Workload Metric Summary */}
                <div className="p-3 rounded-xl border bg-muted/20 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Thống kê nộp bài: <strong className="text-slate-900 dark:text-slate-100">{selectedHw.submittedCount}/{totalStudents} HV</strong>
                  </span>
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-amber-600">🟡 {selectedHw.waitingReviewCount} Chờ chấm</span>
                    <span className="text-emerald-600">🟢 {selectedHw.gradedCount} Đã xong</span>
                  </div>
                </div>

                {/* Modular ActivityChecklist Component */}
                <ActivityChecklist skills={selectedHw.skills} />

                {/* Modular PendingSubmissionsList Component */}
                <PendingSubmissionsList
                  homeworkTitle={selectedHw.title}
                  pendingSubmissions={selectedHw.pendingSubmissions}
                  onGradeClick={() => setActiveTab("grading")}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-8 border rounded-xl bg-card text-muted-foreground text-sm">
              Chọn bài học từ danh sách bên trái để xem chi tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
