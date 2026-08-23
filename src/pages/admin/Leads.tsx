import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllContactLeads,
  updateContactLead,
  createManualContactLead,
  checkDuplicateLeadPhone,
  convertLeadToStudent,
  ContactLead,
} from "@/lib/contactService";
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
  Plus,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  User,
  Sparkles,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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

const SOURCE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  offline_walkin: {
    label: "Quầy trực tiếp (Walk-in)",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  offline_call: {
    label: "Hotline",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  referral: {
    label: "Giới thiệu (Referral)",
    color: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  },
  event: {
    label: "Sự kiện / Hội thảo",
    color: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  },
  facebook_ad: {
    label: "Facebook Ads",
    color: "bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  contact_page: {
    label: "Website Form",
    color: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800",
  },
  quick_trial: {
    label: "Học thử Web",
    color: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  assessment: {
    label: "Khảo thí Web",
    color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
};

export default function AdminLeads() {
  const { selectedBranch, branches, primaryBranch } = useBranch();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<any>("NEW");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Quick Manual Intake State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    goal: "",
    source: "offline_walkin",
    preferredBranchId: "",
    notes: "",
  });
  const [duplicateWarnings, setDuplicateWarnings] = useState<any[]>([]);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  // Conversion Dialog State
  const [convertingLead, setConvertingLead] = useState<ContactLead | null>(null);
  const [convertForm, setConvertForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    branchId: "",
    password: "",
    status: "ENROLLED",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin_leads", selectedBranch],
    queryFn: () => fetchAllContactLeads({ preferredBranchId: selectedBranch }),
    refetchInterval: 30000, // Auto refresh every 30s
  });

  // Debounced Phone Duplicate Detection
  useEffect(() => {
    const cleanPhone = createForm.phone.trim().replace(/\s+/g, "");
    if (cleanPhone.length < 8) {
      setDuplicateWarnings([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingPhone(true);
      try {
        const duplicates = await checkDuplicateLeadPhone(cleanPhone);
        setDuplicateWarnings(duplicates);
      } catch (err) {
        console.warn("Failed to check duplicate phone:", err);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [createForm.phone]);

  // Mutation: Update Lead
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

  // Mutation: Create Manual Lead
  const createManualMutation = useMutation({
    mutationFn: async (payload: typeof createForm) => {
      return createManualContactLead({
        ...payload,
        preferredBranchId: payload.preferredBranchId || (selectedBranch !== "ALL" ? selectedBranch : branches[0]?.id || null),
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin_leads"] });
        toast({
          title: "Tiếp nhận thành công",
          description: "Thông tin khách tư vấn đã được lưu vào hệ thống.",
        });
        setIsCreateOpen(false);
        setCreateForm({
          fullName: "",
          phone: "",
          email: "",
          goal: "",
          source: "offline_walkin",
          preferredBranchId: "",
          notes: "",
        });
        setDuplicateWarnings([]);
      } else {
        toast({
          title: "Lỗi tiếp nhận",
          description: res.error || "Không thể tạo thông tin tư vấn.",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi kết nối",
        description: err?.message || "Không thể gửi dữ liệu lên máy chủ.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Convert Lead to LMS Student
  const convertMutation = useMutation({
    mutationFn: async ({
      leadId,
      payload,
    }: {
      leadId: string;
      payload: typeof convertForm;
    }) => {
      return convertLeadToStudent(leadId, payload);
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin_leads"] });
        queryClient.invalidateQueries({ queryKey: ["admin-students-management"] });
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        toast({
          title: "Chuyển đổi thành công!",
          description: `Đã tạo tài khoản LMS cho học viên (${convertForm.email}) và liên kết hồ sơ khách tư vấn.`,
        });
        setConvertingLead(null);
      } else {
        toast({
          title: "Chuyển đổi thất bại",
          description: res.error || "Không thể tạo tài khoản học viên.",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi chuyển đổi",
        description: err?.message || "Lỗi xử lý giao dịch chuyển đổi.",
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

  const handleOpenCreate = () => {
    const defaultBranchId = selectedBranch !== "ALL" ? selectedBranch : (primaryBranch?.id || branches[0]?.id || "");
    setCreateForm({
      fullName: "",
      phone: "",
      email: "",
      goal: "",
      source: "offline_walkin",
      preferredBranchId: defaultBranchId,
      notes: "",
    });
    setDuplicateWarnings([]);
    setIsCreateOpen(true);
  };

  const handleOpenConvert = (lead: ContactLead) => {
    const defaultBranchId = lead.preferredBranchId || (selectedBranch !== "ALL" ? selectedBranch : (primaryBranch?.id || branches[0]?.id || ""));
    setConvertingLead(lead);
    setConvertForm({
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email || "",
      branchId: defaultBranchId,
      password: "",
      status: "ENROLLED",
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
      const matchSource = lead.source?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchGoal || matchSource;
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
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            Quản Lý Khách Tư Vấn (Leads)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi danh sách khách hàng tiếp cận qua Website, Hotline và Quầy trực tiếp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 rounded-xl h-9"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-9 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nhập khách tư vấn</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo Tên, Số điện thoại, Email, Khóa học, Nguồn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background h-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[190px] h-10 rounded-xl bg-background">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tất cả trạng thái ({leads.length})</SelectItem>
              <SelectItem value="NEW">🔵 Mới tiếp nhận</SelectItem>
              <SelectItem value="CONTACTED">🟡 Đã liên hệ</SelectItem>
              <SelectItem value="ENROLLED">🟢 Đã nhập học</SelectItem>
              <SelectItem value="CANCELLED">🔴 Hủy / Mất lead</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Đang tải danh sách khách tư vấn...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <div>
              <p className="font-semibold text-foreground">Không tìm thấy yêu cầu tư vấn nào</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Khi có khách để lại thông tin hoặc nhân viên nhập thủ công, dữ liệu sẽ hiển thị ở đây.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreate}
              className="mt-2 rounded-xl text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Nhập khách hàng đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Khách hàng</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Cơ sở</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Nhu cầu / Mục tiêu</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Nguồn tiếp cận</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Tiếp nhận lúc</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Trạng thái</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Liên kết LMS</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const normStatus = lead.status?.toUpperCase() || "NEW";
                  const statusInfo = STATUS_CONFIG[normStatus] || STATUS_CONFIG.NEW;
                  const sourceKey = lead.source || "contact_page";
                  const sourceInfo = SOURCE_CONFIG[sourceKey] || {
                    label: sourceKey,
                    color: "bg-slate-500/10 text-slate-700 border-slate-200",
                  };
                  const isConverted = !!lead.convertedUserId;

                  return (
                    <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                      {/* Customer Info */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground text-sm">{lead.fullName}</span>
                          </div>
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

                      {/* Goal / Nhu cầu */}
                      <TableCell className="max-w-xs">
                        <p className="text-xs font-medium text-foreground whitespace-pre-wrap">
                          {lead.goal || <span className="text-muted-foreground italic">Chưa ghi nhận</span>}
                        </p>
                      </TableCell>

                      {/* Source */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold px-2 py-0.5 border ${sourceInfo.color}`}
                        >
                          {sourceInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Created At & Staff Creator */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground/70" />
                            {formatDate(lead.createdAt)}
                          </span>
                          {lead.createdByUser?.fullName && (
                            <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" />
                              Tạo bởi: {lead.createdByUser.fullName}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status Selector */}
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

                      {/* LMS Conversion Column */}
                      <TableCell>
                        {isConverted ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-xs font-semibold gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Đã có User LMS
                            </Badge>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenConvert(lead)}
                            className="h-7 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 font-semibold rounded-lg"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-primary" />
                            <span>Tạo Học viên</span>
                          </Button>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(lead)}
                          className="h-8 px-2.5 text-xs gap-1 hover:bg-muted rounded-lg"
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

      {/* QUICK INTAKE DIALOG (10-15s Quick Form) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nhập Nhanh Khách Tư Vấn Offline
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* DUPLICATE PHONE ALERT BANNER */}
            {duplicateWarnings.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cảnh báo trùng số điện thoại ({duplicateWarnings.length} kết quả):</span>
                </div>
                <div className="space-y-1 pl-5">
                  {duplicateWarnings.map((dup) => (
                    <div key={dup.id} className="flex justify-between items-center">
                      <span>• <strong>{dup.fullName}</strong> ({dup.source || "Web"}) - {formatDate(dup.createdAt)}</span>
                      <Badge variant="outline" className="text-[10px] py-0 h-4">{dup.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Họ và tên <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider flex justify-between">
                  <span>Số điện thoại <span className="text-rose-500">*</span></span>
                  {isCheckingPhone && <span className="text-[10px] text-muted-foreground font-normal animate-pulse">Đang kiểm tra...</span>}
                </Label>
                <Input
                  placeholder="0901234567"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="rounded-xl h-10 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Nguồn tiếp cận <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={createForm.source}
                  onValueChange={(val) => setCreateForm({ ...createForm, source: val })}
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    <SelectItem value="offline_walkin">🏢 Quầy trực tiếp (Walk-in)</SelectItem>
                    <SelectItem value="offline_call">📞 Gọi điện Hotline</SelectItem>
                    <SelectItem value="referral">🤝 Người quen giới thiệu</SelectItem>
                    <SelectItem value="event">🎪 Sự kiện / Hội thảo</SelectItem>
                    <SelectItem value="contact_page">🌐 Website Form</SelectItem>
                    <SelectItem value="facebook_ad">📱 Facebook Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Cơ sở mong muốn học
                </Label>
                {branches.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-2.5 text-xs text-muted-foreground bg-muted/30">
                    Chưa có cơ sở nào.{" "}
                    <Link to="/admin/settings" className="text-primary underline font-medium hover:text-primary/80">
                      Thiết lập tại Cài đặt
                    </Link>
                  </div>
                ) : (
                  <Select
                    value={createForm.preferredBranchId}
                    onValueChange={(val) => setCreateForm({ ...createForm, preferredBranchId: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Chọn cơ sở..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} {b.isPrimary && "★ (Cơ sở chính)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>


            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Email (Tùy chọn)
              </Label>
              <Input
                type="email"
                placeholder="email@gmail.com (không bắt buộc)"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Mục tiêu Band điểm / Khóa học quan tâm
              </Label>
              <Input
                placeholder="VD: Target 6.5+ cấp tốc, Học thử lớp Foundation..."
                value={createForm.goal}
                onChange={(e) => setCreateForm({ ...createForm, goal: e.target.value })}
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">
                Ghi chú cuộc gặp / Tư vấn ban đầu
              </Label>
              <Textarea
                placeholder="VD: Khách đến trung tâm sáng nay, hẹn tối thứ 4 mang kết quả test đến đăng ký..."
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                rows={3}
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!createForm.fullName.trim() || !createForm.phone.trim()) {
                  toast({
                    title: "Thiếu thông tin",
                    description: "Vui lòng nhập đầy đủ Họ tên và Số điện thoại.",
                    variant: "destructive",
                  });
                  return;
                }
                createManualMutation.mutate(createForm);
              }}
              disabled={createManualMutation.isPending}
              className="rounded-xl font-bold bg-primary text-primary-foreground gap-1.5"
            >
              {createManualMutation.isPending ? "Đang lưu..." : "Lưu Khách Tư Vấn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONVERT LEAD TO LMS STUDENT DIALOG */}
      <Dialog open={!!convertingLead} onOpenChange={(open) => !open && setConvertingLead(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Chuyển Thành Học Viên Chính Thức
            </DialogTitle>
          </DialogHeader>

          {convertingLead && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-1 text-foreground">
                <p className="font-semibold flex items-center gap-1 text-primary">
                  <Sparkles className="w-3.5 h-3.5" /> Giao dịch nguyên tử (Atomic Transaction):
                </p>
                <p className="text-muted-foreground">
                  Hệ thống sẽ tạo tài khoản xác thực Supabase, tạo Profile LMS quyền <strong>Student</strong>, gán cơ sở trực thuộc và liên kết mã Lead <strong>{convertingLead.id.substring(0, 8)}...</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Email đăng nhập LMS <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="student@gmail.com"
                  value={convertForm.email}
                  onChange={(e) => setConvertForm({ ...convertForm, email: e.target.value })}
                  className="rounded-xl h-10 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Họ và tên
                  </Label>
                  <Input
                    value={convertForm.fullName}
                    onChange={(e) => setConvertForm({ ...convertForm, fullName: e.target.value })}
                    className="rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Số điện thoại
                  </Label>
                  <Input
                    value={convertForm.phone}
                    onChange={(e) => setConvertForm({ ...convertForm, phone: e.target.value })}
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Cơ sở phụ trách
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    (Dùng thống kê, không giới hạn lớp học)
                  </span>
                </div>
                {branches.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-2.5 text-xs text-muted-foreground bg-muted/30">
                    Chưa có cơ sở nào được thiết lập.{" "}
                    <Link to="/admin/settings" className="text-primary underline font-medium hover:text-primary/80">
                      Vào Cài đặt hệ thống
                    </Link>
                  </div>
                ) : (
                  <Select
                    value={convertForm.branchId}
                    onValueChange={(val) => setConvertForm({ ...convertForm, branchId: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Chọn cơ sở phụ trách..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} {b.isPrimary && "★ (Cơ sở chính)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>


              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider">
                  Mật khẩu khởi tạo (Tùy chọn)
                </Label>
                <Input
                  type="text"
                  placeholder="Tự động tạo ngẫu nhiên nếu để trống"
                  value={convertForm.password}
                  onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
                  className="rounded-xl h-10"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              onClick={() => setConvertingLead(null)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!convertForm.email.trim() || !convertForm.email.includes("@")) {
                  toast({
                    title: "Thiếu Email",
                    description: "Vui lòng nhập địa chỉ Email hợp lệ để tạo tài khoản đăng nhập.",
                    variant: "destructive",
                  });
                  return;
                }
                if (convertingLead) {
                  convertMutation.mutate({
                    leadId: convertingLead.id,
                    payload: convertForm,
                  });
                }
              }}
              disabled={convertMutation.isPending}
              className="rounded-xl font-bold bg-primary text-primary-foreground gap-1.5"
            >
              {convertMutation.isPending ? "Đang xử lý..." : "Xác Nhận Chuyển Đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <span className="text-muted-foreground font-medium">Nguồn:</span>
                  <Badge variant="outline" className="text-xs">
                    {SOURCE_CONFIG[selectedLead.source || ""]?.label || selectedLead.source || "Website"}
                  </Badge>
                </div>
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
                {selectedLead.convertedUserId && (
                  <div className="flex justify-between items-center pt-1 border-t border-border/50">
                    <span className="text-muted-foreground font-medium">Tài khoản LMS:</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">
                      {selectedLead.convertedUser?.email || "Đã liên kết"}
                    </Badge>
                  </div>
                )}
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
