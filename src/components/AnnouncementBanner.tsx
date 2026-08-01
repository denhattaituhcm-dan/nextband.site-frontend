import React from "react";
import { useQuery } from "@tanstack/react-query";
import { announcementsApi, AnnouncementItem } from "@/lib/api";
import { Megaphone, AlertTriangle, ArrowRight } from "lucide-react";
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
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-blue-50/60 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center gap-2 max-w-[85%]">
              {isUrgent ? (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              ) : (
                <Megaphone className="h-4 w-4 text-blue-600 shrink-0" />
              )}
              <div className="truncate">
                <span className="font-bold mr-2">{ann.title}</span>
                {ann.content && <span className="opacity-80 truncate">{ann.content}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {ann.has_newer_version && (
                <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 border-amber-300">
                  Bản cập nhật mới
                </Badge>
              )}
              <span className="text-[10px] opacity-60">
                {new Date(ann.published_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
