import React from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi, AlertItem, AnnouncementItem } from "@/lib/api";
import { AlertCircle, Clock, Info, Megaphone } from "lucide-react";

interface NotificationBarProps {
  classId?: string;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({ classId }) => {
  const { data } = useQuery({
    queryKey: ["workspace-notification-bar", classId],
    queryFn: () => notificationsApi.list("teacher"),
  });

  const alerts: AlertItem[] = data?.alerts || [];
  const announcements: AnnouncementItem[] = data?.announcements || [];

  if (alerts.length === 0 && announcements.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* 1. Show announcements */}
      {announcements.slice(0, 1).map((ann) => (
        <div
          key={ann.id}
          className="flex items-center gap-3 p-3 rounded-xl border text-xs bg-blue-50/70 border-blue-200 text-blue-900"
        >
          <Megaphone className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-bold mr-2">{ann.title}:</span>
            <span>{ann.content}</span>
          </div>
        </div>
      ))}

      {/* 2. Show active alerts */}
      {alerts.map((alt) => (
        <div
          key={alt.id}
          className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${
            alt.priority === "urgent"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          <AlertCircle className={`h-4 w-4 shrink-0 ${alt.priority === "urgent" ? "text-rose-600" : "text-amber-600"}`} />
          <div className="flex-1">
            <span className="font-bold mr-2">{alt.context?.title || "Cảnh báo"}:</span>
            <span>{alt.priority === "urgent" ? "Cần xử lý ngay" : "Cần lưu ý kiểm tra"}</span>
          </div>
          {alt.age_days !== undefined && alt.age_days > 0 && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
              🔥 {alt.age_days} ngày
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

