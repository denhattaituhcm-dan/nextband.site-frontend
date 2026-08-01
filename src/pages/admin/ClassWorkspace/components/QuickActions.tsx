import React from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit3, ClipboardCheck, BookOpen } from "lucide-react";

export const QuickActions: React.FC = () => {
  const { setActiveTab, openAddStudentModal } = useWorkspace();

  const handleAddStudent = () => {
    setActiveTab("students");
    openAddStudentModal();
  };

  return (
    <div className="flex items-center gap-2 py-2 border-b bg-muted/20 px-1 rounded-lg">
      <span className="text-xs font-medium text-muted-foreground mr-1">Thao tác nhanh:</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 bg-card hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        onClick={handleAddStudent}
      >
        <UserPlus className="h-3.5 w-3.5" />
        ＋ Thêm học viên
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 bg-card hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
        onClick={() => setActiveTab("grading")}
      >
        <Edit3 className="h-3.5 w-3.5" />
        ✍️ Mở Inbox Chấm bài
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 bg-card hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
        onClick={() => setActiveTab("attendance")}
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        📅 Điểm danh lớp
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1.5 bg-card hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
        onClick={() => setActiveTab("homework")}
      >
        <BookOpen className="h-3.5 w-3.5" />
        📚 Xem Homework
      </Button>
    </div>
  );
};
