import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { notificationsApi, NotificationItem } from "@/lib/api";

interface NotificationBellProps {
  scope: "admin" | "teacher" | "student";
}

export function NotificationBell({ scope }: NotificationBellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", scope],
    queryFn: () => notificationsApi.list(scope),
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", scope] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", scope] });
    },
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    if (item.action_url) {
      navigate(item.action_url);
    }
  };

  const getPriorityIcon = (priority: NotificationItem["priority"]) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[11px] font-bold bg-rose-500 text-white rounded-full border-2 border-background animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 sm:w-96 p-0 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Thông báo</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary h-8 px-2"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {/* List Feed */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
              <p>Không có thông báo mới</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  !item.is_read ? "bg-primary/[0.03] dark:bg-primary/[0.05]" : ""
                }`}
              >
                {getPriorityIcon(item.priority)}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${!item.is_read ? "text-slate-900 dark:text-slate-100 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(item.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {!item.is_read && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
