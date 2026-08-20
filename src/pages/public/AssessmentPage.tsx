import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { examsApi } from "@/lib/api";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  } | null>(null);

  // Fetch published placement exams
  const { data: examsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ["public-assessment-exams"],
    queryFn: () => examsApi.list({ isPublished: true, limit: 10 }).catch(() => ({ data: [] })),
  });

  const availableExams = examsData?.data || [];
  const primaryReadingExam = availableExams.find(
    (e: any) =>
      e.title?.toLowerCase().includes("reading") ||
      (e.sections || []).some((s: any) => s.sectionType === "reading")
  ) || availableExams[0];

  const primaryListeningExam = availableExams.find(
    (e: any) =>
      e.title?.toLowerCase().includes("listening") ||
      (e.sections || []).some((s: any) => s.sectionType === "listening")
  ) || (availableExams.length > 1 ? availableExams[1] : availableExams[0]);

  const handleStartExam = (examId?: string) => {
    if (!examId) {
      toast.info("Đang kết nối phòng thi khảo thí chuẩn...");
      // If no specific exam id, pick available or route to first exam
      if (availableExams.length > 0) {
        navigate(`/exam/${availableExams[0].id}?isAssessment=true`);
      } else {
        navigate(`/assessment/result/demo`);
      }
      return;
    }
    navigate(`/exam/${examId}?isAssessment=true`);
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
        title="Chọn bộ đề khảo thí IELTS để bắt đầu làm bài"
        description="Toàn bộ đề thi được thiết kế chuẩn cấu trúc phòng thi IELTS quốc tế với đồng hồ bấm giờ, âm thanh Audio bản ngữ và hệ thống tính điểm tự động."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {/* Card 1: IELTS Academic Reading */}
          <Card className="rounded-3xl border-2 border-border/80 bg-card hover:border-brand-blue/60 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue">
                  <BookOpen className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-brand-blue/10 text-brand-blue border-brand-blue/20 font-bold text-xs">
                  Academic Reading
                </Badge>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  IELTS Academic Reading Placement
                </h3>
                <p className="text-xs sm:text-sm text-foreground/75 mt-1 leading-relaxed">
                  Trọn bộ 2 đoạn văn học thuật chuẩn Cambridge. Đo lường kỹ năng Skimming, Scanning và xử lý câu hỏi suy luận logic.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Thời gian làm bài:</span>
                  <strong className="text-foreground">40 Phút</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> Số lượng câu hỏi:</span>
                  <strong className="text-foreground">26 Câu hỏi</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> Thang điểm đo lường:</span>
                  <strong className="text-brand-blue font-bold">Band 3.0 – 9.0</strong>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                onClick={() => handleStartExam(primaryReadingExam?.id)}
                className="w-full h-12 rounded-xl font-extrabold text-sm bg-brand-blue hover:bg-brand-blue-hover text-white gap-2 shadow-xs"
              >
                <span>Bắt đầu thi Reading ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Card 2: IELTS Cambridge Listening */}
          <Card className="rounded-3xl border-2 border-border/80 bg-card hover:border-brand-red/60 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-brand-red-soft text-brand-red">
                  <Headphones className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-brand-red/10 text-brand-red border-brand-red/20 font-bold text-xs">
                  Cambridge Listening
                </Badge>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  IELTS Listening Placement Test
                </h3>
                <p className="text-xs sm:text-sm text-foreground/75 mt-1 leading-relaxed">
                  Khảo thí kỹ năng nghe hiểu qua 2 Sections có Audio bản ngữ chuẩn (Hội thoại xã hội &amp; Thuyết trình học thuật).
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Thời gian làm bài:</span>
                  <strong className="text-foreground">25 Phút</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> Số lượng câu hỏi:</span>
                  <strong className="text-foreground">20 Câu hỏi</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> Thang điểm đo lường:</span>
                  <strong className="text-brand-red font-bold">Band 3.0 – 9.0</strong>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                onClick={() => handleStartExam(primaryListeningExam?.id)}
                className="w-full h-12 rounded-xl font-extrabold text-sm bg-brand-red hover:bg-brand-red-hover text-white gap-2 shadow-xs"
              >
                <span>Bắt đầu thi Listening ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Card 3: Full-Skills Assessment */}
          <Card className="rounded-3xl border-2 border-border/80 bg-card hover:border-brand-cyan/60 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
            <div className="p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-brand-cyan/15 text-brand-blue">
                  <Award className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs">
                  Full 4 Kỹ Năng
                </Badge>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  IELTS Full-Skills Comprehensive
                </h3>
                <p className="text-xs sm:text-sm text-foreground/75 mt-1 leading-relaxed">
                  Khảo thí toàn diện Listening, Reading và bài viết Writing Task 2 được thẩm định trực tiếp bởi Giảng viên 8.0+.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/60 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Thời gian làm bài:</span>
                  <strong className="text-foreground">60 Phút</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> Kỹ năng thẩm định:</span>
                  <strong className="text-foreground">L + R + Writing</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-primary" /> Đánh giá chuyên môn:</span>
                  <strong className="text-emerald-600 font-bold">1:1 Line-by-Line</strong>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Button
                onClick={() => {
                  const el = document.getElementById("booking-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                variant="outline"
                className="w-full h-12 rounded-xl font-bold text-sm border-2 border-border/80 hover:bg-muted gap-2"
              >
                <span>Đặt lịch test 4 kỹ năng</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
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
                      onClick={() => setSubmittedBooking(null)}
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
    </div>
  );
}
