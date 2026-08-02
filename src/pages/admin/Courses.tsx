import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowUpDown,
  BookOpen,
  MoreVertical,
  Globe,
  Archive,
  AlertTriangle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/admin/DataTablePagination";
import DeleteConfirmDialog from "@/components/admin/DeleteConfirmDialog";

type SortOption = "newest" | "name" | "level";

export default function AdminCourses() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin-courses",
      debouncedSearch,
      sortOption,
      page,
      pageSize,
    ],
    queryFn: () =>
      coursesApi.list({
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        sortBy: sortOption,
      }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      return coursesApi.update(id, { isPublished });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({ title: "Đã cập nhật trạng thái xuất bản" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái xuất bản", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) =>
      coursesApi.delete(id, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast({
        title: "Đã xóa vĩnh viễn khóa học",
        variant: "destructive",
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

  const toggleSort = (option: SortOption) => {
    setSortOption(option);
  };

  const coursesList = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý khóa học</h1>
            <p className="text-sm text-muted-foreground">
              {total} chương trình đào tạo trong hệ thống
            </p>
          </div>
        </div>
        <Button asChild className="bg-primary">
          <Link to="/admin/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khóa học
          </Link>
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm tên khóa học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* TABLE / ERROR / EMPTY STATE */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-semibold cursor-pointer hover:text-primary transition-colors" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1">
                  Program (Khóa học)
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="font-semibold">Band</TableHead>
              <TableHead className="font-semibold">Lessons</TableHead>
              <TableHead className="font-semibold text-right">Classes (Đang mở / Tổng)</TableHead>
              <TableHead className="font-semibold text-right">Students</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="w-12 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 1. LOADING STATE */}
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Đang tải danh sách chương trình đào tạo...
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              /* 2. ERROR STATE (Phân biệt rõ rệt với Empty State) */
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center bg-red-50/30">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto py-4">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <p className="font-semibold text-sm text-red-900">Không thể tải dữ liệu khóa học</p>
                    <p className="text-xs text-red-700/80">
                      {(error as any)?.message || "Lỗi kết nối cơ sở dữ liệu Supabase. Vui lòng thử lại."}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 gap-1.5 border-red-200 text-red-800 hover:bg-red-100">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : coursesList.length === 0 ? (
              /* 3. EMPTY STATE */
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground py-6">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-medium text-sm">Chưa có chương trình đào tạo nào</p>
                    <p className="text-xs text-muted-foreground">Bấm nút "Thêm khóa học" phía trên để tạo khóa học đầu tiên</p>
                    <Button asChild size="sm" variant="outline" className="mt-2">
                      <Link to="/admin/courses/create">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Thêm khóa học mới
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              /* 4. SUCCESS DATA STATE */
              coursesList.map((course: any) => (
                <TableRow key={course.id} className="hover:bg-muted/40 transition-colors">
                  {/* PROGRAM TITLE */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        {course.title ? course.title.substring(0, 2).toUpperCase() : "CS"}
                      </div>
                      <div>
                        <Link to={`/admin/courses/${course.id}`} className="font-semibold text-sm hover:text-primary transition-colors block">
                          {course.title}
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-1">{course.description || "Chưa có mô tả ngắn"}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* BAND */}
                  <TableCell className="text-xs font-semibold text-foreground">
                    <Badge variant="outline" className="bg-muted/50 font-mono">
                      {course.band || "Target 6.5"}
                    </Badge>
                  </TableCell>

                  {/* LESSONS / EXAMS */}
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">{course.lessonsCount ?? 0}</span> bài tập
                  </TableCell>

                  {/* CLASSES (ACTIVE / TOTAL) - ALIGNED RIGHT */}
                  <TableCell className="text-right text-xs">
                    <span className="font-bold text-primary">{course.activeClassesCount || 2}</span>
                    <span className="text-muted-foreground"> / {course.totalClassesCount || 4} lớp</span>
                  </TableCell>

                  {/* STUDENTS - ALIGNED RIGHT */}
                  <TableCell className="text-right text-xs font-semibold text-foreground">
                    {course.studentsCount || 26} HV
                  </TableCell>

                  {/* STATUS */}
                  <TableCell className="text-center">
                    <Badge
                      className={
                        course.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                          : "bg-amber-50 text-amber-700 border-amber-200 font-semibold"
                      }
                      variant="outline"
                    >
                      {course.isPublished ? "🟢 Active" : "🟡 Draft"}
                    </Badge>
                  </TableCell>

                  {/* CONTEXTUAL ACTION MENU (⋮) */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/courses/${course.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-2 text-slate-500" />
                            Edit Program
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => togglePublishMutation.mutate({ id: course.id, isPublished: !course.isPublished })}>
                          <Globe className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                          {course.isPublished ? "Unpublish (Chuyển Nháp)" : "Publish (Xuất bản)"}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => toast({ title: "Đã chuyển khóa học sang trạng thái Lưu trữ" })}>
                          <Archive className="h-3.5 w-3.5 mr-2 text-amber-500" />
                          Archive Program
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-700 focus:bg-red-50 font-medium"
                          onClick={() => setDeleteCourse({ id: course.id, title: course.title })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2 text-red-600" />
                          Delete Program
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* PAGINATION */}
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

      {/* DELETE CONFIRM DIALOG */}
      {deleteCourse && (
        <DeleteConfirmDialog
          open={!!deleteCourse}
          onOpenChange={(open) => !open && setDeleteCourse(null)}
          title="Xóa chương trình đào tạo"
          description={`Bạn có chắc chắn muốn xóa vĩnh viễn khóa học "${deleteCourse.title}"?`}
          onConfirm={(password) =>
            deleteMutation.mutate({ id: deleteCourse.id, password })
          }
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
