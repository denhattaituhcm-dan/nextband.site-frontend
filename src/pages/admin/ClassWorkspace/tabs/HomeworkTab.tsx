import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, LayoutGrid, ListFilter, Inbox } from "lucide-react";

export const HomeworkTab: React.FC = () => {
  const { classData } = useWorkspace();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const lessons = classData?.lessons || [];
  const submissions = classData?.submissions || [];
  const totalStudents = classData?.students?.length || 0;

  const homeworkList = lessons.map((lesson: any, i: number) => {
    const hwNumber = i + 1;
    const lessonSubmissions = submissions.filter((s: any) => s.homework_id === lesson.id || s.lesson_id === lesson.id);
    const submitted = lessonSubmissions.length;
    const missing = Math.max(0, totalStudents - submitted);
    const feedbackDone = lessonSubmissions.filter((s: any) => s.grade_status === "graded" || s.status === "graded").length;

    return {
      id: lesson.id,
      title: lesson.title || `Homework ${hwNumber}`,
      hwNumber,
      submitted,
      missing,
      feedbackDone,
    };
  });

  if (homeworkList.length === 0) {
    return (
      <div className="pt-4 text-center">
        <div className="p-12 border rounded-xl bg-card text-center space-y-3">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto" />
          <h4 className="text-base font-bold">Chưa có bài tập nào</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Lớp học này chưa được gán chương trình học hoặc chương trình học chưa có bài tập homework nào.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          Góc nhìn bài tập ({homeworkList.length} bài)
        </h3>

        {/* View Mode Toggle & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="border rounded-lg p-0.5 flex bg-muted/40">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode("table")}
            >
              <ListFilter className="h-3.5 w-3.5 mr-1" />
              Table
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {homeworkList.map((hw) => (
            <Card
              key={hw.id || hw.hwNumber}
              className="p-3 cursor-pointer hover:border-emerald-500 transition-all bg-card"
            >
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate">{hw.title}</span>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between"><span>Đã nộp:</span> <span className="font-semibold">{hw.submitted}/{totalStudents}</span></div>
                  <div className="flex justify-between"><span>Đã phản hồi:</span> <span className="font-semibold text-emerald-600">{hw.feedbackDone}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Homework</TableHead>
                <TableHead>Đã nộp</TableHead>
                <TableHead>Chưa nộp</TableHead>
                <TableHead>Đã phản hồi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homeworkList.map((hw) => (
                <TableRow key={hw.id || hw.hwNumber}>
                  <TableCell className="font-medium">{hw.title}</TableCell>
                  <TableCell>{hw.submitted} học viên</TableCell>
                  <TableCell className="text-rose-600">{hw.missing} học viên</TableCell>
                  <TableCell className="text-emerald-600 font-medium">{hw.feedbackDone} bài</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
