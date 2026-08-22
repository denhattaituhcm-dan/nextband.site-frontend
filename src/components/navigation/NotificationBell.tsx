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
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const getNotificationMeta = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return {
          label: "Bài nộp mới",
          icon: <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          bg: "bg-blue-500/10 border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300",
          badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300",
        };
      case "SUBMISSION_GRADED":
        return {
          label: "Đã có điểm",
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          bg: "bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300",
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300",
        };
      case "NEW_HOMEWORK":
        return {
          label: "Bài tập mới",
          icon: <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
          bg: "bg-purple-500/10 border-purple-200/60 dark:border-purple-800/60 text-purple-700 dark:text-purple-300",
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300",
        };
      case "TEACHER_FEEDBACK":
        return {
          label: "Nhận xét GV",
          icon: <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          bg: "bg-amber-500/10 border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-300",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
        };
      case "DEADLINE_APPROACHING":
        return {
          label: "Hạn chót",
          icon: <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
          bg: "bg-rose-500/10 border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300",
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300",
        };
      case "SYSTEM":
        return {
          label: "Hệ thống",
          icon: <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          bg: "bg-amber-500/10 border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-300",
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300",
        };
      default:
        return {
          label: "Thông báo",
          icon: <Bell className="h-4 w-4 text-primary" />,
          bg: "bg-primary/10 border-primary/20 text-primary",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
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
            className="relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
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
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-full border-2 border-background animate-pulse shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 sm:w-[420px] p-0 shadow-2xl border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden bg-background/95 backdrop-blur-md"
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Bell className="h-4 w-4" />
              </div>
              <h4 className="font-extrabold text-sm text-foreground tracking-tight">Thông báo</h4>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[11px] px-2 py-0.5 bg-rose-50 text-rose-600 font-bold border border-rose-200/80 dark:bg-rose-950/50 dark:border-rose-800">
                  {unreadCount} mới
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-primary font-medium h-7 px-2.5 rounded-lg transition-colors"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Đọc tất cả
              </Button>
            )}
          </div>

          {/* Content Body */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {hasError ? (
              <div className="py-8 px-4 text-center space-y-3">
                <div className="flex justify-center text-amber-500">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Không thể tải thông báo. Vui lòng kiểm tra kết nối.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1 rounded-lg"
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
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-slate-400 stroke-[1.5]" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Không có thông báo nào</span>
                <span className="text-[11px] text-muted-foreground">Các tin tức mới sẽ xuất hiện ở đây</span>
              </div>
            ) : (
              notifications.map((item) => {
                const meta = getNotificationMeta(item.type);
                const isUnread = !item.isRead;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group p-3.5 transition-all cursor-pointer text-left flex items-start gap-3 relative ${
                      isUnread
                        ? "bg-primary/[0.04] dark:bg-primary/[0.08] hover:bg-primary/[0.08] dark:hover:bg-primary/[0.12] border-l-[3.5px] border-l-primary"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-[3.5px] border-l-transparent"
                    }`}
                  >
                    {/* Icon Avatar */}
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 shadow-xs ${meta.bg}`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            isUnread
                              ? "font-extrabold text-slate-900 dark:text-slate-100"
                              : "font-semibold text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {item.title}
                        </span>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11.5px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-medium">
                        <span>
                          {new Date(item.createdAt).toLocaleString("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        <span className="text-primary font-bold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Chi tiết <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Detail Dialog Modal */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
          {selectedNotification && (() => {
            const meta = getNotificationMeta(selectedNotification.type);
            return (
              <>
                <DialogHeader className="space-y-3 pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${meta.bg}`}>
                        {meta.icon}
                      </div>
                      <Badge variant="outline" className={`text-[11px] font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {new Date(selectedNotification.createdAt).toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <DialogTitle className="text-base sm:text-lg font-black text-foreground leading-snug">
                    {selectedNotification.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Chi tiết nội dung thông báo
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-line max-h-[55vh] overflow-y-auto">
                  {selectedNotification.message}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
                  {selectedNotification.link ? (
                    <div className="flex items-center justify-end gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedNotification(null)}
                        className="rounded-xl font-medium"
                      >
                        Đóng
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleActionClick(selectedNotification.link!)}
                        className="gap-1.5 rounded-xl font-bold shadow-xs"
                      >
                        Xem chi tiết <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSelectedNotification(null)}
                      className="w-full sm:w-auto rounded-xl font-bold px-6"
                    >
                      Đã hiểu
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
