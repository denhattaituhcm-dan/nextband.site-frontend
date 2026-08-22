import React, { useEffect, useState } from "react";
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
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

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
                    onClick: () => {
                      if (newNotif.link!.startsWith("http://") || newNotif.link!.startsWith("https://")) {
                        window.open(newNotif.link!, "_blank", "noopener,noreferrer");
                      } else {
                        navigate(newNotif.link!);
                      }
                    },
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

  // 1. Unread Count Query
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
    setSelectedNotification(item);
  };

  const handleActionClick = (link: string) => {
    setSelectedNotification(null);
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      navigate(link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return {
          icon: <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
          containerBg: "bg-indigo-50 dark:bg-indigo-950/50",
          label: "Bài nộp mới",
        };
      case "SUBMISSION_GRADED":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          containerBg: "bg-emerald-50 dark:bg-emerald-950/50",
          label: "Kết quả chấm",
        };
      case "NEW_HOMEWORK":
        return {
          icon: <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
          containerBg: "bg-indigo-50 dark:bg-indigo-950/50",
          label: "Bài tập",
        };
      case "TEACHER_FEEDBACK":
        return {
          icon: <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          containerBg: "bg-blue-50 dark:bg-blue-950/50",
          label: "Nhận xét",
        };
      case "DEADLINE_APPROACHING":
        return {
          icon: <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
          containerBg: "bg-rose-50 dark:bg-rose-950/50",
          label: "Hạn chót",
        };
      case "SYSTEM":
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          containerBg: "bg-amber-50 dark:bg-amber-950/50",
          label: "Hệ thống",
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          containerBg: "bg-blue-50 dark:bg-blue-950/50",
          label: "Thông báo",
        };
    }
  };

  return (
    <>
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
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[11px] font-bold bg-rose-500 text-white rounded-full border-2 border-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 sm:w-[400px] p-0 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-foreground">Thông báo</h4>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 font-normal"
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
                  <AlertCircle className="h-6 w-6" />
                </div>
                <p className="text-xs text-muted-foreground">
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
                <span className="font-medium text-slate-600 dark:text-slate-400">Không có thông báo nào</span>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getNotificationIcon(item.type);
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer text-left flex items-start gap-3 ${
                      isUnread
                        ? "bg-primary/5 hover:bg-primary/[0.08] border-l-2 border-l-primary"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Small solid icon container */}
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.containerBg}`}>
                      {meta.icon}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm truncate ${
                            isUnread
                              ? "font-semibold text-slate-900 dark:text-slate-100"
                              : "font-medium text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.title}
                        </span>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <span className="text-[11px] text-muted-foreground/80 block pt-0.5">
                        {new Date(item.createdAt).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-xl p-6">
          {selectedNotification && (() => {
            const meta = getNotificationIcon(selectedNotification.type);
            return (
              <>
                <DialogHeader className="space-y-2 text-left pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${meta.containerBg}`}>
                      {meta.icon}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {meta.label} · {new Date(selectedNotification.createdAt).toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                    {selectedNotification.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Chi tiết thông báo
                  </DialogDescription>
                </DialogHeader>

                <div className="py-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-line max-h-[50vh] overflow-y-auto">
                  {selectedNotification.message}
                </div>

                <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-border/60">
                  {selectedNotification.link ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNotification(null)}
                      >
                        Đóng
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(selectedNotification.link!)}
                        className="gap-1.5"
                      >
                        Xem chi tiết <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedNotification(null)}
                      className="w-full sm:w-auto"
                    >
                      Đã rõ
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
