import React from "react";
import { useQuery } from "@tanstack/react-query";
import { announcementsApi } from "@/lib/api";
import { Megaphone, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnnouncementBannerProps {
  scopeRole?: "admin" | "teacher" | "student";
  classId?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  scopeRole = "student",
  classId,
}) => {
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-banner", scopeRole, classId],
    queryFn: () => announcementsApi.list(scopeRole, classId),
  });

  if (!announcements || announcements.length === 0) return null;

  // Render max top 2 announcements
  const activeAnnouncements = announcements.slice(0, 2);

  return (
    <div className="space-y-2 mb-4">
      {activeAnnouncements.map((ann) => {
        const isUrgent = ann.priority === "urgent";
        return (
          <div
            key={ann.id}
            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              isUrgent
                ? "bg-destructive/10 border-destructive/20 text-foreground"
                : "bg-primary-soft border-primary/20 text-foreground"
            }`}
          >
            <div className="flex items-center gap-2 max-w-[85%]">
              {isUrgent ? (
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <Megaphone className="h-4 w-4 text-primary shrink-0" />
              )}
              <div className="truncate">
                <span className="font-bold mr-2">{ann.title}</span>
                {ann.content && <span className="opacity-80 truncate">{ann.content}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {ann.has_newer_version && (
                <Badge variant="warning" className="text-[10px]">
                  Bản cập nhật mới
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(ann.published_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

