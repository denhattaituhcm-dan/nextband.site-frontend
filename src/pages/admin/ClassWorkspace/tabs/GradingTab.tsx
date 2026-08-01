import React, { useState } from "react";
import { SubmissionQueueItem, SubmissionItem } from "../features/grading/SubmissionQueueItem";
import { HomeworkReviewForm } from "../features/grading/HomeworkReviewForm";
import { Input } from "@/components/ui/input";
import { Search, Edit3, CheckCircle2 } from "lucide-react";

const INITIAL_QUEUE: SubmissionItem[] = [
  { id: "1", studentName: "Nguyễn Văn An", homeworkTitle: "Homework 12", submittedAt: "09:15", waitingTime: "2 giờ", status: "overdue", attemptsCount: 1 },
  { id: "2", studentName: "Trần Thị Bình", homeworkTitle: "Homework 12", submittedAt: "08:30", waitingTime: "3 giờ", status: "new", attemptsCount: 2 },
  { id: "3", studentName: "Lê Văn Cường", homeworkTitle: "Homework 11", submittedAt: "Hôm qua", waitingTime: "18 giờ", status: "overdue", attemptsCount: 1 },
  { id: "4", studentName: "Phạm Minh Đức", homeworkTitle: "Homework 12", submittedAt: "10:00", waitingTime: "1 giờ", status: "new", attemptsCount: 1 },
];

export const GradingTab: React.FC = () => {
  const [queue, setQueue] = useState<SubmissionItem[]>(INITIAL_QUEUE);
  const [selectedItem, setSelectedItem] = useState<SubmissionItem | null>(INITIAL_QUEUE[0] || null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQueue = queue.filter((item) =>
    item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.homeworkTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGradedSuccess = () => {
    if (!selectedItem) return;
    const updated = queue.filter((item) => item.id !== selectedItem.id);
    setQueue(updated);
    setSelectedItem(updated[0] || null);
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
              <p className="text-[11px] text-muted-foreground">Tất cả homework đã được phản hồi.</p>
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
            submission={selectedItem}
            onGradedSuccess={handleGradedSuccess}
          />
        </div>
      </div>
    </div>
  );
};
