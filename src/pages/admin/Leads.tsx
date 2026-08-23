import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllContactLeads, updateContactLead, ContactLead } from "@/lib/contactService";
import { useBranch } from "@/contexts/BranchContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Phone,
  Mail,
  RefreshCw,
  Edit3,
  Inbox,
  Filter,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  NEW: {
    label: "Mới tiếp nhận",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200",
  },
  new: {
    label: "Mới tiếp nhận",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200",
  },
  CONTACTED: {
    label: "Đã liên hệ",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200",
  },
  contacted: {
    label: "Đã liên hệ",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200",
  },
  ENROLLED: {
    label: "Đã nhập học",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200",
  },
  enrolled: {
    label: "Đã nhập học",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200",
  },
  CANCELLED: {
    label: "Hủy / Mất lead",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200",
  },
  ARCHIVED: {
    label: "Lưu trữ",
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200",
  },
};

export default function AdminLeads() {
  const { selectedBranch } = useBranch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<any>("NEW");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin_leads", selectedBranch],
    queryFn: () => fetchAllContactLeads({ preferredBranchId: selectedBranch }),
    refetchInterval: 30000, // Auto refresh every 30s
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status?: any;
      notes?: string;
    }) => {
      return updateContactLead(id, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_leads"] });
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin tư vấn lead đã được lưu.",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Lỗi cập nhật",
        description: "Không thể lưu thông tin, vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleOpenEdit = (lead: ContactLead) => {
    setSelectedLead(lead);
    setEditNotes(lead.notes || "");
    const normalizedStatus = lead.status?.toUpperCase() || "NEW";
    setEditStatus(normalizedStatus);
    setIsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedLead) return;
    updateMutation.mutate({
      id: selectedLead.id,
      status: editStatus,
      notes: editNotes,
    });
  };

  const handleQuickStatusChange = (lead: ContactLead, newStatus: any) => {
    updateMutation.mutate({
      id: lead.id,
      status: newStatus,
      notes: lead.notes,
    });
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const normStatus = lead.status?.toUpperCase() || "NEW";
    if (statusFilter !== "ALL" && normStatus !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = lead.fullName?.toLowerCase().includes(q);
      const matchPhone = lead.phone?.toLowerCase().includes(q);
      const matchEmail = lead.email?.toLowerCase().includes(q);
      const matchGoal = lead.goal?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchGoal;
    }
    return true;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Quản Lý Khách Tư Vấn (Leads)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi khách hàng đăng ký học thử và liên hệ tư vấn từ website ARIS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo Tên, Số điện thoại, Email, Khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl bg-background">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tất cả trạng thái ({leads.length})</SelectItem>
              <SelectItem value="NEW">Mới tiếp nhận</SelectItem>
              <SelectItem value="CONTACTED">Đã liên hệ</SelectItem>
              <SelectItem value="ENROLLED">Đã nhập học</SelectItem>
              <SelectItem value="CANCELLED">Hủy / Mất lead</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">Đang tải danh sách khách tư vấn...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-semibold text-foreground">Không tìm thấy yêu cầu tư vấn nào</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Khi có người điền form học thử trên web, thông tin sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Khách hàng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Cơ sở</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Khóa & Ca học quan tâm</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Nguồn</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Thời gian</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Ghi chú</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const normStatus = lead.status?.toUpperCase() || "NEW";
                  const statusInfo = STATUS_CONFIG[normStatus] || STATUS_CONFIG.NEW;

                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                      {/* Customer Info */}
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground text-sm">{lead.fullName}</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              <Phone className="w-3 h-3" />
                              {lead.phone}
                            </a>
                            {lead.email && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                • <Mail className="w-3 h-3" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Preferred Branch */}
                      <TableCell>
                        {lead.preferredBranch ? (
                          <Badge variant="outline" className="gap-1 text-xs font-normal border-primary/20 bg-primary/5">
                            <MapPin className="h-3 w-3 text-primary" />
                            {lead.preferredBranch.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>

                      {/* Course / Shift */}
                      <TableCell className="max-w-xs">
                        <p className="text-xs font-medium text-foreground whitespace-pre-wrap">
                          {lead.goal || "Chưa chọn chi tiết"}
                        </p>
                      </TableCell>

                      {/* Source */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] font-medium bg-muted/50">
                          {lead.source || "web_form"}
                        </Badge>
                      </TableCell>

                      {/* Created At */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(lead.createdAt)}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Select
                          value={normStatus}
                          onValueChange={(val) => handleQuickStatusChange(lead, val)}
                        >
                          <SelectTrigger className="h-8 w-[140px] text-xs font-bold rounded-lg border">
                            <SelectValue>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    normStatus === "NEW"
                                      ? "bg-blue-500"
                                      : normStatus === "CONTACTED"
                                      ? "bg-amber-500"
                                      : normStatus === "ENROLLED"
                                      ? "bg-emerald-500"
                                      : "bg-rose-500"
                                  }`}
                                />
                                {statusInfo.label}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl text-xs">
                            <SelectItem value="NEW">Mới tiếp nhận</SelectItem>
                            <SelectItem value="CONTACTED">Đã liên hệ</SelectItem>
                            <SelectItem value="ENROLLED">Đã nhập học</SelectItem>
                            <SelectItem value="CANCELLED">Hủy / Mất lead</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Notes preview */}
                      <TableCell className="max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.notes || <span className="italic text-muted-foreground/60">Chưa có ghi chú</span>}
                        </p>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(lead)}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Notes & Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              Chi Tiết Khách Tư Vấn
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-4 rounded-2xl bg-muted/50 space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Khách hàng:</span>
                  <span className="font-bold text-foreground">{selectedLead.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Số điện thoại:</span>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {selectedLead.phone}
                  </a>
                </div>
                {selectedLead.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Email:</span>
                    <span className="font-medium text-foreground">{selectedLead.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Nhu cầu / Ca học:</span>
                  <span className="font-medium text-foreground text-right max-w-[240px]">
                    {selectedLead.goal || "Chưa có"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Thời gian tạo:</span>
                  <span className="text-muted-foreground">{formatDate(selectedLead.createdAt)}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Trạng thái xử lý
                </Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="NEW">🔵 Mới tiếp nhận (NEW)</SelectItem>
                    <SelectItem value="CONTACTED">🟡 Đã liên hệ (CONTACTED)</SelectItem>
                    <SelectItem value="ENROLLED">🟢 Đã nhập học (ENROLLED)</SelectItem>
                    <SelectItem value="CANCELLED">🔴 Hủy / Mất lead (CANCELLED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes Area */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Ghi chú của tư vấn viên
                </Label>
                <Textarea
                  placeholder="Ví dụ: Đã gọi lúc 10h, hẹn tối thứ 2 tới test trực tiếp..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl"
            >
              Đóng
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="rounded-xl font-bold"
            >
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
