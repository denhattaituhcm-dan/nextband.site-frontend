import React from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi, NotificationItem } from "@/lib/api";
import { Megaphone } from "lucide-react";

interface AnnouncementBannerProps {
  scopeRole?: "admin" | "teacher" | "student";
  classId?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = () => {
  const { data } = useQuery({
    queryKey: ["announcements-banner"],
    queryFn: () => notificationsApi.list({ limit: 5 }),
  });

  const announcements = (data?.data || []).filter(
    (n: NotificationItem) => n.type === "ANNOUNCEMENT" && !n.isRead
  );

  if (!announcements || announcements.length === 0) return null;

  const activeAnnouncements = announcements.slice(0, 2);

  return (
    <div className="space-y-2 mb-4">
      {activeAnnouncements.map((ann) => (
        <div
          key={ann.id}
          className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all bg-primary-soft border-primary/20 text-foreground"
        >
          <div className="flex items-center gap-2 max-w-[85%]">
            <Megaphone className="h-4 w-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-bold mr-2">{ann.title}</span>
              {ann.message && <span className="opacity-80 truncate">{ann.message}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {new Date(ann.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
