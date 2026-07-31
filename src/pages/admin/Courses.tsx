import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SortField = "title" | "createdAt" | "level";

export default function AdminCourses() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteCourse, setDeleteCourse] = useState<{ id: string; title: string; isLocked?: boolean } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin-courses",
      debouncedSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    ],
    queryFn: () =>
      coursesApi.list({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortField,
        sortOrder,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return coursesApi.update(id, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Đã cập nhật trạng thái" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      coursesApi.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({
        title: "Đã chuyển trạng thái",
        description: "Khóa học đã được ngừng hoạt động",
      });
      setDeleteCourse(null);
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err.response?.data?.error || "Không thể xóa khóa học",
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

  const courses = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
            <p className="text-sm text-muted-foreground">
              {total} khóa học trong hệ thống
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/admin/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khóa học
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="title">Tên khóa học</SortHeader>
              <SortHeader field="level">Cấp độ</SortHeader>
              <TableHead>Xuất bản</TableHead>
              <TableHead>Kích hoạt</TableHead>
              <TableHead className="w-[180px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : courses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Không tìm thấy khóa học nào
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course: any) => (
                <TableRow key={course.id}>
                  <TableCell className="font-bold text-slate-800">{course.title}</TableCell>
                  <TableCell className="text-slate-500 capitalize">{course.level || "beginner"}</TableCell>
                  <TableCell>
                    <Badge
                      className={(course.is_published ?? course.isPublished) ? "bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3 py-1 text-xs" : "bg-slate-100 text-slate-600 border-0 rounded-full px-3 py-1 text-xs"}
                    >
                      {(course.is_published ?? course.isPublished) ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={(course.is_active ?? course.isActive) ?? true}
                      className="data-[state=checked]:bg-emerald-600"
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: course.id, isActive: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                              asChild
                            >
                              <Link to={`/admin/courses/${course.id}`}>
                                <Edit className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Chỉnh sửa</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 border border-rose-100"
                              disabled={false}
                              onClick={() =>
                                setDeleteCourse({
                                  id: course.id,
                                  title: course.title,
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xóa khóa học</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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

      <DeleteConfirmDialog
        open={!!deleteCourse}
        onOpenChange={(open) => !open && setDeleteCourse(null)}
        onConfirm={(payload) =>
          deleteCourse &&
          payload?.password &&
          deleteMutation.mutate({ id: deleteCourse.id, password: payload.password })
        }
        loading={deleteMutation.isPending}
        title="Xóa khóa học?"
        description={`Bạn có chắc chắn muốn xóa khóa học "${deleteCourse?.title}"? Dữ liệu sẽ mất vĩnh viễn.`}
        confirmKeyword="XOA"
        requirePassword
      />
    </div>
  );
}
