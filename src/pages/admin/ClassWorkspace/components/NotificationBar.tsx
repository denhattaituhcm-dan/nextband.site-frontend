import React from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi, NotificationItem } from "@/lib/api";
import { Bell } from "lucide-react";

interface NotificationBarProps {
  classId?: string;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({ classId }) => {
  const { data } = useQuery({
    queryKey: ["workspace-notification-bar", classId],
    queryFn: () => notificationsApi.list({ limit: 5 }),
    refetchInterval: 30000,
  });

  const unreadNotifications: NotificationItem[] = (data?.data || []).filter((n) => !n.isRead);

  if (unreadNotifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {unreadNotifications.slice(0, 2).map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-xl border text-xs bg-blue-50/70 border-blue-200 text-blue-900"
        >
          <Bell className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex-1 truncate">
            <span className="font-bold mr-2">{item.title}:</span>
            <span>{item.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
