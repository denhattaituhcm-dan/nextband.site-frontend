import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Compass, ShieldCheck, BookOpen, Send } from "lucide-react";
import { submitContactLead } from "@/lib/contactService";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// Common Modal Props
interface ModalBaseProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// -------------------------------------------------------------
// 1. MODAL: TƯ VẤN LỘ TRÌNH IELTS
// -------------------------------------------------------------
export function RoadmapConsultationModal({ isOpen, onOpenChange }: ModalBaseProps) {
  const { settings } = useSiteSettings();
  const zaloUrl = settings?.zaloLink || "https://zalo.me";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [targetBand, setTargetBand] = useState("Chưa xác định");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSubmitted(false);
      setErrorMessage(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    if (!cleanName || !cleanPhone) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await submitContactLead({
        leadType: "CONTACT",
        fullName: cleanName,
        phone: cleanPhone,
        goal: `Tư vấn lộ trình IELTS | Mục tiêu: ${targetBand}`,
        source: "bubble_roadmap_consultation",
        metadata: {
          intent: "roadmap_consultation",
          targetBand,
        },
      });

      if (res.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage("Không thể gửi thông tin. Bạn có thể nhắn trực tiếp qua Zalo với chúng tôi.");
      }
    } catch (err: any) {
      console.error("Roadmap consultation lead error:", err);
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng liên hệ trực tiếp qua Zalo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 sm:p-7 rounded-3xl bg-background border border-border">
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-foreground">
                Đã Nhận Thông Tin
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-sm mx-auto">
                Cảm ơn <strong>{fullName}</strong>. ARIS sẽ liên hệ với bạn qua Zalo/SĐT{" "}
                <strong>{phone}</strong> để tư vấn lộ trình học phù hợp nhất.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 text-left space-y-1.5 text-xs text-foreground/80">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nhu cầu:</span>
                <span className="font-semibold text-foreground">Tư vấn lộ trình IELTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mục tiêu Band:</span>
                <span className="font-semibold text-brand-red">{targetBand}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleClose}
                className="w-full h-10 rounded-xl font-bold bg-primary text-primary-foreground"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20 text-[11px] font-bold w-fit">
                <Compass className="w-3 h-3" />
                <span>Định hướng học tập 1:1</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                TƯ VẤN LỘ TRÌNH IELTS
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/75 leading-relaxed">
                ARIS sẽ liên hệ để tư vấn trình độ hiện tại, mục tiêu và lộ trình học tối ưu.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.open(zaloUrl, "_blank", "noopener,noreferrer")}
                  className="w-full h-8 bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-semibold"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  Nhắn trực tiếp qua Zalo
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              {/* Họ và tên */}
              <div className="space-y-1 text-left">
                <Label htmlFor="roadmap-name" className="text-xs font-bold text-foreground">
                  Họ và tên <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="roadmap-name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-foreground text-sm"
                />
              </div>

              {/* Số điện thoại / Zalo */}
              <div className="space-y-1 text-left">
                <Label htmlFor="roadmap-phone" className="text-xs font-bold text-foreground">
                  Số điện thoại / Zalo <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="roadmap-phone"
                  required
                  type="tel"
                  placeholder="Ví dụ: 0933 319 693"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-foreground text-sm"
                />
              </div>

              {/* Mục tiêu IELTS */}
              <div className="space-y-1 text-left">
                <Label htmlFor="roadmap-target" className="text-xs font-bold text-foreground">
                  Mục tiêu IELTS
                </Label>
                <Select value={targetBand} onValueChange={setTargetBand}>
                  <SelectTrigger id="roadmap-target" className="h-10 rounded-xl border-border bg-card text-foreground text-sm">
                    <SelectValue placeholder="Chọn mục tiêu" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Chưa xác định">Chưa xác định (Cần tư vấn)</SelectItem>
                    <SelectItem value="5.5+">Mục tiêu 5.5+</SelectItem>
                    <SelectItem value="6.0+">Mục tiêu 6.0+</SelectItem>
                    <SelectItem value="6.5+">Mục tiêu 6.5+</SelectItem>
                    <SelectItem value="7.0+">Mục tiêu 7.0+</SelectItem>
                    <SelectItem value="7.5+">Mục tiêu 7.5+</SelectItem>
                    <SelectItem value="8.0+">Mục tiêu 8.0+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-brand-red hover:bg-brand-red-hover text-white shadow-xs transition-all"
                >
                  {loading ? "Đang xử lý..." : "Đăng ký tư vấn"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------
// 2. MODAL: ĐĂNG KÝ KHẢO HẠCH IELTS
// -------------------------------------------------------------
export function AssessmentRegistrationModal({ isOpen, onOpenChange }: ModalBaseProps) {
  const { settings } = useSiteSettings();
  const zaloUrl = settings?.zaloLink || "https://zalo.me";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [targetBand, setTargetBand] = useState("Chưa xác định");
  const [currentLevel, setCurrentLevel] = useState("Chưa biết / Không rõ");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSubmitted(false);
      setErrorMessage(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    if (!cleanName || !cleanPhone) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await submitContactLead({
        leadType: "ASSESSMENT",
        fullName: cleanName,
        phone: cleanPhone,
        goal: `Đăng ký Khảo Hạch IELTS | Hiện tại: ${currentLevel} -> Mục tiêu: ${targetBand}`,
        source: "bubble_assessment_registration",
        metadata: {
          intent: "assessment_registration",
          currentLevel,
          targetBand,
        },
      });

      if (res.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage("Không thể gửi thông tin. Bạn có thể nhắn trực tiếp qua Zalo với chúng tôi.");
      }
    } catch (err: any) {
      console.error("Assessment registration lead error:", err);
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng liên hệ trực tiếp qua Zalo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 sm:p-7 rounded-3xl bg-background border border-border">
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-foreground">
                Đã Nhận Đăng Ký Khảo Hạch
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-sm mx-auto">
                Cảm ơn <strong>{fullName}</strong>. ARIS sẽ liên hệ qua Zalo/SĐT{" "}
                <strong>{phone}</strong> để xác nhận và sắp xếp lịch khảo hạch phù hợp.
              </p>
              <p className="text-[11px] text-muted-foreground pt-1">
                Thời gian dự kiến phản hồi: trong giờ làm việc.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 text-left space-y-1.5 text-xs text-foreground/80">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trình độ hiện tại:</span>
                <span className="font-semibold text-foreground">{currentLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mục tiêu hướng tới:</span>
                <span className="font-semibold text-brand-red">{targetBand}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleClose}
                className="w-full h-10 rounded-xl font-bold bg-primary text-primary-foreground"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20 text-[11px] font-bold w-fit">
                <ShieldCheck className="w-3 h-3" />
                <span>Định vị Cảnh giới Học thuật</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                ĐĂNG KÝ KHẢO HẠCH IELTS
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/75 leading-relaxed">
                Xác định trình độ hiện tại và nhận định hướng lộ trình học phù hợp tại ARIS IELTS.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.open(zaloUrl, "_blank", "noopener,noreferrer")}
                  className="w-full h-8 bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-semibold"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  Nhắn trực tiếp qua Zalo
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              {/* Họ và tên */}
              <div className="space-y-1 text-left">
                <Label htmlFor="assessment-name" className="text-xs font-bold text-foreground">
                  Họ và tên <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="assessment-name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-foreground text-sm"
                />
              </div>

              {/* Số điện thoại / Zalo */}
              <div className="space-y-1 text-left">
                <Label htmlFor="assessment-phone" className="text-xs font-bold text-foreground">
                  Số điện thoại / Zalo <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="assessment-phone"
                  required
                  type="tel"
                  placeholder="Ví dụ: 0933 319 693"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-foreground text-sm"
                />
              </div>

              {/* Mục tiêu IELTS */}
              <div className="space-y-1 text-left">
                <Label htmlFor="assessment-target" className="text-xs font-bold text-foreground">
                  Mục tiêu IELTS
                </Label>
                <Select value={targetBand} onValueChange={setTargetBand}>
                  <SelectTrigger id="assessment-target" className="h-10 rounded-xl border-border bg-card text-foreground text-sm">
                    <SelectValue placeholder="Chọn mục tiêu" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Chưa xác định">Chưa xác định (Cần định hướng)</SelectItem>
                    <SelectItem value="5.5+">Mục tiêu 5.5+</SelectItem>
                    <SelectItem value="6.0+">Mục tiêu 6.0+</SelectItem>
                    <SelectItem value="6.5+">Mục tiêu 6.5+</SelectItem>
                    <SelectItem value="7.0+">Mục tiêu 7.0+</SelectItem>
                    <SelectItem value="7.5+">Mục tiêu 7.5+</SelectItem>
                    <SelectItem value="8.0+">Mục tiêu 8.0+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trình độ hiện tại */}
              <div className="space-y-1 text-left">
                <Label htmlFor="assessment-level" className="text-xs font-bold text-foreground">
                  Trình độ hiện tại
                </Label>
                <Select value={currentLevel} onValueChange={setCurrentLevel}>
                  <SelectTrigger id="assessment-level" className="h-10 rounded-xl border-border bg-card text-foreground text-sm">
                    <SelectValue placeholder="Chọn trình độ hiện tại" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Chưa biết / Không rõ">Chưa biết / Không rõ (Khảo hạch để biết)</SelectItem>
                    <SelectItem value="Mất gốc / rất yếu">Mất gốc / nền tảng rất yếu</SelectItem>
                    <SelectItem value="Khoảng 3.0 – 4.0">Khoảng 3.0 – 4.0 (Biết cơ bản)</SelectItem>
                    <SelectItem value="Khoảng 4.5 – 5.5">Khoảng 4.5 – 5.5 (Đã có ngữ pháp vững)</SelectItem>
                    <SelectItem value="6.0+">Từ 6.0+ trở lên (Luyện nâng band)</SelectItem>
                    <SelectItem value="Đã từng thi IELTS">Đã từng thi IELTS thật</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-brand-red hover:bg-brand-red-hover text-white shadow-xs transition-all"
                >
                  {loading ? "Đang xử lý..." : "Đăng ký Khảo Hạch"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------
// 3. MODAL: ĐĂNG KÝ HỌC THỬ
// -------------------------------------------------------------
export function TrialClassModal({ isOpen, onOpenChange }: ModalBaseProps) {
  const { settings } = useSiteSettings();
  const zaloUrl = settings?.zaloLink || "https://zalo.me";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [learningMode, setLearningMode] = useState<"offline" | "online">("offline");
  const [course, setCourse] = useState("STARTER (Mất gốc → 3.0)");
  const [schedule, setSchedule] = useState("Tối Thứ 2 - 4 - 6 (18:30 - 20:30)");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setIsSubmitted(false);
      setErrorMessage(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, "");

    if (!cleanName || !cleanPhone) return;

    setLoading(true);
    setErrorMessage(null);

    const modeText = learningMode === "offline" ? "Offline tại cơ sở" : "Online qua Zoom";

    try {
      const res = await submitContactLead({
        leadType: "QUICK_TRIAL",
        fullName: cleanName,
        phone: cleanPhone,
        course,
        preferredSchedule: `${schedule} (${modeText})`,
        goal: `Đăng ký học thử | Khóa: ${course} | Hình thức: ${modeText} | Ca học: ${schedule}`,
        source: "bubble_trial_class",
        metadata: {
          intent: "trial_class",
          learningMode,
          course,
          schedule,
        },
      });

      if (res.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage("Không thể gửi thông tin. Bạn có thể nhắn trực tiếp qua Zalo với chúng tôi.");
      }
    } catch (err: any) {
      console.error("Trial class lead error:", err);
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng liên hệ trực tiếp qua Zalo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px] p-6 sm:p-7 rounded-3xl bg-background border border-border">
        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-foreground">
                Đã Nhận Đăng Ký Học Thử
              </h3>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed max-w-sm mx-auto">
                Cảm ơn <strong>{fullName}</strong>. ARIS sẽ liên hệ qua Zalo/SĐT{" "}
                <strong>{phone}</strong> để tư vấn lớp phù hợp và sắp xếp lịch học thử.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/80 text-left space-y-1.5 text-xs text-foreground/80">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khóa học quan tâm:</span>
                <span className="font-semibold text-foreground">{course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hình thức:</span>
                <span className="font-semibold text-foreground">
                  {learningMode === "offline" ? "Offline tại lớp" : "Online qua Zoom"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ca học mong muốn:</span>
                <span className="font-semibold text-brand-red">{schedule}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleClose}
                className="w-full h-10 rounded-xl font-bold bg-primary text-primary-foreground"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-red/10 text-brand-red border border-brand-red/20 text-[11px] font-bold w-fit">
                <BookOpen className="w-3 h-3" />
                <span>Trải nghiệm lớp thực tế</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                ĐĂNG KÝ HỌC THỬ
              </DialogTitle>
              <DialogDescription className="text-xs text-foreground/75 leading-relaxed">
                Trải nghiệm lớp học thực tế và phương pháp học thuật tại ARIS IELTS.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.open(zaloUrl, "_blank", "noopener,noreferrer")}
                  className="w-full h-8 bg-[#0068FF] hover:bg-[#0057d9] text-white text-xs font-semibold"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  Nhắn trực tiếp qua Zalo
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              {/* Họ và tên */}
              <div className="space-y-1 text-left">
                <Label htmlFor="trial-name" className="text-xs font-bold text-foreground">
                  Họ và tên <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="trial-name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-foreground text-sm"
                />
              </div>

              {/* Số điện thoại / Zalo */}
              <div className="space-y-1 text-left">
                <Label htmlFor="trial-phone" className="text-xs font-bold text-foreground">
                  Số điện thoại / Zalo <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="trial-phone"
                  required
                  type="tel"
                  placeholder="Ví dụ: 0933 319 693"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 rounded-xl border-border bg-card text-foreground text-sm"
                />
              </div>

              {/* Hình thức học */}
              <div className="space-y-1 text-left">
                <Label className="text-xs font-bold text-foreground">Hình thức học</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLearningMode("offline")}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      learningMode === "offline"
                        ? "bg-brand-red text-white border-brand-red shadow-xs"
                        : "bg-muted/50 border-border text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    Offline tại cơ sở
                  </button>
                  <button
                    type="button"
                    onClick={() => setLearningMode("online")}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                      learningMode === "online"
                        ? "bg-brand-red text-white border-brand-red shadow-xs"
                        : "bg-muted/50 border-border text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    Online qua Zoom
                  </button>
                </div>
              </div>

              {/* Khóa học quan tâm */}
              <div className="space-y-1 text-left">
                <Label htmlFor="trial-course" className="text-xs font-bold text-foreground">
                  Khóa học quan tâm
                </Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger id="trial-course" className="h-10 rounded-xl border-border bg-card text-foreground text-sm">
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="STARTER (Mất gốc → 3.0)">STARTER (Mất gốc → 3.0)</SelectItem>
                    <SelectItem value="DREAMER (3.0 → 4.0)">DREAMER (3.0 → 4.0)</SelectItem>
                    <SelectItem value="BUILDER (4.0 → 5.0)">BUILDER (4.0 → 5.0)</SelectItem>
                    <SelectItem value="MASTER (5.0 → 6.0)">MASTER (5.0 → 6.0)</SelectItem>
                    <SelectItem value="LEADER (6.0 → 6.5+)">LEADER (6.0 → 6.5+)</SelectItem>
                    <SelectItem value="Cần ARIS tư vấn thêm">Chưa rõ (Cần ARIS tư vấn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ca học mong muốn */}
              <div className="space-y-1 text-left">
                <Label htmlFor="trial-schedule" className="text-xs font-bold text-foreground">
                  Ca học mong muốn
                </Label>
                <Select value={schedule} onValueChange={setSchedule}>
                  <SelectTrigger id="trial-schedule" className="h-10 rounded-xl border-border bg-card text-foreground text-sm">
                    <SelectValue placeholder="Chọn ca học" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Tối Thứ 2 - 4 - 6 (18:30 - 20:30)">Tối Thứ 2 - 4 - 6 (18:30 - 20:30)</SelectItem>
                    <SelectItem value="Tối Thứ 3 - 5 - 7 (18:30 - 20:30)">Tối Thứ 3 - 5 - 7 (18:30 - 20:30)</SelectItem>
                    <SelectItem value="Sáng / Chiều Cuối tuần (T7 - CN)">Cuối tuần (Thứ 7 - Chủ Nhật)</SelectItem>
                    <SelectItem value="Linh hoạt theo tư vấn">Linh hoạt theo tư vấn của trung tâm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-brand-red hover:bg-brand-red-hover text-white shadow-xs transition-all"
                >
                  {loading ? "Đang xử lý..." : "Đăng ký học thử"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
