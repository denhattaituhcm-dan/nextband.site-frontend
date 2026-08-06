import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { SubmissionQueueItem, SubmissionItem } from "../features/grading/SubmissionQueueItem";
import { HomeworkReviewForm } from "../features/grading/HomeworkReviewForm";
import { Input } from "@/components/ui/input";
import { Search, Edit3, CheckCircle2 } from "lucide-react";

export const GradingTab: React.FC = () => {
  const { classData } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  const submissions = classData?.submissions || [];
  const students = classData?.students || [];

  const queue: SubmissionItem[] = submissions
    .filter((s: any) => s.grade_status === "pending" || s.status === "submitted" || s.status === "overdue")
    .map((s: any) => {
      const student = students.find((st: any) => st.id === s.student_id);
      return {
        id: s.id,
        studentName: student?.full_name || student?.fullName || student?.email || "Học viên",
        homeworkTitle: s.homework_title || s.title || "Homework",
        submittedAt: s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Chưa xác định",
        waitingTime: "1 giờ",
        status: s.status === "overdue" ? "overdue" : "new",
        attemptsCount: 1,
      };
    });

  const [selectedItem, setSelectedItem] = useState<SubmissionItem | null>(queue[0] || null);

  const filteredQueue = queue.filter((item) =>
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.homeworkTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGradedSuccess = () => {
    // Selection auto updates on query refetch
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-emerald-600" />
          Hàng đợi bài cần chấm ({queue.length} bài)
        </h3>
      </div>

      <div className="grid gap-6 md:grid-cols-12 min-h-[520px]">
        {/* Left Column: Searchable Queue */}
        <div className="md:col-span-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="🔍 Tìm theo tên học viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs"
            />
          </div>

          {filteredQueue.length === 0 ? (
            <div className="p-8 border rounded-xl bg-card text-center space-y-2">
              <span className="text-2xl">🎉</span>
              <p className="text-xs font-semibold text-emerald-600">Tuyệt vời!</p>
              <p className="text-[11px] text-muted-foreground">Tất cả homework đã được phản hồi hoặc chưa có bài mới nộp.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredQueue.map((item) => (
                <SubmissionQueueItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Homework Review Form */}
        <div className="md:col-span-8">
          <HomeworkReviewForm
            submission={selectedItem || filteredQueue[0] || null}
            onGradedSuccess={handleGradedSuccess}
          />
        </div>
      </div>
    </div>
  );
};
