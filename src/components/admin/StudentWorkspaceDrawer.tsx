import { useState } from "react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  MessageSquare,
  RefreshCw,
  PauseCircle,
  Key,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Phone,
  ShieldAlert,
  Archive,
  Trash2,
  UserCheck,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentWorkspaceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any | null;
  onArchive: (id: string, reason: string, metadata: any) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string, isLocked: boolean) => void;
}

export function StudentWorkspaceDrawer({
  open,
  onOpenChange,
  student,
  onArchive,
  onDelete,
  onToggleLock,
}: StudentWorkspaceDrawerProps) {
  const { toast } = useToast();
  
  // Archive Dialog State
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("long_term_pause");
  const [returnDate, setReturnDate] = useState("");
  const [transferClass, setTransferClass] = useState("");
  const [archiveNotes, setArchiveNotes] = useState("");

  // Hard Delete Confirm Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  if (!student) return null;

  // Mocked Academic Health & Operational Data for Demo
  const healthScore = student.healthScore || 82;
  const isHealthy = healthScore >= 80;
  const isNeedsAttention = healthScore >= 60 && healthScore < 80;

  const currentClass = student.className || "IELTS Dreamer 03";
  const courseName = student.courseName || "IELTS Overall 6.5";
  const teacherName = student.teacherName || "Cô Minh Châu";
  const hwRatio = student.hwRatio || "12/27 (44%)";
  const attendanceRate = student.attendanceRate || "95%";
  const lastActivityText = student.lastActivityText || "2 giờ trước";
  const isAccountLocked = student.isActive === false;

  // Guardian info
  const parentName = student.parentName || "Nguyễn Văn B";
  const parentPhone = student.parentPhone || "0901 234 567";
  const lastContactDate = student.lastContactDate || "05/08/2026";

  const handleConfirmArchive = () => {
    onArchive(student.id, archiveReason, {
      returnDate,
      transferClass,
      notes: archiveNotes,
    });
    setArchiveDialogOpen(false);
    toast({ title: "Đã chuyển học viên sang mục Lưu trữ" });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmText.toUpperCase() !== "DELETE") {
      toast({ title: "Lỗi", description: "Vui lòng nhập chính xác chữ DELETE để xác nhận", variant: "destructive" });
      return;
    }
    onDelete(student.id);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background overflow-hidden border-l">
          {/* 1. STICKY HEADER */}
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border">
                <AvatarImage src={student.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {student.fullName ? student.fullName.substring(0, 2).toUpperCase() : "HV"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground leading-none">
                    {student.fullName || "Học viên chưa đặt tên"}
                  </h3>
                  <Badge variant={isAccountLocked ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                    {isAccountLocked ? "🔒 Đã khóa TK" : "🟢 Hoạt động"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentClass} • {student.email}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => toast({ title: "Tính năng mở trang Profile chi tiết" })}
            >
              Mở toàn trang
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* SCROLLABLE BODY CONTENT */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 2. QUICK ACTIONS */}
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" className="flex flex-col h-14 items-center justify-center gap-1 text-[11px] font-normal" onClick={() => toast({ title: "Mở ô nhắn tin với học viên" })}>
                <MessageSquare className="h-4 w-4 text-primary" />
                Nhắn tin
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-14 items-center justify-center gap-1 text-[11px] font-normal" onClick={() => toast({ title: "Mở Modal đổi lớp" })}>
                <RefreshCw className="h-4 w-4 text-primary" />
                Đổi lớp
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-14 items-center justify-center gap-1 text-[11px] font-normal" onClick={() => toast({ title: "Đã chọn đặt bảo lưu" })}>
                <PauseCircle className="h-4 w-4 text-warning" />
                Bảo lưu
              </Button>
              <Button variant="outline" size="sm" className="flex flex-col h-14 items-center justify-center gap-1 text-[11px] font-normal" onClick={() => toast({ title: "Mã reset mật khẩu đã tạo" })}>
                <Key className="h-4 w-4 text-muted-foreground" />
                Reset Pass
              </Button>
            </div>

            {/* 3. MINI NOTIFICATIONS (Cảnh báo nhanh) */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning" className="text-xs py-1 px-2.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                2 Bài tập trễ hạn
              </Badge>
              <Badge variant="info" className="text-xs py-1 px-2.5 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                3 Phản hồi chưa đọc
              </Badge>
            </div>

            {/* 4. CURRENT FOCUS (Nhiệm vụ trọng tâm hiện tại) */}
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Trọng tâm hiện tại (Current Focus)
                </span>
                <Badge variant="outline" className="bg-background text-[10px]">Hạn: Ngày mai</Badge>
              </div>
              <p className="font-medium text-sm">Homework 12: IELTS Writing Task 2 - Essay Structure</p>
              <p className="text-xs text-muted-foreground">Trạng thái: <span className="text-warning font-medium">Chưa nộp bài</span> • Cần nhắc nhở học viên trước 23:59</p>
            </div>

            {/* 5. ACADEMIC HEALTH & OVERVIEW */}
            <div className="border rounded-xl p-4 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Sức khỏe Học thuật</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs space-y-1">
                        <p className="font-bold">Công thức Academic Health Score:</p>
                        <p>• Tỷ lệ điểm danh: 30%</p>
                        <p>• Hoàn thành bài tập: 40%</p>
                        <p>• Bài tập đúng hạn: 20%</p>
                        <p>• Đánh giá từ giáo viên: 10%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${isHealthy ? "text-success" : isNeedsAttention ? "text-warning" : "text-destructive"}`}>
                    {healthScore}/100
                  </span>
                  <Badge variant={isHealthy ? "success" : isNeedsAttention ? "warning" : "destructive"}>
                    {isHealthy ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Tốt
                      </>
                    ) : isNeedsAttention ? (
                      <>
                        <AlertTriangle className="h-3 w-3" /> Cần chú ý
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" /> Rủi ro cao
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              <Progress value={healthScore} className="h-2" />

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t">
                <div>
                  <span className="text-muted-foreground">Lớp & Khóa:</span>
                  <p className="font-medium mt-0.5">{currentClass} ({courseName})</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Giáo viên phụ trách:</span>
                  <p className="font-medium mt-0.5 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    {teacherName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tiến độ bài tập:</span>
                  <p className="font-medium mt-0.5">{hwRatio}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Chuyên cần:</span>
                  <p className="font-medium mt-0.5">{attendanceRate}</p>
                </div>
              </div>
            </div>

            {/* 6. GUARDIAN / PARENT SECTION */}
            <div className="border rounded-xl p-4 bg-muted/10 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Thông tin Phụ huynh (Guardian)
              </span>
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <p className="font-semibold text-sm">{parentName}</p>
                  <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {parentPhone}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Lần liên hệ cuối:</span>
                  <p className="font-medium">{lastContactDate}</p>
                </div>
              </div>
            </div>

            {/* 7. UNIFIED TIMELINE (GitHub Activity Style) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Dòng thời gian hoạt động (Timeline)
                </span>
                <span className="text-[11px] text-muted-foreground">Gần nhất: {lastActivityText}</span>
              </div>

              <div className="relative pl-4 space-y-4 border-l-2 border-muted ml-2 text-xs">
                {/* Event 1 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-success text-success-foreground rounded-full p-0.5">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Nộp Bài tập 12 - Writing Task 2</p>
                      <span className="text-[10px] text-muted-foreground">2 giờ trước</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">Đã đạt Band 6.5 (Nhận xét: Mở bài đạt chuẩn, bài làm mạch lạc)</p>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Calendar className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Điểm danh - Có mặt</p>
                      <span className="text-[10px] text-muted-foreground">01/08/2026</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">Buổi 14: Luyện tập Speaking Part 2 với GV Minh Châu</p>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-info text-info-foreground rounded-full p-0.5">
                    <MessageSquare className="h-3 w-3" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">Nhận xét từ Giáo viên</p>
                      <span className="text-[10px] text-muted-foreground">31/07/2026</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">"Kỹ năng Listening tiến bộ tốt, cần luyện thêm vốn từ ngữ vựng Topic Education"</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 8. LIFECYCLE MANAGEMENT (Quản lý vòng đời nhạy cảm) */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-destructive font-semibold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Quản lý vòng đời tài khoản
              </div>
              <p className="text-xs text-muted-foreground">
                Thực hiện các thao tác lưu trữ dữ liệu hoặc thay đổi trạng thái hoạt động vĩnh viễn của học viên.
              </p>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-warning/40 text-foreground hover:bg-warning/10 gap-1.5 text-xs"
                  onClick={() => setArchiveDialogOpen(true)}
                >
                  <Archive className="h-3.5 w-3.5 text-warning" />
                  Lưu trữ học viên...
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  Xóa vĩnh viễn...
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* DIALOG 1: ARCHIVE WITH METADATA */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Lưu trữ hồ sơ Học viên
            </DialogTitle>
            <DialogDescription>
              Hồ sơ học viên sẽ được chuyển sang mục Lưu trữ (Archived). Mọi dữ liệu bài tập và lịch sử học tập vẫn được bảo toàn nguyên vẹn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lý do lưu trữ *</Label>
              <Select value={archiveReason} onValueChange={setArchiveReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finished">Hoàn thành khóa học (Graduated)</SelectItem>
                  <SelectItem value="long_term_pause">Bảo lưu dài hạn</SelectItem>
                  <SelectItem value="transfer">Chuyển cơ sở / Chuyển lớp</SelectItem>
                  <SelectItem value="refund">Rút học phí / Bỏ học (Dropout)</SelectItem>
                  <SelectItem value="duplicate">Tài khoản trùng / Thử nghiệm</SelectItem>
                  <SelectItem value="other">Lý do khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* METADATA DỰA TRÊN LÝ DO */}
            {archiveReason === "long_term_pause" && (
              <div className="space-y-2">
                <Label>Ngày dự kiến quay lại học</Label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            )}

            {archiveReason === "transfer" && (
              <div className="space-y-2">
                <Label>Lớp / Cơ sở chuyển tới</Label>
                <Input placeholder="Ví dụ: IELTS Master 01 - Cơ sở Quận 3" value={transferClass} onChange={(e) => setTransferClass(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Ghi chú bổ sung</Label>
              <Textarea
                placeholder="Nhập chi tiết thông tin hỗ trợ bảo lưu / lưu trữ..."
                value={archiveNotes}
                onChange={(e) => setArchiveNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>Hủy</Button>
            <Button className="bg-warning hover:bg-warning/90 text-warning-foreground" onClick={handleConfirmArchive}>
              Xác nhận Lưu trữ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: HARD DELETE PERMANENTLY CONFIRMATION */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cảnh báo: Xóa vĩnh viễn dữ liệu
            </DialogTitle>
            <DialogDescription className="text-destructive/80">
              Hành động này sẽ <strong>xóa vĩnh viễn</strong> tài khoản học viên <strong>{student.fullName}</strong> cùng toàn bộ bài nộp, điểm số và nhận xét. Hành động này không thể hoàn tác!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs">Gõ chữ <strong>DELETE</strong> để xác nhận hành động xóa nguy hiểm:</Label>
            <Input
              placeholder="Nhập DELETE"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="border-destructive/40 focus-visible:ring-destructive font-mono"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText.toUpperCase() !== "DELETE"}
              onClick={handleConfirmDelete}
            >
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
