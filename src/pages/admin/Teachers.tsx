import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usersApi } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  User,
  ArrowUpDown,
  Plus,
  Edit,
  Loader2,
  Mail,
  Phone,
  GraduationCap,
  Eye,
  EyeOff,
  MoreVertical,
  BookOpen,
  BarChart2,
  Key,
  AlertTriangle,
  RefreshCw,
  UserX,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";

export const QUERY_KEYS = {
  ADMIN_TEACHERS: (params?: Record<string, any>) => ["admin-teachers", params] as const,
  ADMIN_STATS: ["admin-stats"] as const,
  TEACHERS_LIST: ["teachers-list"] as const,
} as const;

export const buildTeacherWorkspaceUrl = (id: string) => `/admin/teacher-workspace?id=${id}`;

type SortField = "fullName" | "email" | "activeClassesCount" | "createdAt";
type StatusFilter = "all" | "teaching" | "unassigned" | "inactive";

const emptyForm = {
  email: "",
  password: "",
  fullName: "",
  role: "teacher",
  gender: "",
  dateOfBirth: "",
  phone: "",
  parentName: "",
  parentPhone: "",
};

export default function AdminTeachers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog & Toggle Safety State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  // Confirm Toggle Safety State
  const [confirmUser, setConfirmUser] = useState<any>(null);
  const [pendingActiveState, setPendingActiveState] = useState<boolean>(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    role: "teacher",
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.ADMIN_TEACHERS(queryParams),
    queryFn: () => usersApi.list(queryParams),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return usersApi.update(id, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS });
      toast({
        title: variables.isActive
          ? "Đã kích hoạt tài khoản giáo viên"
          : "Đã vô hiệu hóa tài khoản giáo viên",
      });
      setConfirmUser(null);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái tài khoản",
        variant: "destructive",
      });
      setConfirmUser(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof emptyForm) => usersApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEACHERS_LIST });
      toast({ title: "Đã thêm giáo viên mới" });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      const msg =
        err?.message ||
        err?.response?.data?.error ||
        "Không thể tạo giáo viên. Vui lòng kiểm tra dữ liệu!";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => usersApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEACHERS_LIST });
      toast({ title: "Đã cập nhật thông tin giáo viên" });
      setDialogOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật",
        variant: "destructive",
      });
    },
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingUser(user);
    setForm({
      email: user.email || "",
      password: "",
      fullName: user.fullName || "",
      role: "teacher",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      phone: user.phone || "",
      parentName: user.parentName || "",
      parentPhone: user.parentPhone || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      const { email, password, ...rest } = form;
      updateMutation.mutate({ id: editingUser.id, ...rest });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleToggleClick = (user: any, checked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checked) {
      setConfirmUser(user);
      setPendingActiveState(false);
    } else {
      toggleMutation.mutate({ id: user.id, isActive: true });
    }
  };

  const rawTeachers = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  // Derive Teacher Status Helper
  const getTeacherStatus = (t: any): "teaching" | "unassigned" | "inactive" => {
    if (!t.isActive) return "inactive";
    if ((t.activeClassesCount || 0) === 0) return "unassigned";
    return "teaching";
  };

  // Stats calculation
  const teachingCount = rawTeachers.filter((t: any) => getTeacherStatus(t) === "teaching").length;
  const unassignedCount = rawTeachers.filter((t: any) => getTeacherStatus(t) === "unassigned").length;
  const inactiveCount = rawTeachers.filter((t: any) => getTeacherStatus(t) === "inactive").length;

  // Filter & Sort
  const filteredTeachers = rawTeachers.filter((t: any) => {
    const status = getTeacherStatus(t);
    if (statusFilter === "teaching") return status === "teaching";
    if (statusFilter === "unassigned") return status === "unassigned";
    if (statusFilter === "inactive") return status === "inactive";
    return true;
  });

  const sortedTeachers = [...filteredTeachers].sort((a: any, b: any) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === "activeClassesCount") {
      valA = a.activeClassesCount || 0;
      valB = b.activeClassesCount || 0;
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Relative Time Helper
  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return "Chưa từng";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={`h-3 w-3 ${
            sortField === field ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Header & Subtitle Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý giáo viên</h1>
            <p className="text-sm text-muted-foreground">
              {total} giáo viên • {teachingCount} đang giảng dạy • {unassignedCount} chưa phân lớp • {inactiveCount} bị khóa
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm giáo viên
        </Button>
      </div>

      {/* Toolbar: Search + Chip Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Chip Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: "all", label: "Tất cả" },
            { id: "teaching", label: "Đang dạy" },
            { id: "unassigned", label: "Chưa phân lớp" },
            { id: "inactive", label: "Đã khóa" },
          ].map((chip) => (
            <Button
              key={chip.id}
              variant={statusFilter === chip.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(chip.id as StatusFilter)}
              className="h-8 rounded-full text-xs"
            >
              {chip.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortHeader field="fullName">Giáo viên</SortHeader>
              <SortHeader field="email">Email</SortHeader>
              <SortHeader field="activeClassesCount">Lớp đang dạy</SortHeader>
              <TableHead>Lần đăng nhập</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-9 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              // Error State
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm font-medium">Không thể tải danh sách giáo viên</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedTeachers.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-foreground">
                      {search ? "Không tìm thấy giáo viên phù hợp" : "Chưa có giáo viên nào"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search ? "Thử thay đổi từ khóa hoặc bộ lọc" : "Bắt đầu bằng cách thêm giáo viên mới"}
                    </p>
                    {!search && (
                      <Button variant="outline" size="sm" onClick={openCreate} className="mt-2">
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Thêm giáo viên
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedTeachers.map((teacher: any) => {
                const status = getTeacherStatus(teacher);
                const initials = (teacher.fullName || teacher.email || "G")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow
                    key={teacher.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Mở hồ sơ giáo viên ${teacher.fullName}`}
                    className="cursor-pointer hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:bg-muted/50"
                    onClick={() => navigate(buildTeacherWorkspaceUrl(teacher.id))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        navigate(buildTeacherWorkspaceUrl(teacher.id));
                      }
                    }}
                  >
                    {/* Column 1: Teacher Avatar + Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={teacher.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium text-sm block">
                            {teacher.fullName || "Chưa đặt tên"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {teacher.phone || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Column 2: Email */}
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground">{teacher.email}</span>
                      </div>
                    </TableCell>

                    {/* Column 3: Active Classes Count */}
                    <TableCell className="text-sm font-medium">
                      <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-md bg-muted text-foreground text-xs font-semibold">
                        {teacher.activeClassesCount || 0}
                      </span>
                    </TableCell>

                    {/* Column 4: Last Login Relative Time */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(teacher.lastLoginAt)}
                    </TableCell>

                    {/* Column 5: Status Badge */}
                    <TableCell>
                      {status === "teaching" && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 gap-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Đang dạy
                        </Badge>
                      )}
                      {status === "unassigned" && (
                        <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Chưa phân lớp
                        </Badge>
                      )}
                      {status === "inactive" && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" />
                          Ngừng cộng tác
                        </Badge>
                      )}
                    </TableCell>

                    {/* Column 6: Toggle Active Switch with Confirmation */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={teacher.isActive ?? true}
                        onCheckedChange={(checked) => handleToggleClick(teacher, checked, { stopPropagation: () => {} } as any)}
                        aria-label={`Bật hoặc tắt trạng thái ${teacher.fullName}`}
                      />
                    </TableCell>

                    {/* Column 7: Grouped Action Menu */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu tác vụ</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Thông tin
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => openEdit(teacher, e)}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            Sửa thông tin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(buildTeacherWorkspaceUrl(teacher.id))}>
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Xem Workspace
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Giảng dạy
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/admin/classes?teacherId=${teacher.id}`)}>
                            <BookOpen className="mr-2 h-3.5 w-3.5" />
                            Phân công lớp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(buildTeacherWorkspaceUrl(teacher.id))}>
                            <BarChart2 className="mr-2 h-3.5 w-3.5" />
                            Xem thống kê
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Tài khoản
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toast({ title: "Email reset mật khẩu đã được gửi" })}>
                            <Key className="mr-2 h-3.5 w-3.5" />
                            Reset mật khẩu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`mailto:${teacher.email}`)}>
                            <Mail className="mr-2 h-3.5 w-3.5" />
                            Gửi email
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Nguy hiểm
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setConfirmUser(teacher);
                              setPendingActiveState(false);
                            }}
                          >
                            <UserX className="mr-2 h-3.5 w-3.5" />
                            Vô hiệu hóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {data && (
          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Safety Toggle Confirm Dialog */}
      <AlertDialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Vô hiệu hóa tài khoản giáo viên?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground pt-2">
                <p>
                  Bạn có chắc chắn muốn vô hiệu hóa giáo viên{" "}
                  <strong className="text-foreground">{confirmUser?.fullName || confirmUser?.email}</strong>?
                </p>
                {confirmUser && (
                  <div className="rounded-md bg-muted p-3 text-xs space-y-1 my-2">
                    <p className="font-medium text-foreground">Cảnh báo tác động nghiệp vụ:</p>
                    <p>• Số lớp đang phụ trách: <span className="font-semibold text-foreground">{confirmUser.activeClassesCount || 0} lớp</span></p>
                    <p>• Số bài chờ chấm: <span className="font-semibold text-foreground">{confirmUser.pendingSubmissionsCount || 0} bài</span></p>
                  </div>
                )}
                <p>Tài khoản bị vô hiệu hóa sẽ không thể đăng nhập vào hệ thống Teaching OS cho đến khi được kích hoạt lại.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmUser) {
                  toggleMutation.mutate({ id: confirmUser.id, isActive: pendingActiveState });
                }
              }}
            >
              {toggleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận vô hiệu hóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {editingUser ? "Chỉnh sửa thông tin giáo viên" : "Thêm giáo viên mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editingUser && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mật khẩu *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Họ tên</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                (!editingUser && (!form.email || !form.password)) ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? "Lưu thay đổi" : "Tạo giáo viên"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
