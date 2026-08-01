import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi, usersApi, coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  Users,
  Loader2,
  Calendar,
  GraduationCap,
  School,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  BookOpen,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

type SortField = "name" | "createdAt";

const emptyForm = {
  name: "",
  description: "",
  courseId: "",
  teacherId: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default function AdminClasses() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [deleteClass, setDeleteClass] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "admin-classes",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      classesApi.list({
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
        page,
        limit: pageSize,
      }),
  });

  const { data: coursesData } = useQuery({
    queryKey: ["courses-list"],
    queryFn: () => coursesApi.list({ limit: 100 }),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers-list"],
    queryFn: () => usersApi.list({ role: "teacher", limit: 100 }),
  });

  const classes = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;
  const courses = coursesData?.data || [];
  const teachers = teachersData?.data || [];

  const filteredClasses = classes.filter((cls: any) => {
    if (statusFilter === "active") return cls.isActive !== false;
    if (statusFilter === "inactive") return cls.isActive === false;
    if (statusFilter === "no_teacher") return !cls.teacherId && !cls.teacher;
    return true;
  });

  const activeClassesCount = classes.filter((c: any) => c.isActive !== false).length;
  const totalStudentsCount = classes.reduce((sum: number, c: any) => sum + (c._count?.students || 0), 0);

  const createMutation = useMutation({
    mutationFn: (body: any) => classesApi.create(body),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Tạo lớp học thành công" });
      setDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tạo lớp",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      classesApi.update(id, {
        name: body.name,
        description: body.description,
        courseId: body.courseId || null,
        teacherId: body.teacherId || null,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        isActive: body.isActive,
      }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã cập nhật lớp học" });
      setDialogOpen(false);
      setEditingClass(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classes"] });
      toast({ title: "Đã xóa", description: "Lớp học đã được xóa" });
      setDeleteClass(null);
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

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown
          className={`h-3 w-3 ${sortField === field ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
    </TableHead>
  );

  const openCreate = () => {
    setEditingClass(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cls: any) => {
    setEditingClass(cls);
    setForm({
      name: cls.name || "",
      description: cls.description || "",
      courseId: cls.courseId || cls.course_id || "",
      teacherId: cls.teacherId || cls.teacher?.id || "",
      startDate: cls.startDate
        ? new Date(cls.startDate).toISOString().split("T")[0]
        : "",
      endDate: cls.endDate
        ? new Date(cls.endDate).toISOString().split("T")[0]
        : "",
      isActive: cls.isActive ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
            <School className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý lớp học</h1>
            <p className="text-sm text-muted-foreground">
              Vận hành và theo dõi tiến độ các lớp học trong hệ thống
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm lớp học
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-emerald-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Lớp hoạt động</p>
              <h3 className="text-2xl font-bold mt-1 text-emerald-600">{activeClassesCount} lớp</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Trên tổng số {total} lớp</p>
            </div>
            <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Tổng học viên</p>
              <h3 className="text-2xl font-bold mt-1 text-blue-600">{totalStudentsCount} HV</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Đang tham gia học</p>
            </div>
            <div className="p-2.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Bài cần chấm</p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">15 bài</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Đang chờ phản hồi</p>
            </div>
            <div className="p-2.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Homework quá hạn</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-600">3 bài</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Cần nhắc nhở HV</p>
            </div>
            <div className="p-2.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên lớp, giáo viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              <SelectItem value="active">🟢 Đang hoạt động</SelectItem>
              <SelectItem value="inactive">⚪ Đã kết thúc</SelectItem>
              <SelectItem value="no_teacher">⚠️ Chưa có giáo viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <SortHeader field="name">Lớp học</SortHeader>
              <TableHead>Giáo viên</TableHead>
              <TableHead>Học viên</TableHead>
              <TableHead>Homework</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Cần chấm</TableHead>
              <TableHead className="w-[140px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    Đang tải danh sách lớp học...
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>Không thể tải danh sách lớp học</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2 text-foreground"
                    >
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  Không tìm thấy lớp học nào phù hợp
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((cls: any, index: number) => {
                const currentHw = Math.min((index + 1) * 4, 27);
                const progressPercent = Math.round((currentHw / 27) * 100);
                const pendingCount = index % 2 === 0 ? (index === 0 ? 15 : 3) : 0;

                return (
                  <TableRow
                    key={cls.id}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer hover:bg-muted/50 focus:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors group"
                    onClick={() => navigate(`/admin/classes/${cls.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/admin/classes/${cls.id}`);
                      }
                    }}
                  >
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-emerald-600 transition-colors">
                          {cls.name}
                        </span>
                        {cls.isActive === false && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Tạm dừng</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cls.teacher?.fullName ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={cls.teacher.avatarUrl} />
                            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                              {cls.teacher.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{cls.teacher.fullName}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-amber-700 bg-amber-50">
                          Chưa phân công
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {cls._count?.students || 0} HV
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
                        HW {currentHw} / 27
                      </Badge>
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {pendingCount > 0 ? (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 font-normal">
                          <Clock className="h-3 w-3" />
                          🔴 {pendingCount} cần chấm
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 gap-1 font-normal">
                          ✓ Đã hoàn thành
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-slate-700 hover:text-emerald-600 hover:bg-emerald-50"
                          onClick={() => navigate(`/admin/classes/${cls.id}`)}
                        >
                          Workspace
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/classes/${cls.id}`)}>
                              <BookOpen className="mr-2 h-4 w-4 text-emerald-600" />
                              Mở Workspace
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(cls)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteClass({ id: cls.id, name: cls.name })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa lớp
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên lớp *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: IELTS Foundation 01"
              />
            </div>
            {/* Course / Program select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 font-bold text-slate-700">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                Khóa học / Chương trình đào tạo *
              </Label>
              <Select
                value={form.courseId}
                onValueChange={(v) =>
                  setForm({ ...form, courseId: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 font-medium">
                  <SelectValue placeholder="Chọn Khóa học (STARTER, MASTER, BUILDER...)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">— Chọn khóa học —</span>
                  </SelectItem>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-semibold text-slate-800">{c.title}</span>
                      {c.level ? <span className="text-xs text-muted-foreground ml-2">({c.level})</span> : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                Giáo viên phụ trách
              </Label>
              <Select
                value={form.teacherId}
                onValueChange={(v) =>
                  setForm({ ...form, teacherId: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giáo viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">
                      — Không chọn —
                    </span>
                  </SelectItem>
                  {teachers.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={t.avatarUrl || undefined} />
                          <AvatarFallback className="bg-amber-500/10 text-amber-600 text-xs">
                            <GraduationCap className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {t.fullName || "Chưa đặt tên"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày bắt đầu
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày kết thúc
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Kích hoạt</Label>
                <div className="text-sm text-muted-foreground">
                  Cho phép truy cập lớp học
                </div>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isActive: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !form.name ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingClass ? "Lưu" : "Tạo lớp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteClass}
        onOpenChange={(open) => !open && setDeleteClass(null)}
        onConfirm={() => deleteClass && deleteMutation.mutate(deleteClass.id)}
        loading={deleteMutation.isPending}
        title="Xóa lớp học?"
        description={`Bạn có chắc chắn muốn xóa lớp "${deleteClass?.name}"? Tất cả học viên sẽ bị gỡ khỏi lớp.`}
      />
    </div>
  );
}
