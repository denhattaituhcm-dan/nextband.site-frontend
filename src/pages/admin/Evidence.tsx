import React, { useState, useEffect } from "react";
import {
  EvidenceItem,
  getEvidenceList,
  fetchEvidenceListAsync,
  saveEvidenceItemAsync,
  deleteEvidenceItemAsync,
  toggleEvidencePublished,
  toggleEvidenceFeatured,
} from "@/lib/evidenceStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminEvidence() {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "featured" | "draft">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<EvidenceItem> | null>(null);
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);

  const loadData = async () => {
    const list = await fetchEvidenceListAsync();
    setItems(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.studentSchool && item.studentSchool.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (statusFilter === "published") return item.published;
    if (statusFilter === "featured") return item.featured && item.published;
    if (statusFilter === "draft") return !item.published;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingItem({
      studentName: "",
      studentSchool: "",
      title: "",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      story: "",
      scoreBefore: "",
      overallScore: "6.5",
      listeningScore: "",
      readingScore: "",
      writingScore: "",
      speakingScore: "",
      studyDuration: "12 tuần",
      courseName: "Khóa MASTER",
      featured: false,
      published: false,
      consentConfirmed: true,
      displayOrder: items.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EvidenceItem) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa câu chuyện của học viên "${name}" không?`)) {
      await deleteEvidenceItemAsync(id);
      await loadData();
      toast.success(`Đã xóa thành công câu chuyện của ${name}`);
    }
  };

  const handleTogglePublish = async (item: EvidenceItem) => {
    if (!item.published && !item.consentConfirmed) {
      toast.error("Không thể xuất bản: Vui lòng xác nhận sự đồng ý của học viên trước!");
      return;
    }
    try {
      toggleEvidencePublished(item.id, !item.published);
      await loadData();
      toast.success(item.published ? "Đã chuyển về bản nháp" : "Đã xuất bản thành công lên Public Website");
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleToggleFeatured = async (item: EvidenceItem) => {
    toggleEvidenceFeatured(item.id, !item.featured);
    await loadData();
    toast.success(item.featured ? "Đã bỏ ghim nổi bật" : "Đã ghim nổi bật lên Trang Chủ");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.studentName?.trim() || !editingItem?.title?.trim() || !editingItem?.overallScore?.trim()) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    if (editingItem.published && !editingItem.consentConfirmed) {
      toast.error("Vui lòng xác nhận sự đồng ý (Consent) của học viên trước khi Xuất bản!");
      return;
    }

    await saveEvidenceItemAsync(editingItem);
    await loadData();
    setIsModalOpen(false);
    toast.success("Đã lưu câu chuyện tiến bộ thành công!");
  };

  return (
    <div className="space-y-8 p-6 sm:p-8 max-w-7xl mx-auto text-left">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-7 w-7 text-brand-red" />
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Evidence &amp; Bằng Chứng Tiến Bộ
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các câu chuyện tiến bộ thực tế của học viên hiển thị trên Trang Chủ và Trang Kết Quả.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl px-5 h-11 font-extrabold text-sm bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Câu Chuyện Mới</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-1 shadow-2xs">
          <span className="text-xs font-bold text-muted-foreground uppercase">Tổng Số Case</span>
          <p className="text-2xl font-black text-foreground">{items.length}</p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-1 shadow-2xs">
          <span className="text-xs font-bold text-success uppercase">Đã Xuất Bản</span>
          <p className="text-2xl font-black text-success">
            {items.filter((i) => i.published).length}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-1 shadow-2xs">
          <span className="text-xs font-bold text-brand-red uppercase">Nổi Bật (Homepage)</span>
          <p className="text-2xl font-black text-brand-red">
            {items.filter((i) => i.featured && i.published).length}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-card border border-border/80 space-y-1 shadow-2xs">
          <span className="text-xs font-bold text-muted-foreground uppercase">Bản Nháp (Draft)</span>
          <p className="text-2xl font-black text-muted-foreground">
            {items.filter((i) => !i.published).length}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border/80">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên học viên, trường, tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["all", "published", "featured", "draft"] as const).map((filterKey) => (
            <Button
              key={filterKey}
              variant={statusFilter === filterKey ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(filterKey)}
              className="rounded-xl text-xs font-bold capitalize h-9"
            >
              {filterKey === "all"
                ? "Tất cả"
                : filterKey === "published"
                ? "Đã xuất bản"
                : filterKey === "featured"
                ? "Nổi bật"
                : "Bản nháp"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table / List View */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 border-b border-border/80 text-xs font-extrabold uppercase text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4 w-16">Ảnh</th>
                <th className="py-3.5 px-4">Học Viên &amp; Tiêu Đề</th>
                <th className="py-3.5 px-4 text-center">Kết Quả Điểm</th>
                <th className="py-3.5 px-4">Thời Gian / Khóa</th>
                <th className="py-3.5 px-4 text-center">Homepage</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy câu chuyện tiến bộ nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 text-center font-mono font-bold text-xs text-muted-foreground">
                      {item.displayOrder || idx + 1}
                    </td>

                    {/* Thumbnail */}
                    <td className="py-4 px-4">
                      <img
                        src={item.imageUrl}
                        alt={item.studentName}
                        className="h-12 w-12 rounded-xl object-cover border border-border/80 shrink-0"
                      />
                    </td>

                    {/* Student & Title */}
                    <td className="py-4 px-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground text-sm">
                          {item.studentName}
                        </span>
                        {item.studentSchool && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            {item.studentSchool}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 font-medium line-clamp-1 mt-0.5">
                        {item.title}
                      </p>
                    </td>

                    {/* Score Progression */}
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-red-soft text-brand-red font-black text-xs">
                        {item.scoreBefore ? (
                          <>
                            <span>{item.scoreBefore}</span>
                            <span>→</span>
                          </>
                        ) : null}
                        <span className="text-sm">{item.overallScore} IELTS</span>
                      </div>
                    </td>

                    {/* Duration & Course */}
                    <td className="py-4 px-4 text-xs font-medium text-foreground/75">
                      <div>{item.studyDuration}</div>
                      <div className="text-muted-foreground text-[11px]">{item.courseName}</div>
                    </td>

                    {/* Featured Switch */}
                    <td className="py-4 px-4 text-center">
                      <Switch
                        checked={item.featured}
                        onCheckedChange={() => handleToggleFeatured(item)}
                        disabled={!item.published}
                      />
                    </td>

                    {/* Published Status Badge */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold transition-colors ${
                          item.published
                            ? "bg-success/15 text-success hover:bg-success/25"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {item.published ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Đã Xuất Bản</span>
                          </>
                        ) : (
                          <span>Bản Nháp</span>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewItem(item)}
                        title="Xem trước"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(item)}
                        title="Chỉnh sửa"
                        className="h-8 w-8 text-brand-blue hover:text-brand-blue"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id, item.studentName)}
                        title="Xóa"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              {editingItem?.id?.startsWith("evi-") && items.some((i) => i.id === editingItem.id)
                ? "Chỉnh Sửa Câu Chuyện Tiến Bộ"
                : "Thêm Câu Chuyện Tiến Bộ Mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nhập các thông tin minh chứng và xác nhận sự đồng ý của học viên trước khi xuất bản.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={handleSave} className="space-y-6 text-left pt-2">
              {/* Group A: Main Info */}
              <div className="space-y-4 p-5 rounded-2xl bg-muted/30 border border-border/80">
                <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-blue" />
                  <span>A. Thông Tin Học Viên &amp; Câu Chuyện</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Tên học viên *</Label>
                    <Input
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={editingItem.studentName || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, studentName: e.target.value })
                      }
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Trường / Đơn vị (nếu có)</Label>
                    <Input
                      placeholder="Ví dụ: THPT Gia Định / ĐH Bách Khoa"
                      value={editingItem.studentSchool || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, studentSchool: e.target.value })
                      }
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tiêu đề bài viết / thành tích *</Label>
                  <Input
                    required
                    placeholder="Ví dụ: Đạt IELTS 7.0 ngay từ lần thi đầu tiên cùng phương pháp The ARIS Way"
                    value={editingItem.title || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                    className="rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Link Ảnh Minh Chứng / Chân Dung *</Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      required
                      placeholder="https://..."
                      value={editingItem.imageUrl || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, imageUrl: e.target.value })
                      }
                      className="rounded-xl h-10 flex-1"
                    />
                    {editingItem.imageUrl && (
                      <img
                        src={editingItem.imageUrl}
                        alt="Preview"
                        className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Trích dẫn câu chuyện tiến bộ *</Label>
                  <Textarea
                    required
                    rows={3}
                    placeholder="Mô tả ngắn gọn cảm nhận và quá trình cải thiện cụ thể của học viên..."
                    value={editingItem.story || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, story: e.target.value })
                    }
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Group B: Score Breakdown */}
              <div className="space-y-4 p-5 rounded-2xl bg-muted/30 border border-border/80">
                <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-4 w-4 text-brand-red" />
                  <span>B. Điểm Số &amp; Lộ Trình</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Điểm trước (Before)</Label>
                    <Input
                      placeholder="Ví dụ: 5.0"
                      value={editingItem.scoreBefore || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, scoreBefore: e.target.value })
                      }
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Overall Đạt Được *</Label>
                    <Input
                      required
                      placeholder="Ví dụ: 7.0"
                      value={editingItem.overallScore || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, overallScore: e.target.value })
                      }
                      className="rounded-xl h-10 font-black text-brand-red"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Thời gian rèn luyện</Label>
                    <Input
                      placeholder="Ví dụ: 16 tuần"
                      value={editingItem.studyDuration || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, studyDuration: e.target.value })
                      }
                      className="rounded-xl h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Listening</Label>
                    <Input
                      placeholder="7.5"
                      value={editingItem.listeningScore || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, listeningScore: e.target.value })
                      }
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Reading</Label>
                    <Input
                      placeholder="7.5"
                      value={editingItem.readingScore || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, readingScore: e.target.value })
                      }
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Writing</Label>
                    <Input
                      placeholder="6.5"
                      value={editingItem.writingScore || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, writingScore: e.target.value })
                      }
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground">Speaking</Label>
                    <Input
                      placeholder="6.5"
                      value={editingItem.speakingScore || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, speakingScore: e.target.value })
                      }
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-bold">Khóa học / Chặng tham gia</Label>
                  <Input
                    placeholder="Ví dụ: Khóa MASTER & LEADER"
                    value={editingItem.courseName || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, courseName: e.target.value })
                    }
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              {/* Group C: Display & Consent Safeguard */}
              <div className="space-y-4 p-5 rounded-2xl bg-muted/30 border border-border/80">
                <h4 className="font-extrabold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  <span>C. Xuất Bản &amp; Cam Kết Quyền Riêng Tư</span>
                </h4>

                {/* Consent Checkbox */}
                <div className="p-4 rounded-xl bg-background border border-border/80 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentConfirmed"
                    checked={Boolean(editingItem.consentConfirmed)}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        consentConfirmed: e.target.checked,
                        published: e.target.checked ? editingItem.published : false,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded text-brand-red border-border focus:ring-brand-red"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="consentConfirmed"
                      className="text-xs font-extrabold text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4 text-success" />
                      <span>Xác nhận sự đồng ý của học viên (Consent Confirmed) *</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Đã được học viên chính thức đồng ý sử dụng hình ảnh và chia sẻ câu chuyện tiến bộ trên website.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
                    <span className="text-xs font-bold text-foreground">Xuất bản Public</span>
                    <Switch
                      checked={Boolean(editingItem.published)}
                      disabled={!editingItem.consentConfirmed}
                      onCheckedChange={(val) => setEditingItem({ ...editingItem, published: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
                    <span className="text-xs font-bold text-foreground">Nổi bật Homepage</span>
                    <Switch
                      checked={Boolean(editingItem.featured)}
                      disabled={!editingItem.published}
                      onCheckedChange={(val) => setEditingItem({ ...editingItem, featured: val })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Thứ tự hiển thị</Label>
                    <Input
                      type="number"
                      value={editingItem.displayOrder ?? 1}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          displayOrder: parseInt(e.target.value) || 1,
                        })
                      }
                      className="rounded-xl h-10 text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  Hủy Bỏ
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-extrabold text-xs bg-brand-red hover:bg-brand-red-hover text-white px-6"
                >
                  Lưu Câu Chuyện
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* PREVIEW MODAL */}
      <Dialog open={Boolean(previewItem)} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Xem Trước Hiển Thị Thẻ</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="p-6 rounded-3xl bg-card border-2 border-brand-blue/30 space-y-4 shadow-sm text-left">
              <div className="flex gap-4 items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-foreground text-base">
                      {previewItem.studentName}
                    </span>
                    {previewItem.studentSchool && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-blue-soft text-brand-blue">
                        {previewItem.studentSchool}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-foreground leading-tight">
                    {previewItem.title}
                  </h4>
                  <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3">
                    "{previewItem.story}"
                  </p>
                </div>

                <div className="relative shrink-0">
                  <img
                    src={previewItem.imageUrl}
                    alt={previewItem.studentName}
                    className="h-28 w-28 rounded-2xl object-cover border border-border"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-brand-red text-white font-black text-xs shadow-xs">
                    {previewItem.overallScore} IELTS
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-bold">
                <span>{previewItem.studyDuration}</span>
                <span>{previewItem.courseName}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
