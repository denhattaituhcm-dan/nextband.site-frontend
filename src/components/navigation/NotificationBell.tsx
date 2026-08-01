import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, AlertTriangle, Megaphone, Activity, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { notificationsApi, AnnouncementItem, ActivityItem, AlertItem } from "@/lib/api";

interface NotificationBellProps {
  scope: "admin" | "teacher" | "student";
}

export function NotificationBell({ scope }: NotificationBellProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"announcements" | "activities" | "alerts">("announcements");

  const { data } = useQuery({
    queryKey: ["notifications-center", scope],
    queryFn: () => notificationsApi.list(scope),
    refetchInterval: 30000,
  });

  const announcements: AnnouncementItem[] = data?.announcements || [];
  const activities: ActivityItem[] = data?.activities || [];
  const alerts: AlertItem[] = data?.alerts || [];

  const unreadAnnouncements = announcements.filter((a) => !a.is_read || a.has_newer_version).length;
  const openAlerts = alerts.length;
  const totalBadgeCount = unreadAnnouncements + openAlerts;

  const markAnnReadMutation = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => notificationsApi.markAsRead(id, "announcement", version),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-center", scope] }),
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id, "alert"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-center", scope] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(scope),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-center", scope] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          {totalBadgeCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[11px] font-bold bg-rose-500 text-white rounded-full border-2 border-background animate-pulse">
              {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 sm:w-[420px] p-0 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Notification Center</h4>
            {totalBadgeCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-rose-50 text-rose-600 font-semibold border-rose-200">
                {totalBadgeCount} cần lưu ý
              </Badge>
            )}
          </div>
          {unreadAnnouncements > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary h-8 px-2"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Đọc tất cả
            </Button>
          )}
        </div>

        {/* 3 Tabs Header */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 bg-muted/30 p-1 border-b rounded-none">
            <TabsTrigger value="announcements" className="text-xs py-1.5 font-semibold flex items-center gap-1">
              <Megaphone className="h-3.5 w-3.5 text-blue-600" />
              Thông báo
              {unreadAnnouncements > 0 && (
                <span className="ml-1 rounded-full bg-blue-600 text-white text-[10px] px-1.5 py-0.2 font-bold">
                  {unreadAnnouncements}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activities" className="text-xs py-1.5 font-semibold flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              Hoạt động
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs py-1.5 font-semibold flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Cần xử lý
              {openAlerts > 0 && (
                <span className="ml-1 rounded-full bg-amber-600 text-white text-[10px] px-1.5 py-0.2 font-bold">
                  {openAlerts}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ANNOUNCEMENTS */}
          <TabsContent value="announcements" className="m-0">
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {announcements.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">Không có thông báo nào</div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      if (!ann.is_read || ann.has_newer_version) {
                        markAnnReadMutation.mutate({ id: ann.id, version: ann.version });
                      }
                    }}
                    className={`p-3.5 transition-colors cursor-pointer text-left hover:bg-slate-50 space-y-1 ${
                      !ann.is_read || ann.has_newer_version ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {ann.is_pinned && <span className="text-amber-500">📌</span>}
                        {ann.title}
                      </span>
                      {ann.priority === "urgent" && (
                        <Badge className="bg-rose-500 text-[10px] px-1.5 py-0">KHẨN</Badge>
                      )}
                    </div>
                    {ann.content && <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{ann.content}</p>}
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                      <span>{new Date(ann.published_at).toLocaleDateString("vi-VN")}</span>
                      {ann.has_newer_version && (
                        <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Bản mới (v{ann.version})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: ACTIVITIES (Append-Only Feed, No Read/Unread) */}
          <TabsContent value="activities" className="m-0">
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {activities.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">Chưa có hoạt động nào</div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3 text-left hover:bg-slate-50 space-y-0.5">
                    <div className="text-xs text-slate-800">
                      <span className="font-bold text-slate-900">{act.actor_name || "Hệ thống"}</span>{" "}
                      {act.action === "submitted_hw" ? "đã nộp" : act.action === "graded_hw" ? "đã phản hồi" : "đã cập nhật"}{" "}
                      <span className="font-semibold text-emerald-700">{act.target_name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(act.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 3: ALERTS (Actionable Todo items with SLA) */}
          <TabsContent value="alerts" className="m-0">
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {alerts.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500/50" />
                  <span>Không có việc gì cần xử lý!</span>
                </div>
              ) : (
                alerts.map((alt) => (
                  <div key={alt.id} className="p-3 flex items-start justify-between gap-2 hover:bg-slate-50">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className={`h-4 w-4 ${alt.priority === "urgent" ? "text-rose-500" : "text-amber-500"}`} />
                        <span className="font-bold text-xs text-slate-900">
                          {alt.context?.title || "Cần xử lý ngay"}
                        </span>
                      </div>
                      {alt.age_days !== undefined && alt.age_days > 0 && (
                        <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                          🔥 Đã tồn tại {alt.age_days} ngày
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      onClick={() => resolveAlertMutation.mutate(alt.id)}
                    >
                      ✓ Xong
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
