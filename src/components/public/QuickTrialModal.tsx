import React, { useState, useEffect } from "react";
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
import { COURSE_CATALOG } from "@/constants/courses";
import { CheckCircle2, ShieldCheck, Phone, Sparkles } from "lucide-react";

interface QuickTrialModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialCourseSlug?: string;
}

export function QuickTrialModal({
  isOpen,
  onOpenChange,
  initialCourseSlug = "starter",
}: QuickTrialModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(initialCourseSlug);
  const [shiftPreference, setShiftPreference] = useState("Tối 2-4-6 (18:30 - 20:30)");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialCourseSlug && COURSE_CATALOG[initialCourseSlug]) {
      setSelectedCourse(initialCourseSlug);
    }
  }, [initialCourseSlug, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;

    setLoading(true);
    // Simulate lightweight submit & save to local state
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
    }, 400);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFullName("");
    setPhone("");
    onOpenChange(false);
  };

  const currentCourse = COURSE_CATALOG[selectedCourse] || COURSE_CATALOG.starter;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsSubmitted(false);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[480px] p-6 sm:p-8 rounded-3xl bg-background border border-border">
        {isSubmitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">
                Đăng Ký Thành Công!
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed max-w-sm mx-auto">
                Cảm ơn <strong>{fullName}</strong>. ARIS IELTS sẽ liên hệ qua SĐT/Zalo{" "}
                <strong>{phone}</strong> để xác nhận lịch 02 buổi học thử và gửi tài liệu chuẩn bị.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-left space-y-1.5 text-xs text-foreground/80">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khóa học đăng ký:</span>
                <span className="font-bold text-foreground">{currentCourse.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ca học mong muốn:</span>
                <span className="font-bold text-foreground">{shiftPreference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quyền lợi:</span>
                <span className="font-bold text-emerald-600">Miễn phí 02 buổi đầu</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleReset}
                className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground"
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-2 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trải nghiệm 02 buổi học thử không rủi ro</span>
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Nhận Lịch Học Thử 02 Buổi
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground/75 leading-relaxed">
                Trực tiếp trải nghiệm không gian học lớp tối đa 08 học viên và phương pháp giảng dạy của giáo viên IELTS 8.0+.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* 1. Họ và tên */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="trial-name" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Họ và tên <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="trial-name"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card text-foreground"
                />
              </div>

              {/* 2. Số điện thoại / Zalo */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="trial-phone" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Số điện thoại / Zalo <span className="text-brand-red">*</span>
                </Label>
                <Input
                  id="trial-phone"
                  required
                  type="tel"
                  placeholder="Ví dụ: 0933 319 693"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-xl border-border bg-card text-foreground"
                />
              </div>

              {/* Khóa học quan tâm */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="trial-course" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Khóa học quan tâm
                </Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger id="trial-course" className="h-11 rounded-xl border-border bg-card text-foreground">
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="starter">Khóa STARTER (Mất gốc → 3.0) — 4.400.000đ</SelectItem>
                    <SelectItem value="dreamer">Khóa DREAMER (3.0 → 4.0) — 4.900.000đ</SelectItem>
                    <SelectItem value="builder">Khóa BUILDER (4.0 → 5.0) — 5.400.000đ</SelectItem>
                    <SelectItem value="master">Khóa MASTER (5.0 → 6.0) — 5.900.000đ</SelectItem>
                    <SelectItem value="leader">Khóa LEADER (6.0 → 6.5+) — 6.400.000đ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Ca học mong muốn */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="trial-shift" className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Ca học mong muốn
                </Label>
                <Select value={shiftPreference} onValueChange={setShiftPreference}>
                  <SelectTrigger id="trial-shift" className="h-11 rounded-xl border-border bg-card text-foreground">
                    <SelectValue placeholder="Chọn ca học" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Tối 2-4-6 (18:30 - 20:30)">Tối Thứ 2 - 4 - 6 (18:30 - 20:30)</SelectItem>
                    <SelectItem value="Tối 3-5-7 (18:30 - 20:30)">Tối Thứ 3 - 5 - 7 (18:30 - 20:30)</SelectItem>
                    <SelectItem value="Sáng / Chiều Cuối tuần (T7 - CN)">Sáng / Chiều Cuối tuần (T7 - CN)</SelectItem>
                    <SelectItem value="Linh hoạt theo tư vấn">Linh hoạt theo tư vấn của trung tâm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm transition-all"
                >
                  {loading ? "Đang xử lý..." : "Nhận lịch học thử"}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                <span>Hotline giải đáp trực tiếp: <a href="tel:0933319693" className="font-bold text-foreground hover:underline">0933.319.693</a></span>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
