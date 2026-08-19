import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { submitAssessmentBooking } from "@/lib/assessmentService";
import { toast } from "sonner";

export default function AssessmentPage() {
  const navigate = useNavigate();

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
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
        fullName,
        phone: cleanPhone,
        email,
        currentLevel,
        targetBand,
        testFormat,
      });

      if (res.success) {
        setSubmittedBooking({
          fullName,
          phone: cleanPhone,
          targetBand,
          testFormat: testFormat === "online" ? "Online qua NextBand LMS" : "Trực tiếp tại cơ sở Dĩ An",
        });
        toast.success("Đăng ký bài khảo thí thành công!");
      }
    } catch (err: any) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại hoặc gọi Hotline 0933.319.693");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setSubmittedBooking(null);
  };

  return (
    <div className="flex flex-col">
      <SEO
        title="Khảo Thí Đánh Giá Năng Lực Đầu Vào — Học Viện ARIS"
        description="Khảo thí 4 kỹ năng miễn phí, xác định chính xác Rank năng lực theo khung 7 cấp bậc ARIS-7 và nhận báo cáo giải phẫu điểm nghẽn học thuật."
      />

      {/* ========================================================================= */}
      {/* 01. HERO HEADER                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/20 text-xs sm:text-sm font-black uppercase tracking-wider">
            <FileCheck className="h-4 w-4" />
            <span>Cổng Khảo Thí Chuẩn Hóa ARIS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Biết chính xác bạn{" "}
            <span className="text-brand-blue block sm:inline">
              đang ở đâu.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Bài khảo thí 45 phút giúp bóc tách năng lực thực tế, nhận diện chính xác các điểm nghẽn về ngữ pháp, từ vựng và định vị Rank của bạn theo khung 7 cấp bậc ARIS-7.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("booking-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-white shadow-sm gap-2.5"
            >
              <span>Đăng ký bài khảo thí ngay</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/assessment/result/demo")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Xem báo cáo kết quả mẫu (Demo)
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. REGISTRATION FORM & VALUE SECTION                                     */}
      {/* ========================================================================= */}
      <SectionContainer
        id="booking-section"
        badge="Đăng Ký Khảo Thí"
        title="Đặt lịch làm bài đánh giá năng lực"
        description="Điền thông tin bên dưới để nhận tài khoản làm bài khảo thí chuẩn Cambridge và nhận báo cáo điểm nghẽn chi tiết."
        background="default"
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
                      Cảm ơn <strong>{submittedBooking.fullName}</strong>. Ban Chuyên Môn ARIS đã tiếp nhận thông tin và sẽ gửi hướng dẫn làm bài qua số điện thoại <strong>{submittedBooking.phone}</strong>.
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
                      onClick={() => navigate("/assessment/result/demo")}
                      className="rounded-2xl px-6 h-12 font-bold text-sm bg-brand-blue hover:bg-brand-blue-hover text-white"
                    >
                      Xem trước giao diện báo cáo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleResetForm}
                      className="rounded-2xl px-6 h-12 font-bold text-sm border-2 border-border/80"
                    >
                      Đăng ký người khác
                    </Button>
                  </div>
                </div>
              ) : (
                /* Input Form */
                <>
                  <div>
                    <h3 className="font-black text-foreground text-2xl">
                      Thông Tin Người Làm Bài
                    </h3>
                    <p className="text-sm text-foreground/75 mt-1">
                      Hoàn toàn miễn phí. Kết quả và báo cáo bóc tách lỗi được trả về trong vòng 24 giờ.
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
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
                          Số điện thoại *
                        </Label>
                        <Input
                          id="assess-phone"
                          required
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Ví dụ: 0912 345 678"
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
                      <Label className="text-sm font-bold">Hình thức làm bài mong muốn</Label>
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
                            <div className="font-bold text-sm">Online</div>
                            <div>Làm trên NextBand LMS</div>
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
                          <span>Đăng Ký Làm Bài Khảo Thí Ngay</span>
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
                Bạn Nhận Được Gì?
              </h3>

              <div className="space-y-4 text-sm sm:text-base">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-success/15 text-success shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Xác định Rank năng lực thực tế</div>
                    <div className="text-foreground/75 text-xs sm:text-sm mt-0.5">
                      Định vị chính xác bạn đang ở Rank nào trong hệ thống ARIS-7 mà không phải đoán mò.
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
                      Chỉ rõ bạn đang yếu ở ngữ pháp cấu trúc, vốn từ vựng hay tốc độ phản xạ logic.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-brand-red-soft text-brand-red shrink-0 mt-0.5">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Đề xuất lộ trình chặng học tối ưu</div>
                    <div className="text-foreground/75 text-xs sm:text-sm mt-0.5">
                      Tư vấn đúng khóa học cần học (từ Starter đến Leader), tránh học lan man tốn kém thời gian.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                Hotline hỗ trợ khảo thí trực tiếp:{" "}
                <a href="tel:0933319693" className="font-bold text-brand-red underline">
                  0933.319.693
                </a>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 03. 4-STEP ASSESSMENT FLOW                                                */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Quy Trình Khảo Thí"
        title="4 Bước xác định vị trí và lộ trình học"
        description="Quy trình khảo thí được thiết kế để đưa ra kết quả trung thực và khách quan nhất trong thời gian ngắn."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Bước 01
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Làm bài khảo thí</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Thực hiện bài kiểm tra trắc nghiệm kết hợp viết đoạn ngắn (45 phút) mô phỏng cấu trúc đề thi chuẩn Cambridge.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Bước 02
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Phân tích điểm nghẽn</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Hệ thống bóc tách các nhóm lỗi sai ngữ pháp, độ chính xác dùng từ và tốc độ phản xạ xử lý câu hỏi.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Bước 03
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Định vị Rank ARIS</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Xác định bạn đang thuộc Cấp bậc nào từ Rank 3 đến Rank 9, với tiêu chuẩn năng lực tương ứng.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Bước 04
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Đề xuất khóa học</h3>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Gợi ý chặng học phù hợp nhất (STARTER → DREAMER → BUILDER → MASTER → LEADER) để bạn tiến bộ nhanh nhất.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
