import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  FileText,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  Clock,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notificationsApi, NotificationItem } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NotificationBellProps {
  scope?: "admin" | "teacher" | "student";
}

export function NotificationBell({ scope: _scope }: NotificationBellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 0. Supabase Realtime Push Listener
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-list"] });

          if (newNotif?.title) {
            toast.info(newNotif.title, {
              description: newNotif.message,
              action: newNotif.link
                ? {
                    label: "Xem ngay",
                    onClick: () => navigate(newNotif.link!),
                  }
                : undefined,
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, navigate]);

  // 1. Unread Count Query (N3-D: Authoritative unread count from DB)
  const {
    data: unreadData,
    isError: isUnreadError,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  // 2. Notifications List Query
  const {
    data: listData,
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchList,
  } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationsApi.list({ limit: 30 }),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications: NotificationItem[] = listData?.data || [];
  const hasError = isUnreadError || isListError;

  // 3. Mark Single Notification as Read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  // 4. Mark All as Read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return <FileText className="h-4 w-4 text-blue-600 shrink-0" />;
      case "SUBMISSION_GRADED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
      case "NEW_HOMEWORK":
        return <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />;
      case "TEACHER_FEEDBACK":
        return <MessageSquare className="h-4 w-4 text-amber-600 shrink-0" />;
      case "DEADLINE_APPROACHING":
        return <Clock className="h-4 w-4 text-rose-600 shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600 shrink-0" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
          {hasError ? (
            <span
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-background"
              title="Lỗi kết nối thông báo"
            />
          ) : (
            unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[11px] font-bold bg-rose-500 text-white rounded-full border-2 border-background animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 sm:w-[420px] p-0 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Thông báo</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-rose-50 text-rose-600 font-semibold border-rose-200">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary h-8 px-2"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Đọc tất cả
            </Button>
          )}
        </div>

        {/* Content Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {hasError ? (
            <div className="py-8 px-4 text-center space-y-3">
              <div className="flex justify-center text-amber-500">
                <AlertCircle className="h-7 w-7" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Không thể tải thông báo. Vui lòng kiểm tra kết nối.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => {
                  refetchUnread();
                  refetchList();
                }}
              >
                <RotateCw className="h-3 w-3" />
                Thử lại
              </Button>
            </div>
          ) : isListLoading ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <span>Không có thông báo nào</span>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3.5 transition-colors cursor-pointer text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-start gap-3 ${
                  !item.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}
              >
                <div className="mt-0.5">{getNotificationIcon(item.type)}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate ${!item.isRead ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                      {item.title}
                    </span>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground">
                    <span>{new Date(item.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                    {item.link && (
                      <span className="text-primary hover:underline font-medium">Chi tiết &rarr;</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
