import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Plus,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  Users,
  Megaphone,
  Sparkles,
  Calendar,
  Layers,
  Send,
  AlertCircle,
  Clock,
  RotateCw,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  School,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { notificationsApi, classesApi, AdminAnnouncementItem, BroadcastPayload } from "@/lib/api";
import { NOTIFICATION_TEMPLATES, NotificationTemplate } from "@/constants/notificationTemplates";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();

  // Filter & pagination states for broadcasts table
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Recipient viewer states
  const [selectedBroadcast, setSelectedBroadcast] = useState<AdminAnnouncementItem | null>(null);
  const [recipientPage, setRecipientPage] = useState(1);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [recipientStatusFilter, setRecipientStatusFilter] = useState<"ALL" | "READ" | "UNREAD">("ALL");

  // Form states for creating announcement
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formType, setFormType] = useState<"ANNOUNCEMENT" | "SYSTEM" | "DEADLINE_APPROACHING">("ANNOUNCEMENT");
  const [formTargetType, setFormTargetType] = useState<"ALL" | "STUDENTS" | "TEACHERS" | "CLASS">("ALL");
  const [formClassId, setFormClassId] = useState("");
  const [formLink, setFormLink] = useState("/app");
  const [formDurationDays, setFormDurationDays] = useState<string>("7");

  // 1. Query: List of admin broadcasts
  const {
    data: broadcastsData,
    isLoading: isBroadcastsLoading,
    isError: isBroadcastsError,
    refetch: refetchBroadcasts,
  } = useQuery({
    queryKey: ["admin-broadcasts", currentPage, searchQuery, typeFilter],
    queryFn: () =>
      notificationsApi.listAdminBroadcasts({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        type: typeFilter === "ALL" ? undefined : typeFilter,
      }),
  });

  // 2. Query: Classes list for target class dropdown
  const { data: classesData } = useQuery({
    queryKey: ["admin-classes-for-notifications"],
    queryFn: () => classesApi.list({ limit: 100 }),
    enabled: isCreateOpen,
  });

  // 3. Query: Recipients for selected broadcast
  const {
    data: recipientsData,
    isLoading: isRecipientsLoading,
    refetch: refetchRecipients,
  } = useQuery({
    queryKey: [
      "admin-broadcast-recipients",
      selectedBroadcast?.broadcastId,
      recipientPage,
      recipientSearch,
      recipientStatusFilter,
    ],
    queryFn: () =>
      notificationsApi.getBroadcastRecipients({
        broadcastId: selectedBroadcast!.broadcastId,
        page: recipientPage,
        limit: 20,
        search: recipientSearch || undefined,
        status: recipientStatusFilter,
      }),
    enabled: !!selectedBroadcast?.broadcastId,
  });

  // 4. Mutation: Create & Broadcast Announcement
  const broadcastMutation = useMutation({
    mutationFn: (payload: BroadcastPayload) => notificationsApi.broadcast(payload),
    onSuccess: (res) => {
      toast.success("Phát thông báo thành công", {
        description: res.message || `Đã gửi tới ${res.recipientCount} người nhận.`,
      });
      setIsCreateOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
    onError: (err: any) => {
      toast.error("Không thể phát thông báo", {
        description: err?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  // 5. Mutation: Soft-delete broadcast
  const deleteMutation = useMutation({
    mutationFn: (broadcastId: string) => notificationsApi.deleteBroadcast(broadcastId),
    onSuccess: () => {
      toast.success("Đã xóa thông báo khỏi danh sách quản trị");
      setDeleteTargetId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    },
    onError: (err: any) => {
      toast.error("Không thể xóa thông báo", {
        description: err?.message || "Vui lòng thử lại.",
      });
    },
  });

  const broadcasts = broadcastsData?.data || [];
  const pagination = broadcastsData?.pagination || { total: 0, page: 1, limit: pageSize };
  const totalPages = Math.ceil((pagination.total || 0) / pageSize) || 1;

  // Aggregate metrics
  const totalBroadcastsCount = pagination.total || 0;
  const totalDeliveredRecipients = broadcasts.reduce((acc, curr) => acc + (curr.totalRecipients || 0), 0);
  const totalReadCount = broadcasts.reduce((acc, curr) => acc + (curr.readCount || 0), 0);
  const avgReadRate =
    totalDeliveredRecipients > 0 ? Math.round((totalReadCount / totalDeliveredRecipients) * 1000) / 10 : 0;

  const resetForm = () => {
    setFormTitle("");
    setFormMessage("");
    setFormType("ANNOUNCEMENT");
    setFormTargetType("ALL");
    setFormClassId("");
    setFormLink("/app");
    setFormDurationDays("7");
  };

  const applyTemplate = (tpl: NotificationTemplate) => {
    setFormTitle(tpl.title);
    setFormMessage(tpl.message);
    setFormType(tpl.type);
    setFormTargetType(tpl.targetType);
    setFormLink(tpl.link || "/app");
    setFormDurationDays(String(tpl.defaultDurationDays || 7));
    setIsCreateOpen(true);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề thông báo");
      return;
    }
    if (!formMessage.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo");
      return;
    }
    if (formTargetType === "CLASS" && !formClassId) {
      toast.error("Vui lòng chọn lớp học nhận thông báo");
      return;
    }

    let expiresAt: string | undefined = undefined;
    if (formDurationDays !== "unlimited") {
      const days = parseInt(formDurationDays, 10);
      if (!isNaN(days) && days > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + days);
        expiresAt = expDate.toISOString();
      }
    }

    broadcastMutation.mutate({
      title: formTitle.trim(),
      message: formMessage.trim(),
      type: formType,
      targetType: formTargetType,
      targetClassId: formTargetType === "CLASS" ? formClassId : undefined,
      link: formLink.trim() || undefined,
      expiresAt,
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ANNOUNCEMENT":
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Megaphone className="h-3 w-3 mr-1" />
            Thông báo chung
          </Badge>
        );
      case "SYSTEM":
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Hệ thống
          </Badge>
        );
      case "DEADLINE_APPROACHING":
        return (
          <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200">
            <Clock className="h-3 w-3 mr-1" />
            Nhắc nhở
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            <Bell className="h-3 w-3 mr-1" />
            {type}
          </Badge>
        );
    }
  };

  const getTargetBadge = (targetType: string) => {
    switch (targetType) {
      case "ALL":
        return (
          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 gap-1">
            <Users className="h-3 w-3 text-slate-500" />
            Toàn hệ thống
          </Badge>
        );
      case "STUDENTS":
        return (
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <GraduationCap className="h-3 w-3 text-emerald-600" />
            Học viên
          </Badge>
        );
      case "TEACHERS":
        return (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 gap-1">
            <ShieldCheck className="h-3 w-3 text-purple-600" />
            Giáo viên
          </Badge>
        );
      case "CLASS":
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <School className="h-3 w-3 text-blue-600" />
            Lớp học
          </Badge>
        );
      default:
        return <Badge variant="outline">{targetType}</Badge>;
    }
  };

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-primary" />
            Quản lý & Phát Thông Báo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chủ động phát thông báo lịch nghỉ Lễ, Tết, bảo trì định kỳ và nhắc nhở học tập tới học viên & giáo viên.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="gap-2 font-bold shadow-md h-10 px-5 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Tạo thông báo mới
        </Button>
      </div>

      {/* ── 2. Metric Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng đợt phát</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{totalBroadcastsCount}</h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lượt người nhận</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{totalDeliveredRecipients}</h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đã đọc (Trang này)</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">
                {totalReadCount} / {totalDeliveredRecipients}
              </h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tỷ lệ đã xem trung bình</p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{avgReadRate}%</h3>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Quick Presets Bar (Mẫu Soạn Sẵn) ── */}
      <Card className="rounded-2xl border-primary/20 bg-primary-soft/30 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground">Mẫu Soạn Nhanh Tiện Ích</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Bấm chọn mẫu để tự động điền sẵn nội dung lịch nghỉ lễ, Tết hoặc thông báo bảo trì định kỳ
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {NOTIFICATION_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="p-3 bg-card hover:bg-card/80 border border-border/80 hover:border-primary/50 rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tpl.icon}</span>
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {tpl.name}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{tpl.title}</p>
                <span className="text-[10px] font-bold text-primary flex items-center gap-1 pt-1">
                  Dùng mẫu này &rarr;
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Broadcasts List & Filter ── */}
      <Card className="rounded-2xl border-border shadow-xs">
        <CardHeader className="p-5 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Lịch Sử Thông Báo Đã Phát
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Theo dõi tiến độ nhận và tỷ lệ học viên/giáo viên đã đọc thông báo
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tiêu đề..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>

              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-36 text-xs rounded-xl">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Thông báo chung</SelectItem>
                  <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                  <SelectItem value="DEADLINE_APPROACHING">Nhắc nhở</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isBroadcastsError ? (
            <div className="py-12 text-center space-y-3">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-xs text-muted-foreground">Không thể tải danh sách thông báo.</p>
              <Button variant="outline" size="sm" onClick={() => refetchBroadcasts()} className="text-xs gap-1">
                <RotateCw className="h-3.5 w-3.5" /> Thử lại
              </Button>
            </div>
          ) : isBroadcastsLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground animate-pulse space-y-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Đang tải danh sách thông báo...</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-10 w-10 text-muted-foreground/30 stroke-[1.2]" />
              <span className="font-semibold">Chưa có thông báo nào được phát</span>
              <p className="text-[11px] max-w-sm">
                Bấm vào nút "Tạo thông báo mới" hoặc sử dụng các mẫu soạn sẵn ở trên để phát thông báo đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3.5">Tiêu đề & Nội dung</th>
                    <th className="px-4 py-3.5">Loại</th>
                    <th className="px-4 py-3.5">Đối tượng</th>
                    <th className="px-4 py-3.5">Thời gian gửi</th>
                    <th className="px-4 py-3.5">Banner</th>
                    <th className="px-4 py-3.5">Tình trạng đọc</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {broadcasts.map((item) => {
                    const expired = isExpired(item.expiresAt);
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <div className="space-y-1">
                            <span className="font-extrabold text-foreground block text-xs line-clamp-1">
                              {item.title}
                            </span>
                            <p className="text-muted-foreground line-clamp-2 text-[11px] leading-relaxed">
                              {item.message}
                            </p>
                            {item.link && (
                              <span className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                Link: {item.link}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">{getTypeBadge(item.type)}</td>
                        <td className="px-4 py-4 whitespace-nowrap">{getTargetBadge(item.targetType)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-muted-foreground text-[11px]">
                          {new Date(item.publishedAt || item.createdAt).toLocaleString("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {item.expiresAt ? (
                            expired ? (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted">
                                Đã hết hạn
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                                Đến {new Date(item.expiresAt).toLocaleDateString("vi-VN")}
                              </Badge>
                            )
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Không giới hạn</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap min-w-[140px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span>
                                {item.readCount} / {item.totalRecipients} đã đọc
                              </span>
                              <span className="text-primary font-bold">{item.readRate}%</span>
                            </div>
                            <Progress value={item.readRate} className="h-1.5" />
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBroadcast(item);
                              setRecipientPage(1);
                              setRecipientSearch("");
                              setRecipientStatusFilter("ALL");
                            }}
                            className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-lg"
                            title="Xem chi tiết danh sách người nhận"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Người nhận
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetId(item.broadcastId)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg"
                            title="Xóa thông báo khỏi danh sách quản trị"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Hiển thị trang {pagination.page} / {totalPages} (Tổng {pagination.total} thông báo)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs px-2 rounded-lg"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 text-xs px-2 rounded-lg"
                >
                  Sau <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 5. Modal Tạo & Phát Thông Báo với Live Preview ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-3">
            <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Soạn & Phát Thông Báo Mới
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nhập nội dung thông báo. Hệ thống sẽ tự động gửi tới đúng nhóm người nhận qua chuông, banner và thông báo đẩy.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBroadcastSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-7 space-y-4">
                {/* Tiêu đề */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Tiêu đề thông báo *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {formTitle.length}/100 ký tự
                    </span>
                  </label>
                  <Input
                    placeholder="Ví dụ: Thông báo lịch nghỉ lễ Quốc Khánh 2/9"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value.slice(0, 100))}
                    className="rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                {/* Phân loại & Đối tượng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Loại thông báo</label>
                    <Select
                      value={formType}
                      onValueChange={(val: any) => setFormType(val)}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ANNOUNCEMENT">📢 Thông báo chung</SelectItem>
                        <SelectItem value="SYSTEM">⚙️ Thông báo hệ thống</SelectItem>
                        <SelectItem value="DEADLINE_APPROACHING">⏰ Nhắc nhở hạn chót</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Đối tượng nhận</label>
                    <Select
                      value={formTargetType}
                      onValueChange={(val: any) => setFormTargetType(val)}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">🌐 Toàn hệ thống (Tất cả)</SelectItem>
                        <SelectItem value="STUDENTS">🎓 Tất cả Học viên</SelectItem>
                        <SelectItem value="TEACHERS">👨‍🏫 Tất cả Giáo viên</SelectItem>
                        <SelectItem value="CLASS">🏫 Theo Lớp học cụ thể</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Chọn lớp học cụ thể nếu chọn CLASS */}
                {formTargetType === "CLASS" && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <School className="h-3.5 w-3.5 text-blue-600" />
                      Chọn lớp học nhận thông báo *
                    </label>
                    <Select value={formClassId} onValueChange={setFormClassId}>
                      <SelectTrigger className="rounded-xl text-xs bg-white">
                        <SelectValue placeholder="-- Chọn lớp học --" />
                      </SelectTrigger>
                      <SelectContent>
                        {(classesData?.data || []).map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({cls.code || "Lớp"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Thời hạn hiển thị Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Thời hạn hiển thị Banner</label>
                    <Select value={formDurationDays} onValueChange={setFormDurationDays}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 ngày</SelectItem>
                        <SelectItem value="7">7 ngày</SelectItem>
                        <SelectItem value="14">14 ngày (2 tuần)</SelectItem>
                        <SelectItem value="30">30 ngày (1 tháng)</SelectItem>
                        <SelectItem value="unlimited">Không giới hạn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Liên kết chi tiết (Tùy chọn)</label>
                    <Input
                      placeholder="/app hoặc https://..."
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Nội dung thông báo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Nội dung chi tiết *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {formMessage.length}/1000 ký tự
                    </span>
                  </label>
                  <Textarea
                    placeholder="Nhập nội dung thông báo đầy đủ, lịch nghỉ cụ thể..."
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value.slice(0, 1000))}
                    rows={5}
                    className="rounded-xl text-xs leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Right Column: Live Preview Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-foreground uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Xem Trước Giao Diện Thực Tế
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Mô phỏng hiển thị như học viên/giáo viên sẽ thấy trên màn hình:
                  </p>

                  {/* 1. Preview Banner */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      1. Banner đầu trang Dashboard
                    </span>
                    <div className="p-3 rounded-xl border text-xs bg-primary-soft border-primary/20 text-foreground flex items-start gap-2 shadow-xs">
                      <Megaphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <span className="font-bold block text-xs truncate">
                          {formTitle || "Tiêu đề thông báo..."}
                        </span>
                        <p className="text-[11px] opacity-85 line-clamp-2 leading-relaxed">
                          {formMessage || "Nội dung thông báo sẽ xuất hiện tại đây..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Preview Notification Bell Item */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      2. Trong menu Chuông thông báo
                    </span>
                    <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start gap-3 shadow-xs">
                      <div className="mt-0.5">
                        <Bell className="h-4 w-4 text-primary shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {formTitle || "Tiêu đề thông báo"}
                          </span>
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {formMessage || "Nội dung chi tiết thông báo..."}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                          <span>Vừa xong</span>
                          {formLink && <span className="text-primary font-medium">Chi tiết &rarr;</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/60 pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 shadow-md"
              >
                {broadcastMutation.isPending ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" /> Đang phát thông báo...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Phát thông báo ngay
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 6. Modal Xem Chi Tiết Danh Sách Người Nhận (Recipients Viewer) ── */}
      <Dialog
        open={!!selectedBroadcast}
        onOpenChange={(open) => {
          if (!open) setSelectedBroadcast(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Danh Sách Người Nhận
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 line-clamp-1">
                  Đợt phát: <span className="font-bold text-foreground">{selectedBroadcast?.title}</span>
                </DialogDescription>
              </div>
              {selectedBroadcast && (
                <Badge variant="secondary" className="text-xs font-bold">
                  {selectedBroadcast.readCount} / {selectedBroadcast.totalRecipients} đã đọc ({selectedBroadcast.readRate}%)
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm học viên/giáo viên..."
                  value={recipientSearch}
                  onChange={(e) => {
                    setRecipientSearch(e.target.value);
                    setRecipientPage(1);
                  }}
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant={recipientStatusFilter === "ALL" ? "default" : "outline"}
                  onClick={() => {
                    setRecipientStatusFilter("ALL");
                    setRecipientPage(1);
                  }}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Tất cả
                </Button>
                <Button
                  size="sm"
                  variant={recipientStatusFilter === "READ" ? "default" : "outline"}
                  onClick={() => {
                    setRecipientStatusFilter("READ");
                    setRecipientPage(1);
                  }}
                  className="h-7 text-xs rounded-lg px-2.5 text-emerald-600"
                >
                  Đã đọc
                </Button>
                <Button
                  size="sm"
                  variant={recipientStatusFilter === "UNREAD" ? "default" : "outline"}
                  onClick={() => {
                    setRecipientStatusFilter("UNREAD");
                    setRecipientPage(1);
                  }}
                  className="h-7 text-xs rounded-lg px-2.5 text-amber-600"
                >
                  Chưa đọc
                </Button>
              </div>
            </div>

            {/* Recipients List Table */}
            {isRecipientsLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Đang tải danh sách người nhận...
              </div>
            ) : (recipientsData?.data || []).length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Không tìm thấy người nhận nào phù hợp bộ lọc.
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="px-4 py-2.5">Người dùng</th>
                      <th className="px-3 py-2.5">Vai trò</th>
                      <th className="px-3 py-2.5">Trạng thái</th>
                      <th className="px-3 py-2.5">Thời gian đọc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(recipientsData?.data || []).map((rc) => (
                      <tr key={rc.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={rc.userAvatar || undefined} />
                              <AvatarFallback className="text-[10px] font-bold bg-primary-soft text-primary">
                                {rc.userName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-bold text-foreground block text-xs">{rc.userName}</span>
                              <span className="text-[10px] text-muted-foreground">{rc.userEmail}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {rc.userRoles?.includes("teacher") ? (
                            <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50 border-purple-200">
                              Giáo viên
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-700 bg-slate-50">
                              Học viên
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {rc.isRead ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Đã đọc
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                              <Clock className="h-3 w-3 mr-1" /> Chưa đọc
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground text-[11px]">
                          {rc.readAt
                            ? new Date(rc.readAt).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination for recipients */}
            {recipientsData?.pagination && Math.ceil(recipientsData.pagination.total / 20) > 1 && (
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-muted-foreground">
                  Trang {recipientPage} / {Math.ceil(recipientsData.pagination.total / 20)}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={recipientPage <= 1}
                    onClick={() => setRecipientPage((p) => Math.max(1, p - 1))}
                    className="h-7 text-xs px-2 rounded-lg"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={recipientPage >= Math.ceil(recipientsData.pagination.total / 20)}
                    onClick={() => setRecipientPage((p) => p + 1)}
                    className="h-7 text-xs px-2 rounded-lg"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 7. AlertDialog Xác Nhận Xóa Thông Báo (Soft-Delete) ── */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black text-foreground">
              Xác nhận xóa thông báo khỏi danh sách?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Hành động này sẽ ẩn đợt phát thông báo khỏi giao diện quản trị. Dữ liệu lịch sử notification của học viên vẫn được bảo lưu an toàn cho mục đích kiểm tra và báo cáo hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && deleteMutation.mutate(deleteTargetId)}
              className="rounded-xl text-xs font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
