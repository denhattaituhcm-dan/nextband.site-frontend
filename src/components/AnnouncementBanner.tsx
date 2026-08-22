import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, NotificationItem } from "@/lib/api";
import { Megaphone, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnnouncementBannerProps {
  scopeRole?: "admin" | "teacher" | "student";
  classId?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["announcements-banner"],
    queryFn: () => notificationsApi.list({ limit: 5 }),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements-banner"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const announcements = (data?.data || []).filter(
    (n: NotificationItem) => (n.type === "ANNOUNCEMENT" || n.type === "SYSTEM") && !n.isRead
  );

  if (!announcements || announcements.length === 0) return null;

  const activeAnnouncements = announcements.slice(0, 2);

  return (
    <div className="space-y-2 mb-4">
      {activeAnnouncements.map((ann) => (
        <div
          key={ann.id}
          className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all bg-primary-soft border-primary/20 text-foreground shadow-xs"
        >
          <div
            className={`flex items-center gap-2 max-w-[85%] ${ann.link ? "cursor-pointer hover:opacity-90" : ""}`}
            onClick={() => {
              if (ann.link) {
                navigate(ann.link);
              }
            }}
          >
            <Megaphone className="h-4 w-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-bold mr-2">{ann.title}:</span>
              {ann.message && <span className="opacity-90">{ann.message}</span>}
            </div>
            {ann.link && <ExternalLink className="h-3 w-3 text-primary shrink-0 ml-1" />}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              {new Date(ann.createdAt).toLocaleDateString("vi-VN")}
            </span>
            <button
              type="button"
              onClick={() => markReadMutation.mutate(ann.id)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Đóng thông báo"
              aria-label="Đóng thông báo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
