import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const GradingTab: React.FC = () => {
  const { classData } = useWorkspace();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const submissions = classData?.submissions || [];
  const students = classData?.students || [];

  const queue = submissions
    .filter((s: any) => s.grade_status === "pending" || s.status === "submitted" || s.status === "SUBMITTED" || s.status === "overdue")
    .map((s: any) => {
      const student = students.find((st: any) => st.id === s.student_id || st.id === s.studentId);
      return {
        id: s.id,
        studentName: student?.full_name || student?.fullName || student?.email || "Học viên",
        homeworkTitle: s.homework_title || s.title || s.homework?.title || "Homework",
        submittedAt: s.submittedAt || s.created_at
          ? new Date(s.submittedAt || s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : "Chưa xác định",
      };
    });

  const filteredQueue = queue.filter((item: any) =>
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.homeworkTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenTeacherWorkspace = () => {
    if (classData?.id) {
      navigate(`/admin/teacher-workspace?classId=${encodeURIComponent(classData.id)}`);
    } else {
      navigate("/admin/teacher-workspace");
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Header & Primary Action to Open Canonical Teacher Workspace */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Bài tập chờ chấm ({queue.length} bài)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý và thực hiện chấm bài tập trung tại Teacher Workspace
          </p>
        </div>

        <Button
          onClick={handleOpenTeacherWorkspace}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 text-xs px-4 gap-2 shadow-sm"
        >
          Mở hàng đợi chấm bài
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content Area */}
      {queue.length === 0 ? (
        <Card className="p-10 text-center border-dashed rounded-xl space-y-2 bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Không có bài chờ chấm</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tất cả bài nộp hiện tại của lớp đã được xử lý hoặc chưa có bài mới nộp.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên học viên hoặc bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-background"
            />
          </div>

          <div className="border rounded-xl bg-card divide-y overflow-hidden shadow-2xs">
            {filteredQueue.map((item: any) => (
              <div
                key={item.id}
                onClick={handleOpenTeacherWorkspace}
                className="p-3 hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.studentName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.homeworkTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {item.submittedAt}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                    Chấm bài
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
