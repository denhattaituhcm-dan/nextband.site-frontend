import React from "react";
import { AlertCircle, CheckCircle2, Clock, Info } from "lucide-react";

export interface NotificationEvent {
  id: string;
  type: "NEW_SUBMISSION" | "ABSENCE_WARNING" | "HOMEWORK_OPENING" | "SYSTEM_INFO";
  title: string;
  message: string;
  timestamp?: string;
}

interface NotificationBarProps {
  notifications?: NotificationEvent[];
}

const DEFAULT_NOTIFICATIONS: NotificationEvent[] = [
  {
    id: "1",
    type: "NEW_SUBMISSION",
    title: "Bài nộp mới",
    message: "8 học viên vừa nộp bài cho Homework 12 trong 24 giờ qua.",
  },
  {
    id: "2",
    type: "ABSENCE_WARNING",
    title: "Cảnh báo vắng mặt",
    message: "2 học viên vắng mặt 2 buổi liên tiếp cần kiểm tra nguyên nhân.",
  },
  {
    id: "3",
    type: "HOMEWORK_OPENING",
    title: "Sắp mở bài mới",
    message: "Homework 13 sẽ tự động kích hoạt vào 08:00 ngày mai.",
  },
];

export const NotificationBar: React.FC<NotificationBarProps> = ({
  notifications = DEFAULT_NOTIFICATIONS,
}) => {
  if (!notifications || notifications.length === 0) return null;

  const renderIcon = (type: NotificationEvent["type"]) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "ABSENCE_WARNING":
        return <AlertCircle className="h-4 w-4 text-rose-600" />;
      case "HOMEWORK_OPENING":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const renderBadgeBg = (type: NotificationEvent["type"]) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
      case "ABSENCE_WARNING":
        return "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-200";
      case "HOMEWORK_OPENING":
        return "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:text-blue-200";
    }
  };

  return (
    <div className="space-y-2">
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 p-3 rounded-lg border text-xs leading-relaxed transition-all ${renderBadgeBg(
            item.type
          )}`}
        >
          <div className="mt-0.5 shrink-0">{renderIcon(item.type)}</div>
          <div className="flex-1">
            <span className="font-semibold mr-1.5">{item.title}:</span>
            <span>{item.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
