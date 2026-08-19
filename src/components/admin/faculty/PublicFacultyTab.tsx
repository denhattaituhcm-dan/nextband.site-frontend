import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FacultyProfile, facultyService } from "@/lib/facultyService";
import { FacultyCard } from "./FacultyCard";
import { FacultyDrawer } from "./FacultyDrawer";
import { Button } from "@/components/ui/button";
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
  Plus,
  Award,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function PublicFacultyTab() {
  const queryClient = useQueryClient();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FacultyProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: facultyList = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-faculty-profiles"],
    queryFn: () => facultyService.getAllFaculty(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      facultyService.togglePublished(id, isPublished),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-faculty-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["public-faculty-profiles"] });
      toast.success(
        variables.isPublished
          ? "Đã bật hiển thị giảng viên trên website"
          : "Đã ẩn giảng viên khỏi website"
      );
    },
    onError: (err: any) => {
      toast.error(`Không thể thay đổi trạng thái: ${err.message || "Đã xảy ra lỗi"}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facultyService.deleteFaculty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faculty-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["public-faculty-profiles"] });
      toast.success("Đã xóa hồ sơ giảng viên");
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast.error(`Không thể xóa hồ sơ: ${err.message || "Đã xảy ra lỗi"}`);
      setDeletingId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (profile: FacultyProfile) => {
    setEditingProfile(profile);
    setIsDrawerOpen(true);
  };

  const handleTogglePublish = (id: string, isPublished: boolean) => {
    toggleMutation.mutate({ id, isPublished });
  };

  const publishedCount = facultyList.filter((f) => f.is_published).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-5 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Hồ sơ công khai
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-blue-soft text-brand-blue border border-brand-blue/20">
              {facultyList.length} giảng viên · {publishedCount} đang hiển thị
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý thông tin giảng viên và bảng điểm IELTS TRF được hiển thị trên trang công khai{" "}
            <a
              href="/teachers"
              target="_blank"
              rel="noreferrer"
              className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>/teachers</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-10 rounded-xl px-3"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="h-10 rounded-xl px-4 text-xs sm:text-sm font-extrabold bg-brand-red hover:bg-brand-red-hover text-white shadow-xs gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm giảng viên</span>
          </Button>
        </div>
      </div>

      {/* Faculty Cards List */}
      {isLoading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center space-y-3 p-8 border border-dashed rounded-2xl bg-muted/20">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Đang tải danh sách hồ sơ giảng viên...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm font-bold text-foreground">Không thể tải dữ liệu hồ sơ giảng viên</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            Thử lại
          </Button>
        </div>
      ) : facultyList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed border-border/80 bg-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue-soft text-brand-blue flex items-center justify-center mx-auto">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Chưa có hồ sơ giảng viên nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Bắt đầu tạo hồ sơ giảng viên đầu tiên để hiển thị bảng điểm và kinh nghiệm chuyên môn trên website.
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="rounded-xl font-bold text-xs bg-brand-red hover:bg-brand-red-hover text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Thêm giảng viên ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {facultyList.map((profile) => (
            <FacultyCard
              key={profile.id}
              profile={profile}
              onEdit={handleOpenEdit}
              onDelete={(id) => setDeletingId(id)}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      )}

      {/* Drawer Editor */}
      <FacultyDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        editingProfile={editingProfile}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-faculty-profiles"] });
          queryClient.invalidateQueries({ queryKey: ["public-faculty-profiles"] });
        }}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Xóa hồ sơ giảng viên?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              Hành động này sẽ xóa hoàn toàn hồ sơ và bảng điểm TRF của giảng viên này khỏi trang công khai /teachers. Bạn có chắc chắn muốn tiếp tục?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-xs font-bold"
            >
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
