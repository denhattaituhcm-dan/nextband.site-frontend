import React, { useState, useEffect, useRef } from "react";
import { FacultyProfile, FacultyProfileInput, facultyService } from "@/lib/facultyService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  FileCheck,
  Award,
  X,
  Plus,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface FacultyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editingProfile: FacultyProfile | null;
  onSaved: () => void;
}

export function FacultyDrawer({
  isOpen,
  onClose,
  editingProfile,
  onSaved,
}: FacultyDrawerProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ieltsBadge, setIeltsBadge] = useState("8.0");
  const [ieltsBadgeSub, setIeltsBadgeSub] = useState("");
  const [achievementsText, setAchievementsText] = useState("");
  const [trfImageUrl, setTrfImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingTRF, setIsUploadingTRF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const trfInputRef = useRef<HTMLInputElement>(null);

  // Sync state when editingProfile changes
  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name || "");
      setRole(editingProfile.role || "");
      setAvatarUrl(editingProfile.avatar_url || "");
      setIeltsBadge(editingProfile.ielts_badge || "8.0");
      setIeltsBadgeSub(editingProfile.ielts_badge_sub || "");
      setAchievementsText(
        Array.isArray(editingProfile.achievements)
          ? editingProfile.achievements.join("\n")
          : ""
      );
      setTrfImageUrl(editingProfile.trf_image_url || "");
      setIsPublished(Boolean(editingProfile.is_published ?? true));
    } else {
      // Defaults for new profile
      setName("");
      setRole("Academic Lead — Phụ trách Chuyên môn ARIS");
      setAvatarUrl("");
      setIeltsBadge("8.0");
      setIeltsBadgeSub("Listening & Reading 8.5");
      setAchievementsText(
        "IELTS 8.0 Academic (Listening 8.5, Reading 8.5) — Verified Test Report Form\nTác giả khung năng lực 7 cấp bậc (ARIS-7) & phương pháp đào tạo The ARIS Way\nHơn 5 năm kinh nghiệm giảng dạy & chuẩn hóa tiêu chuẩn chấm chữa trên NextBand\nCử nhân Sư phạm Tiếng Anh, chuyên sâu phương pháp luận khảo thí quốc tế"
      );
      setTrfImageUrl("");
      setIsPublished(true);
    }
  }, [editingProfile, isOpen]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const url = await facultyService.uploadAsset(file, "avatars");
      setAvatarUrl(url);
      toast.success("Tải ảnh chân dung thành công!");
    } catch (err: any) {
      toast.error(`Lỗi tải ảnh chân dung: ${err.message || "Không thể upload"}`);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleTRFFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingTRF(true);
      const url = await facultyService.uploadAsset(file, "trf");
      setTrfImageUrl(url);
      toast.success("Tải ảnh scan TRF thành công!");
    } catch (err: any) {
      toast.error(`Lỗi tải ảnh TRF: ${err.message || "Không thể upload"}`);
    } finally {
      setIsUploadingTRF(false);
      if (trfInputRef.current) trfInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập họ tên giảng viên!");
      return;
    }

    if (!role.trim()) {
      toast.error("Vui lòng nhập chức danh!");
      return;
    }

    const achievements = achievementsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const payload: Partial<FacultyProfile> = {
      ...(editingProfile?.id ? { id: editingProfile.id } : {}),
      name: name.trim(),
      role: role.trim(),
      avatar_url: avatarUrl || null,
      ielts_badge: ieltsBadge.trim() || "8.0",
      ielts_badge_sub: ieltsBadgeSub.trim() || null,
      achievements,
      trf_image_url: trfImageUrl || null,
      is_published: isPublished,
    };

    try {
      setIsSaving(true);
      await facultyService.saveFaculty(payload);
      toast.success(
        editingProfile ? "Đã cập nhật hồ sơ giảng viên!" : "Đã thêm giảng viên mới!"
      );
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(`Lỗi lưu hồ sơ: ${err.message || "Đã xảy ra lỗi"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 font-sans sm:rounded-3xl">
        <DialogHeader className="border-b border-border/70 pb-4">
          <DialogTitle className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-blue" />
            <span>{editingProfile ? "Chỉnh sửa hồ sơ giảng viên" : "Thêm giảng viên mới"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thông tin và bảng điểm TRF sẽ hiển thị trực tiếp tại trang công khai /teachers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* SECTION 1: HỒ SƠ CƠ BẢN */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>1. Thông tin cơ bản & Chân dung</span>
            </h4>

            {/* Avatar Upload Frame */}
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 border border-border/60">
              <div className="relative aspect-square w-20 h-20 rounded-xl overflow-hidden bg-background border border-border/80 shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-bold text-foreground">Ảnh chân dung</p>
                <p className="text-[11px] text-muted-foreground">
                  Nên dùng ảnh chụp chính diện tỉ lệ 1:1, phông nền sáng hoặc trong suốt.
                </p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="h-7 text-xs rounded-lg gap-1.5"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{avatarUrl ? "Đổi ảnh khác" : "Tải ảnh lên"}</span>
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarUrl("")}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Gỡ ảnh
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Họ và tên *</Label>
                <Input
                  placeholder="Ví dụ: Lưu Văn Đang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Chức danh / Vai trò *</Label>
                <Input
                  placeholder="Ví dụ: Academic Lead — Phụ trách Chuyên môn ARIS"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: BADGE ĐIỂM IELTS */}
          <div className="space-y-3.5 pt-2 border-t border-border/60">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              2. Badge điểm IELTS trên Card
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Điểm Overall chính *</Label>
                <Input
                  placeholder="Ví dụ: 8.0 hoặc 8.5"
                  value={ieltsBadge}
                  onChange={(e) => setIeltsBadge(e.target.value)}
                  className="h-10 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Dòng điểm phụ (tùy chọn)</Label>
                <Input
                  placeholder="Ví dụ: Listening & Reading 8.5"
                  value={ieltsBadgeSub}
                  onChange={(e) => setIeltsBadgeSub(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: THÀNH TỰU & BẰNG CẤP */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                3. Thành tựu & Bằng cấp (Mỗi dòng 1 ý)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Tự động gắn icon học thuật trên web
              </span>
            </div>

            <Textarea
              rows={4}
              placeholder="Nhập các dòng thành tựu, mỗi dòng là một gạch đầu dòng..."
              value={achievementsText}
              onChange={(e) => setAchievementsText(e.target.value)}
              className="rounded-xl text-xs leading-relaxed"
            />
          </div>

          {/* SECTION 4: BẢNG ĐIỂM TRF SCAN */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>4. Bảng điểm IELTS Test Report Form (Scan)</span>
              <span className="text-[11px] font-normal text-muted-foreground">Khổ dọc chất lượng cao</span>
            </h4>

            <input
              ref={trfInputRef}
              type="file"
              accept="image/*"
              onChange={handleTRFFileChange}
              className="hidden"
            />

            {trfImageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 p-3 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-28 sm:w-36 aspect-[1/1.4] rounded-lg overflow-hidden bg-white border border-border shrink-0 shadow-xs">
                  <img
                    src={trfImageUrl}
                    alt="TRF Preview"
                    className="w-full h-full object-contain"
                  />
                  {isUploadingTRF && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <FileCheck className="h-4 w-4" />
                    <span>Đã tải lên Bảng điểm TRF chính thức</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Học viên có thể bấm "Phóng to" để xem toàn bộ bảng điểm sắc nét này.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => trfInputRef.current?.click()}
                      disabled={isUploadingTRF}
                      className="h-8 text-xs rounded-lg gap-1.5"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Thay ảnh khác</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrfImageUrl("")}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Gỡ TRF
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => trfInputRef.current?.click()}
                className="border-2 border-dashed border-border/80 hover:border-brand-blue rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-brand-blue-soft/30 space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center mx-auto">
                  {isUploadingTRF ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <UploadCloud className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Bấm để tải lên ảnh scan Bảng điểm IELTS (TRF)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Hỗ trợ định dạng JPG, PNG (nên dùng ảnh độ phân giải cao)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: XUẤT BẢN */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between p-3 rounded-2xl bg-muted/40">
            <div>
              <Label className="text-xs font-bold text-foreground block">
                Hiển thị trên website
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Bật để hồ sơ và bảng điểm xuất hiện ngay tại trang /teachers.
              </p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={setIsPublished}
              aria-label="Xuất bản"
            />
          </div>

          {/* FOOTER */}
          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-10 px-5 text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploadingAvatar || isUploadingTRF}
              className="rounded-xl h-10 px-6 text-xs font-bold bg-brand-red hover:bg-brand-red-hover text-white gap-2 shadow-xs"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{editingProfile ? "Lưu thay đổi" : "Lưu hồ sơ"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
