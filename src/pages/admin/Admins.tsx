import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ArrowUpDown,
  Plus,
  Edit,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";

type SortField = "fullName" | "email" | "createdAt";

const emptyForm = {
  email: "",
  password: "",
  fullName: "",
  role: "admin",
  gender: "",
  dateOfBirth: "",
  phone: "",
};

export default function AdminAdmins() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-admins",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      usersApi.list({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        role: "admin",
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return usersApi.update(id, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      toast({ title: "Đã cập nhật trạng thái quản trị viên" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof emptyForm) => usersApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      toast({ title: "Đã thêm quản trị viên mới" });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      const msg = err?.message || err?.response?.data?.error || "Không thể tạo quản trị viên. Vui lòng kiểm tra dữ liệu!";
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
      queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      toast({ title: "Đã cập nhật quản trị viên" });
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

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      email: user.email || "",
      password: "",
      fullName: user.fullName || "",
      role: "admin",
      gender: user.gender || "",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      phone: user.phone || "",
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

  const adminsList = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý Quản trị viên (Admin)</h1>
            <p className="text-sm text-muted-foreground">
              {total} tài khoản admin hệ thống
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Quản trị viên
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo email hoặc tên admin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quản trị viên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    Đang tải...
                  </div>
                </TableCell>
              </TableRow>
            ) : adminsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Chưa có tài khoản Admin nào
                </TableCell>
              </TableRow>
            ) : (
              adminsList.map((admin: any) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={admin.avatarUrl || undefined} />
                        <AvatarFallback className="bg-amber-100 text-amber-800 font-bold">
                          <ShieldCheck className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {admin.fullName || "Admin System"}
                        </span>
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
                          Admin
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {admin.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {admin.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {admin.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(admin.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={admin.isActive ?? true}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: admin.id,
                          isActive: checked,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(admin)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
              {editingUser ? "Chỉnh sửa Admin" : "Thêm Quản trị viên mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {!editingUser && (
              <>
                <div className="space-y-2">
                  <Label>Email Đăng nhập *</Label>
                  <Input
                    type="email"
                    placeholder="admin@ielts.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mật khẩu * (Hiển thị trực tiếp)</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu Admin"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="pr-10 font-mono bg-amber-50/40 border-amber-200 font-bold"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Họ và Tên Admin *</Label>
              <Input
                placeholder="VD: Nguyễn Văn Admin"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Số điện thoại liên hệ</Label>
              <Input
                placeholder="0901234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              disabled={
                (!editingUser && (!form.email || !form.password)) ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingUser ? "Lưu thay đổi" : "Tạo Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
