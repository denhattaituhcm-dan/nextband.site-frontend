import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

export interface SubmissionItem {
  id: string;
  studentName: string;
  homeworkTitle: string;
  submittedAt: string;
  waitingTime: string;
  status: "overdue" | "new" | "draft";
  attachmentType?: "audio" | "text" | "file";
  attemptsCount?: number;
}

interface SubmissionQueueItemProps {
  item: SubmissionItem;
  isSelected?: boolean;
  onSelect: (item: SubmissionItem) => void;
}

export const SubmissionQueueItem: React.FC<SubmissionQueueItemProps> = ({
  item,
  isSelected = false,
  onSelect,
}) => {
  const getBadge = (status: SubmissionItem["status"]) => {
    switch (status) {
      case "overdue":
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">🔴 Quá hạn</Badge>;
      case "new":
        return <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">🟡 Mới nộp</Badge>;
      default:
        return <Badge variant="outline" className="text-emerald-600 text-[10px] px-1.5 py-0">🟢 Nháp</Badge>;
    }
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className={`p-3 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm"
          : "hover:border-slate-300 bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-slate-200">
              {item.studentName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
            {item.studentName}
          </span>
        </div>
        {getBadge(item.status)}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-emerald-700 dark:text-emerald-300">
          {item.homeworkTitle}
        </span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
          <Clock className="h-3 w-3" />
          ⏳ {item.waitingTime}
        </span>
      </div>
    </div>
  );
};
