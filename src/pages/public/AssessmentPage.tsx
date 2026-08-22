import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { assessmentApi, examsApi } from "@/lib/api";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEO } from "@/components/common/SEO";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Brain,
  FileCheck,
  Target,
  Award,
  Send,
  Loader2,
  Calendar,
  Laptop,
  Building,
  Headphones,
  BookOpen,
  PenTool,
  Sparkles,
  Flame,
  HelpCircle,
  Play,
  User,
  Phone,
} from "lucide-react";
import { submitAssessmentBooking } from "@/lib/assessmentService";
import { toast } from "sonner";

export default function AssessmentPage() {
  const navigate = useNavigate();

  // Booking form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentLevel, setCurrentLevel] = useState("Mới bắt đầu / Mất gốc");
  const [targetBand, setTargetBand] = useState("IELTS 6.5");
  const [testFormat, setTestFormat] = useState<"online" | "offline">("online");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<{
    fullName: string;
    phone: string;
    targetBand: string;
    testFormat: string;
    sessionId?: string;
  } | null>(null);

  // Quick Clean-Room Assessment Launch Modal State
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [startExamTitle, setStartExamTitle] = useState("IELTS Clean-Room Assessment");
  const [startCandidateName, setStartCandidateName] = useState("");
  const [startCandidatePhone, setStartCandidatePhone] = useState("");
  const [startTargetBand, setStartTargetBand] = useState("IELTS 6.5");
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Fetch published placement exams (for reference/info)
  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ["public-assessment-exams"],
    queryFn: () => examsApi.list({ isPublished: true, limit: 10 }).catch(() => ({ data: [] })),
  });

  const handleOpenStartModal = (title: string) => {
    setStartExamTitle(title);
    // Pre-fill from booking form if user already typed there
    if (fullName.trim()) setStartCandidateName(fullName.trim());
    if (phone.trim()) setStartCandidatePhone(phone.trim());
    if (targetBand) setStartTargetBand(targetBand);
    setIsStartModalOpen(true);
  };

  const handleConfirmStartAssessment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = startCandidateName.trim();
    const cleanPhone = startCandidatePhone.trim().replace(/\s+/g, "");

    if (!cleanName) {
      toast.error("Vui lòng nhập họ và tên của bạn");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)");
      return;
    }

    setIsStartingSession(true);
    try {
      const res = await assessmentApi.createSession({
        fullName: cleanName,
        phone: cleanPhone,
        targetBand: startTargetBand,
      });

      if (res && res.sessionId) {
        toast.success("Khởi tạo phòng thi khảo thí thành công!");
        setIsStartModalOpen(false);
        navigate(`/assessment/take/${res.sessionId}`);
      } else {
        throw new Error("Không nhận được mã phiên thi hợp lệ");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối phòng thi. Vui lòng thử lại!");
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ và tên của bạn");
      return;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAssessmentBooking({
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email.trim(),
        currentLevel,
        targetBand,
        testFormat,
      });

      if (res.success) {
        setSubmittedBooking({
          fullName: fullName.trim(),
          phone: cleanPhone,
          targetBand,
          testFormat: testFormat === "online" ? "Online 1:1 qua Google Meet" : "Trực tiếp tại cơ sở Dĩ An",
        });
        toast.success("Đăng ký nhận tư vấn và đặt lịch khảo thí thành công!");
      }
    } catch (err: any) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại hoặc gọi Hotline 0933.319.693");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <SEO
        title="Khảo Thí Đánh Giá Năng Lực IELTS Chuẩn Quốc Tế — Học Viện ARIS"
        description="Khảo thí Reading & Listening chuẩn Cambridge, tính Band điểm chính xác 0.0 - 9.0 theo bảng quy đổi chính thức và định vị Rank ARIS-7."
      />

      {/* ========================================================================= */}
      {/* 01. HERO HEADER                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-16 sm:pt-24 sm:pb-20 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/20 text-xs sm:text-sm font-black uppercase tracking-wider">
            <FileCheck className="h-4 w-4" />
            <span>Cổng Khảo Thí Chuẩn Quốc Tế ARIS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Đo lường chính xác{" "}
            <span className="text-brand-blue block sm:inline">
              Band Điểm IELTS Thực Tế.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Làm bài thi thử chuẩn Cambridge trực tiếp trên hạ tầng phòng thi số NextBand. Tính toán chính xác Band điểm theo thang 9.0 và bóc tách điểm nghẽn học thuật chuyên sâu.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("online-tests-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2.5"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Vào Làm Bài Khảo Thí Online Ngay</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/assessment/result/demo")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Xem Báo Cáo Năng Lực Mẫu
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. ONLINE STANDARD IELTS TESTS SECTION                                   */}
      {/* ========================================================================= */}
      <SectionContainer
        id="online-tests-section"
        badge="Khảo Thí Trực Tuyến Chuẩn Cambridge"
        title="Bài Khảo Thí Năng Lực IELTS Toàn Diện (4 Kỹ Năng + Grammar)"
        description="Đề thi chẩn đoán chuẩn hóa được thiết kế trên phòng thi số Clean-Room NextBand, tích hợp đồng hồ kiểm soát, âm thanh bản ngữ và hệ thống định vị Rank ARIS-7 tự động."
        background="default"
      >
        <div className="max-w-4xl mx-auto">
          <Card className="rounded-3xl border-2 border-brand-blue/30 bg-card hover:border-brand-blue/60 shadow-lg transition-all overflow-hidden">
            <div className="p-7 sm:p-9 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue">
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                      IELTS Clean-Room Placement Test
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/75 mt-0.5">
                      Khảo thí chuẩn đoán đa tầng: Đo lường chính xác từ nền tảng phản xạ đến tư duy học thuật.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold text-xs px-3 py-1">
                  Full 4 Kỹ Năng + Ngữ Pháp
                </Badge>
              </div>

              {/* 4 Skills Breakdown in 1 test */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-brand-red font-bold text-xs">
                    <Headphones className="h-4 w-4" />
                    <span>01. Listening</span>
                  </div>
                  <div className="text-xs text-foreground/80">Audio bản ngữ, bẫy phát âm &amp; từ khóa</div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-brand-blue font-bold text-xs">
                    <BookOpen className="h-4 w-4" />
                    <span>02. Reading</span>
                  </div>
                  <div className="text-xs text-foreground/80">Đo Skimming, Scanning &amp; Logic T/F/NG</div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <PenTool className="h-4 w-4" />
                    <span>03. Grammar &amp; W</span>
                  </div>
                  <div className="text-xs text-foreground/80">Cấu trúc câu &amp; triển khai lập luận Task 2</div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1 text-left">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <Brain className="h-4 w-4" />
                    <span>04. Speaking</span>
                  </div>
                  <div className="text-xs text-foreground/80">Ghi âm phản xạ Part 1 &amp; Part 2 trực tiếp</div>
                </div>
              </div>

              {/* Key Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/60 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>Thời lượng: <strong className="text-foreground">45 Phút (Bấm giờ tự động)</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Target className="h-4 w-4 text-primary shrink-0" />
                  <span>Định lượng: <strong className="text-foreground">Band 3.0 – 9.0</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Chuẩn đầu ra: <strong className="text-brand-blue font-bold">Khung ARIS-7 Cấp Bậc</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={() => handleOpenStartModal("IELTS Clean-Room Placement Test (Full 4 Kỹ Năng)")}
                  className="w-full h-14 rounded-2xl font-black text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-white gap-3 shadow-md transition-all cursor-pointer"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>Bắt đầu bài khảo thí trực tuyến ngay (45 Phút)</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 03. 1:1 FACULTY CONSULTATION & SPEAKING/WRITING TEST                       */}
      {/* ========================================================================= */}
      <SectionContainer
        id="booking-section"
        badge="Khảo Thí 1:1 Với Giảng Viên 8.0+"
        title="Đặt lịch khảo thí chuyên sâu Speaking &amp; Writing"
        description="Dành cho học viên cần thẩm định phản xạ Speaking trực tiếp và nhận bài sửa Writing Task 1/2 chi tiết từng câu."
        background="muted"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 text-left">
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl border-2 border-border/80 bg-card space-y-6 shadow-2xs">
              {submittedBooking ? (
                /* Success Confirmation State */
                <div className="space-y-6 py-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/15 text-success mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                      Đăng Ký Khảo Thí Thành Công!
                    </h3>
                    <p className="text-sm sm:text-base text-foreground/80 max-w-md mx-auto leading-relaxed">
                      Cảm ơn <strong>{submittedBooking.fullName}</strong>. Ban Chuyên Môn ARIS đã tiếp nhận thông tin và sẵn sàng phòng thi cho bạn.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 text-left text-xs sm:text-sm space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mục tiêu điểm số:</span>
                      <span className="font-bold text-foreground">{submittedBooking.targetBand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hình thức khảo thí:</span>
                      <span className="font-bold text-brand-blue">{submittedBooking.testFormat}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <Button
                      onClick={() => setSubmittedBooking(null)}
                      className="rounded-2xl px-6 h-12 font-bold text-sm bg-brand-blue hover:bg-brand-blue-hover text-white shadow-xs"
                    >
                      Đăng ký cho người khác
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/")}
                      className="rounded-2xl px-6 h-12 font-bold text-sm border-2 border-border/80 text-foreground"
                    >
                      Quay về trang chủ
                    </Button>
                  </div>
                </div>
              ) : (
                /* Input Form */
                <>
                  <div>
                    <h3 className="font-black text-foreground text-2xl">
                      Thông Tin Người Khảo Thí
                    </h3>
                    <p className="text-sm text-foreground/75 mt-1">
                      Hoàn toàn miễn phí. Kết quả và báo cáo bóc tách lỗi được trả về trong vòng 24 giờ.
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmitBooking}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="assess-name" className="text-sm font-bold">
                          Họ và tên *
                        </Label>
                        <Input
                          id="assess-name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ví dụ: Trần Minh Hoàng"
                          className="rounded-xl h-12 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assess-phone" className="text-sm font-bold">
                          Số điện thoại có Zalo (để nhận kết quả test) <span className="text-brand-red">*</span>
                        </Label>
                        <Input
                          id="assess-phone"
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ví dụ: 0912 345 678 (SĐT có Zalo)"
                          className="rounded-xl h-12 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assess-email" className="text-sm font-bold">
                        Email nhận kết quả
                      </Label>
                      <Input
                        id="assess-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="rounded-xl h-12 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Trình độ hiện tại ước lượng</Label>
                        <select
                          value={currentLevel}
                          onChange={(e) => setCurrentLevel(e.target.value)}
                          className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="Mới bắt đầu / Mất gốc">Mới bắt đầu / Mất gốc (Rank 3)</option>
                          <option value="Đã có nền tảng cơ bản (khoảng 4.0 - 4.5)">Nền tảng cơ bản ~4.0 (Rank 4)</option>
                          <option value="Tương đương IELTS 5.0 - 5.5">Tương đương ~5.0 - 5.5 (Rank 5)</option>
                          <option value="Đã đạt IELTS 6.0+ trở lên">Đã đạt 6.0+ (Rank 6 trở lên)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-bold">Mục tiêu Band điểm hướng đến</Label>
                        <select
                          value={targetBand}
                          onChange={(e) => setTargetBand(e.target.value)}
                          className="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="IELTS 6.0">IELTS 6.0 (Xét tuyển ĐH)</option>
                          <option value="IELTS 6.5">IELTS 6.5 (Chuẩn đầu ra / Du học)</option>
                          <option value="IELTS 7.0">IELTS 7.0 (Học bổng / Định cư)</option>
                          <option value="IELTS 7.5+">IELTS 7.5+ (Chuyên sâu)</option>
                        </select>
                      </div>
                    </div>

                    {/* Test Format Toggle */}
                    <div className="space-y-2 pt-1">
                      <Label className="text-sm font-bold">Hình thức khảo thí mong muốn</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setTestFormat("online")}
                          className={`p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                            testFormat === "online"
                              ? "border-brand-blue bg-brand-blue-soft text-brand-blue font-bold shadow-2xs"
                              : "border-border/80 bg-background text-foreground/75 hover:bg-muted"
                          }`}
                        >
                          <Laptop className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <div className="font-bold text-sm">Online 1:1</div>
                            <div>Qua Google Meet</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTestFormat("offline")}
                          className={`p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                            testFormat === "offline"
                              ? "border-brand-red bg-brand-red-soft text-brand-red font-bold shadow-2xs"
                              : "border-border/80 bg-background text-foreground/75 hover:bg-muted"
                          }`}
                        >
                          <Building className="h-5 w-5 shrink-0" />
                          <div className="text-xs">
                            <div className="font-bold text-sm">Trực Tiếp</div>
                            <div>Tại cơ sở Dĩ An</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-2xl font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2 mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Đang gửi thông tin đăng ký...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Đăng Ký Khảo Thí 1:1 Ngay</span>
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Values */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 sm:p-10 rounded-3xl border border-border/80 bg-card space-y-6 shadow-2xs">
              <h3 className="font-black text-foreground text-2xl border-b border-border/60 pb-4">
                Quyền Lợi Khảo Thí Tại ARIS
              </h3>

              <div className="space-y-4 text-sm sm:text-base">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-success/15 text-success shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Đo lường Band điểm chuẩn xác</div>
                    <div className="text-foreground/75 text-xs sm:text-sm mt-0.5">
                      Tính điểm dựa trên bảng quy đổi chính thức của Hội đồng thi Cambridge IELTS.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-brand-blue-soft text-brand-blue shrink-0 mt-0.5">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Giải phẫu điểm nghẽn học thuật</div>
                    <div className="text-foreground/75 text-xs sm:text-sm mt-0.5">
                      Chỉ rõ dạng bài hay bị mất điểm (True/False/NG, Matching Headings, Collocations).
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-brand-red-soft text-brand-red shrink-0 mt-0.5">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Định vị Rank &amp; Khóa học tối ưu</div>
                    <div className="text-foreground/75 text-xs sm:text-sm mt-0.5">
                      Gợi ý chính xác chặng học phù hợp trong 5 khóa ARIS, tránh học vượt cấp gây nản chí.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                Hotline hỗ trợ kỹ thuật khảo thí:{" "}
                <a href="tel:0933319693" className="font-bold text-brand-red underline">
                  0933.319.693
                </a>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Quick Clean-Room Assessment Start Dialog Modal */}
      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <DialogContent className="sm:max-w-[460px] p-6 sm:p-8 rounded-3xl bg-background border border-border">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs font-bold w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Clean-Room IELTS Assessment</span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {startExamTitle}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
              Nhập thông tin thí sinh để khởi tạo phòng thi trực tuyến. Hệ thống sẽ tự động chấm điểm và lập báo cáo phân tích năng lực.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmStartAssessment} className="space-y-4 pt-2">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="start-name" className="text-xs font-bold text-foreground uppercase tracking-wider">
                Họ và tên thí sinh <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="start-name"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={startCandidateName}
                onChange={(e) => setStartCandidateName(e.target.value)}
                className="h-11 rounded-xl border-border bg-card text-foreground"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="start-phone" className="text-xs font-bold text-foreground uppercase tracking-wider">
                Số điện thoại có Zalo (để nhận kết quả test) <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="start-phone"
                required
                type="tel"
                placeholder="Nhập SĐT có Zalo (Ví dụ: 0933 319 693)"
                value={startCandidatePhone}
                onChange={(e) => setStartCandidatePhone(e.target.value)}
                className="h-11 rounded-xl border-border bg-card text-foreground"
              />
              <p className="text-[11px] text-muted-foreground leading-normal">
                * Giáo viên ARIS sẽ gửi bài chấm chi tiết và nhận xét qua Zalo theo số này.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="start-band" className="text-xs font-bold text-foreground uppercase tracking-wider">
                Mục tiêu Band điểm
              </Label>
              <Select value={startTargetBand} onValueChange={setStartTargetBand}>
                <SelectTrigger id="start-band" className="h-11 rounded-xl border-border bg-card text-foreground">
                  <SelectValue placeholder="Chọn mục tiêu" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="IELTS 5.0">IELTS 5.0 (Cơ bản / Tốt nghiệp ĐH)</SelectItem>
                  <SelectItem value="IELTS 5.5">IELTS 5.5 (Sơ trung cấp)</SelectItem>
                  <SelectItem value="IELTS 6.0">IELTS 6.0 (Xét tuyển ĐH / Du học)</SelectItem>
                  <SelectItem value="IELTS 6.5">IELTS 6.5 (Tiêu chuẩn đầu ra)</SelectItem>
                  <SelectItem value="IELTS 7.0">IELTS 7.0 (Chuyên sâu)</SelectItem>
                  <SelectItem value="IELTS 7.5+">IELTS 7.5+ (Xuất sắc / Định cư)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 space-y-2">
              <Button
                type="submit"
                disabled={isStartingSession}
                className="w-full h-12 rounded-xl font-extrabold text-sm sm:text-base bg-brand-red hover:bg-brand-red-hover text-white shadow-sm transition-all gap-2"
              >
                {isStartingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kết nối phòng thi...</span>
                  </>
                ) : (
                  <>
                    <span>Vào phòng thi khảo thí ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsStartModalOpen(false)}
                disabled={isStartingSession}
                className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
