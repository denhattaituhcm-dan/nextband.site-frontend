import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { AcademicRankSystem } from "@/components/public/AcademicRankSystem";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  ArrowRight,
  GraduationCap,
  BookOpen,
  Target,
  Brain,
  Award,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Clock,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { getFeaturedEvidence, fetchEvidenceListAsync, EvidenceItem } from "@/lib/evidenceStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PublicHomePage() {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = React.useState<EvidenceItem[]>(getFeaturedEvidence);
  const [selectedEvidence, setSelectedEvidence] = React.useState<EvidenceItem | null>(null);

  React.useEffect(() => {
    fetchEvidenceListAsync().then((list) => {
      const published = list.filter((item) => item.published && item.consentConfirmed);
      const featured = published.filter((item) => item.featured);
      setFeaturedItems(featured.length > 0 ? featured.slice(0, 4) : published.slice(0, 3));
    }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      <SEO
        title="ARIS — Học Tiếng Anh Từ Bản Chất"
        description="ARIS — Học tiếng Anh từ bản chất. Không học mẹo. Không học thuộc bài mẫu. Định vị chính xác năng lực và bóc tách từng lỗi sai để đạt điểm IELTS mong muốn."
      />

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-24 sm:pb-32 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Left: Headline, Subheadline & Primary Action */}
            <div className="lg:col-span-7 space-y-7 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                <GraduationCap className="h-4 w-4" />
                <span>Học Viện ARIS</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[62px] font-black text-foreground tracking-tight leading-[1.12]">
                Học tiếng Anh{" "}
                <span className="text-brand-red underline decoration-brand-red/30 underline-offset-8">
                  từ bản chất
                </span>
                .
                <br />
                <span className="text-brand-blue block mt-2">
                  Không học mẹo. Không học thuộc bài mẫu.
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-[22px] text-foreground/85 font-normal leading-relaxed max-w-2xl">
                ARIS giúp bạn hiểu rõ năng lực hiện tại, bóc tách từng lỗi sai và xây dựng tư duy ngôn ngữ vững chắc để đạt điểm IELTS mong muốn.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/assessment")}
                  className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2.5"
                >
                  <span>Đánh giá năng lực miễn phí</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/academic-system")}
                  className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
                >
                  Khám phá hệ thống học thuật
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-7 border-t border-border/80 flex flex-wrap items-center gap-6 sm:gap-8 text-sm sm:text-base text-foreground/80 font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Giảng viên có chứng chỉ chuyên môn
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Hệ thống học tập riêng
                </span>
              </div>
            </div>

            {/* Right: 3-Question Framework Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-border/90 bg-card p-7 sm:p-9 shadow-sm space-y-6">
                <div className="space-y-1.5 border-b border-border/70 pb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-brand-blue font-extrabold">
                    Khung Đào Tạo ARIS
                  </span>
                  <h4 className="font-black text-foreground text-lg sm:text-xl">
                    3 Câu Hỏi Định Hình Sự Tiến Bộ
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-1.5 text-left">
                    <div className="flex items-center gap-2.5 text-base font-extrabold text-foreground">
                      <span className="h-7 w-7 rounded-xl bg-brand-blue-soft text-brand-blue font-mono text-xs flex items-center justify-center font-black">
                        1
                      </span>
                      <span>Bạn đang ở đâu?</span>
                    </div>
                    <p className="text-sm sm:text-[15px] text-foreground/75 leading-relaxed pl-9">
                      Định vị chính xác trình độ hiện tại theo khung 7 cấp bậc.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-1.5 text-left">
                    <div className="flex items-center gap-2.5 text-base font-extrabold text-foreground">
                      <span className="h-7 w-7 rounded-xl bg-brand-blue-soft text-brand-blue font-mono text-xs flex items-center justify-center font-black">
                        2
                      </span>
                      <span>Điều gì cản trở bạn?</span>
                    </div>
                    <p className="text-sm sm:text-[15px] text-foreground/75 leading-relaxed pl-9">
                      Bóc tách chi tiết từng lỗi sai về ngữ pháp, từ vựng và lập luận.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-border/70 bg-muted/20 space-y-1.5 text-left">
                    <div className="flex items-center gap-2.5 text-base font-extrabold text-foreground">
                      <span className="h-7 w-7 rounded-xl bg-brand-blue-soft text-brand-blue font-mono text-xs flex items-center justify-center font-black">
                        3
                      </span>
                      <span>Bước tiếp theo là gì?</span>
                    </div>
                    <p className="text-sm sm:text-[15px] text-foreground/75 leading-relaxed pl-9">
                      Lộ trình rèn luyện rõ ràng và bài tập sửa lỗi có người theo sát.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-brand-blue text-white text-left space-y-1.5 shadow-2xs">
                  <div className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-cyan" />
                    <span>Học có kỷ luật &amp; đo lường minh bạch</span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Mọi bài nộp được lưu trữ và chấm chữa chi tiết trên hệ thống để bạn thấy rõ sự tiến bộ qua từng ngày.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: THE REAL PROBLEM (VẤN ĐỀ THẬT SỰ)                             */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Thực Tế Người Học"
        title="Vì sao bạn giải nhiều đề nhưng điểm số vẫn đứng yên?"
        description="Làm 100 bài tập mà không được chỉ rõ lỗi sai thì bạn chỉ đang lặp lại lỗi cũ 100 lần. Điểm số chỉ thay đổi khi bạn biết chính xác vì sao câu văn của mình chưa đạt."
        containerSize="md"
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="p-3 rounded-2xl bg-primary-soft text-primary w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-lg sm:text-xl">Học vẹt bài mẫu</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Điểm thi có thể tạm tăng trong ngắn hạn, nhưng bạn mất hoàn toàn khả năng tự diễn giải ý tưởng khi gặp đề lạ.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="p-3 rounded-2xl bg-primary-soft text-primary w-fit">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-lg sm:text-xl">Nhận xét chung chung</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Những lời phê như "cần viết tự nhiên hơn" không giúp bạn biết phải sửa từ nào hay cấu trúc ngữ pháp nào.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="p-3 rounded-2xl bg-primary-soft text-primary w-fit">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-foreground text-lg sm:text-xl">Thiếu lộ trình đo lường</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Học theo cảm tính mà không biết mình đang ở chặng nào và cần hoàn thiện điều gì để bứt phá lên band tiếp theo.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 3: THE ARIS WAY (CƠ CHẾ TRI NHẬN NGÔN NGỮ)                       */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="The ARIS Way"
        title="ARIS không bắt đầu từ câu tiếng Anh. Chúng tôi bắt đầu từ cách bạn tổ chức suy nghĩ."
        description="Thay vì dịch ghép từng từ từ tiếng Việt, The ARIS Way dẫn dắt bạn bóc tách ý niệm, xác định góc nhìn và định hình cấu trúc trước khi tạo lập câu văn hoàn chỉnh."
        background="default"
      >
        <div className="space-y-8 text-left max-w-5xl mx-auto">
          {/* Input Thought / Điểm xuất phát ý niệm */}
          <div className="p-5 sm:p-6 rounded-3xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground font-mono">
                <span className="h-2 w-2 rounded-full bg-brand-blue animate-pulse" />
                <span>Ý tưởng ban đầu (The Input Thought)</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-foreground">
                "Chính phủ cần cấp ngân sách đáng kể để hỗ trợ các cộng đồng gặp khó khăn."
              </p>
            </div>
            <div className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue border border-brand-blue/20 w-fit">
              Xuất phát điểm tư duy
            </div>
          </div>

          {/* 2-Column Transformation Comparison (Desktop) / Vertical (Mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Left: Lối dịch trực tiếp */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl border border-border/80 bg-card space-y-5 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-muted text-muted-foreground text-xs font-mono font-black flex items-center justify-center">
                      A
                    </span>
                    <h3 className="font-black text-foreground text-base sm:text-lg">
                      Lối Dịch Trực Tiếp
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                    Direct Translation
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border/70 space-y-2">
                  <div className="text-xs font-mono font-bold text-muted-foreground uppercase">
                    Câu hình thành:
                  </div>
                  <p className="font-mono text-sm sm:text-base font-bold text-foreground leading-relaxed">
                    "The government gave a lot of money to help poor people."
                  </p>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  <p>
                    <strong className="text-foreground">Đặc điểm:</strong> Người học dịch nối từng cụm từ tiếng Việt sang tiếng Anh. Câu truyền đạt được nghĩa cơ bản nhưng ở văn phong sinh hoạt thông thường, chưa thể hiện được sự tinh tế và chuẩn xác trong ngữ cảnh học thuật.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground font-medium italic">
                Dừng lại ở việc biểu đạt nghĩa bề mặt.
              </div>
            </div>

            {/* Right: The ARIS Way (4 nấc thang tri nhận) */}
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl border-2 border-brand-blue/30 bg-card space-y-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-brand-blue/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-brand-blue text-white text-xs font-mono font-black flex items-center justify-center shadow-xs">
                      B
                    </span>
                    <h3 className="font-black text-foreground text-base sm:text-lg">
                      Cơ Chế The ARIS Way
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-brand-blue bg-brand-blue-soft px-2.5 py-1 rounded-md border border-brand-blue/20">
                    Cognitive Framing
                  </span>
                </div>

                {/* 4 Nấc thang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 font-black text-foreground">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue font-bold">
                        01
                      </span>
                      <span>Ý Niệm (Concept)</span>
                    </div>
                    <p className="text-foreground/75 pl-7 text-xs leading-relaxed">
                      Phân bổ ngân sách công vụ &amp; Nhóm yếu thế.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 font-black text-foreground">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue font-bold">
                        02
                      </span>
                      <span>Góc Nhìn (Perspective)</span>
                    </div>
                    <p className="text-foreground/75 pl-7 text-xs leading-relaxed">
                      Chính phủ là chủ thể điều phối nguồn lực.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-1">
                    <div className="flex items-center gap-2 font-black text-foreground">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-brand-blue-soft text-brand-blue font-bold">
                        03
                      </span>
                      <span>Cấu Trúc (Structure)</span>
                    </div>
                    <p className="text-foreground/75 pl-7 text-xs leading-relaxed font-mono">
                      allocated [funding] to support...
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-brand-blue-soft/50 border border-brand-blue/30 space-y-1">
                    <div className="flex items-center gap-2 font-black text-brand-blue">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-brand-blue text-white font-bold">
                        04
                      </span>
                      <span>Diễn Đạt (Expression)</span>
                    </div>
                    <p className="text-foreground/80 pl-7 text-xs leading-relaxed font-medium">
                      Lựa chọn từ ngữ học thuật chuẩn xác.
                    </p>
                  </div>
                </div>

                {/* Final Sentence Result */}
                <div className="p-4 sm:p-5 rounded-2xl bg-brand-blue text-white space-y-1.5 shadow-sm">
                  <div className="text-xs font-mono font-black uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Câu hoàn chỉnh theo cấu trúc học thuật:</span>
                  </div>
                  <p className="font-mono text-sm sm:text-base font-bold text-white leading-relaxed">
                    "The government allocated substantial funding to support vulnerable communities."
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-brand-blue font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Hiểu cơ chế lựa chọn ngôn ngữ thay vì học thuộc bài mẫu.</span>
              </div>
            </div>
          </div>

          {/* Socratic & NextBand Learning Loop Box */}
          <div className="p-6 sm:p-7 rounded-3xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-left shadow-2xs">
            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-blue font-mono">
                <RefreshCw className="h-3.5 w-3.5 text-brand-blue" />
                <span>Vòng Lặp Rèn Luyện (The Learning Loop)</span>
              </div>
              <h4 className="font-black text-foreground text-base sm:text-lg">
                Giáo viên hỏi để bạn tự thấy nguyên nhân câu chưa chuẩn.
              </h4>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Khi có câu viết chưa đạt, giáo viên đặt câu hỏi truy vấn logic để bạn tự nhận ra lỗi tư duy, tự tay hoàn thành bài sửa (Re-attempt) và lưu vết tiến trình trên hệ thống NextBand.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate("/academic-system#the-aris-way")}
              className="rounded-2xl px-6 h-12 text-xs sm:text-sm font-extrabold border-2 border-border/80 hover:bg-muted text-foreground shrink-0 gap-2 w-full sm:w-auto"
            >
              <span>Khám phá chi tiết phương pháp</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 4: THE ARIS-7 ACADEMIC RANK SYSTEM                               */}
      {/* ========================================================================= */}
      <SectionContainer
        id="academic-system"
        badge="Bản Đồ Tiến Độ"
        title="Bạn đang ở đâu trên hành trình học tiếng Anh?"
        description="ARIS chuẩn hóa lộ trình thành 7 cấp bậc rõ ràng. Mỗi bậc đều có tiêu chuẩn năng lực cụ thể, giúp bạn biết mình đã làm được gì và cần thêm điều gì để nâng band."
        background="elevated"
      >
        <AcademicRankSystem initialRank={5} />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center">
          <Button
            size="lg"
            onClick={() => navigate("/assessment")}
            className="rounded-2xl px-8 h-13 text-sm sm:text-base font-extrabold bg-brand-red hover:bg-brand-red-hover text-white shadow-md gap-2"
          >
            <span>Khảo thí kiểm tra Rank hiện tại của bạn ngay (45 Phút)</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/academic-system")}
            className="rounded-2xl px-6 h-13 text-sm sm:text-base font-bold border-2 border-border/80 hover:bg-muted text-foreground"
          >
            <span>Xem chi tiết 7 cấp bậc &amp; 4 giai đoạn</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 5: NEXTBAND LEARNING SYSTEM (HỆ THỐNG HỌC TẬP RIÊNG)              */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Hệ Thống Học Tập Riêng"
        title="Mọi bài làm của bạn đều được theo dõi và sửa chữa kỹ lưỡng."
        description="Không gửi bài qua tin nhắn trôi nổi. Toàn bộ bài nộp, nhận xét của giáo viên và lịch sử bài sửa đều được lưu trữ minh bạch trên hệ thống học tập của ARIS."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <PlaceholderCard
            variant="feature"
            badge="Chấm chữa chi tiết"
            title="Sửa lỗi từng câu"
            description="Giáo viên chỉ rõ từng lỗi sai ngữ pháp, từ vựng và cách dùng từ để bạn hiểu rõ nguyên nhân câu văn chưa chuẩn."
            metadata={["Phân tích ngữ pháp", "Gợi ý viết lại"]}
          />

          <PlaceholderCard
            variant="feature"
            badge="Kỷ luật luyện tập"
            title="Làm bài sửa (Re-attempt)"
            description="Sau khi nhận phản hồi, học viên tự tay viết lại bài sửa để khắc phục triệt để lỗ hổng trước khi chuyển sang bài mới."
            metadata={["Khắc phục lỗi cũ", "Đo lường tiến bộ"]}
          />

          <PlaceholderCard
            variant="feature"
            badge="Minh bạch tiến trình"
            title="Nhật ký bài nộp"
            description="Dễ dàng xem lại toàn bộ lịch sử bài nộp, so sánh bài làm đầu khóa và hiện tại để thấy rõ sự tiến bộ thực tế."
            metadata={["Lưu trữ bài nộp", "Biểu đồ kỹ năng"]}
          />
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 6: 5-COURSE PROGRESSION PATHWAYS                                 */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Lộ Trình Đào Tạo"
        title="5 Chặng rèn luyện bám sát từng mốc năng lực."
        description="Không học lớp quá dễ gây lãng phí thời gian, không học lớp quá khó gây nản lòng. 5 khóa học của ARIS được cấu trúc thành 2 chặng phát triển rõ ràng."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Pathway 1: Foundation */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
            <div className="space-y-1.5 border-b border-border/60 pb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-brand-blue font-extrabold">
                Giai Đoạn 1: Xây Nền Năng Lực
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Lộ Trình Nền Tảng (Mất gốc → 5.0)
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                Tập trung phát âm IPA chuẩn, làm chủ ngữ pháp câu và đọc/nghe hiểu văn bản học thuật.
              </p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => navigate("/courses/starter")}
                className="p-4 rounded-2xl border border-border/70 bg-muted/20 hover:border-[#EE6873]/50 hover:bg-[#EE6873]/5 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-[#EE6873]/15 text-[#EE6873] border border-[#EE6873]/30">
                      STARTER
                    </span>
                    <span className="text-sm font-extrabold text-foreground">Đầu ra 3.0</span>
                  </div>
                  <p className="text-xs text-foreground/70 mt-1">Mất gốc → Nền tảng phát âm IPA &amp; Từ vựng sinh hoạt</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              <div
                onClick={() => navigate("/courses/dreamer")}
                className="p-4 rounded-2xl border border-border/70 bg-muted/20 hover:border-[#294398]/50 hover:bg-[#294398]/5 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-[#294398]/15 text-[#294398] border border-[#294398]/30">
                      DREAMER
                    </span>
                    <span className="text-sm font-extrabold text-foreground">3.0 → 4.0</span>
                  </div>
                  <p className="text-xs text-foreground/70 mt-1">Ngữ pháp câu phức &amp; Đọc hiểu đoạn văn học thuật ngắn</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              <div
                onClick={() => navigate("/courses/builder")}
                className="p-4 rounded-2xl border border-border/70 bg-muted/20 hover:border-[#F37C42]/50 hover:bg-[#F37C42]/5 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-[#F37C42]/15 text-[#F37C42] border border-[#F37C42]/30">
                      BUILDER
                    </span>
                    <span className="text-sm font-extrabold text-foreground">4.0 → 5.0</span>
                  </div>
                  <p className="text-xs text-foreground/70 mt-1">Làm quen 4 kỹ năng IELTS &amp; Viết đoạn văn có luận điểm</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>
          </div>

          {/* Pathway 2: Breakthrough */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
            <div className="space-y-1.5 border-b border-border/60 pb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-brand-red font-extrabold">
                Giai Đoạn 2: Bứt Phá Điểm Số
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Lộ Trình Chuyên Sâu (5.0 → 6.5+)
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                Huấn luyện phương pháp The ARIS Way, viết luận Task 2 và phản xạ nói đa chiều.
              </p>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => navigate("/courses/master")}
                className="p-4 rounded-2xl border border-border/70 bg-muted/20 hover:border-[#538442]/50 hover:bg-[#538442]/5 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-[#538442]/15 text-[#538442] border border-[#538442]/30">
                      MASTER
                    </span>
                    <span className="text-sm font-extrabold text-foreground">5.0 → 6.0</span>
                  </div>
                  <p className="text-xs text-foreground/70 mt-1">Viết luận Task 2, mô tả biểu đồ Task 1 &amp; Phản xạ Speaking</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>

              <div
                onClick={() => navigate("/courses/leader")}
                className="p-4 rounded-2xl border border-border/70 bg-muted/20 hover:border-[#D12E33]/50 hover:bg-[#D12E33]/5 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-md bg-[#D12E33]/15 text-[#D12E33] border border-[#D12E33]/30">
                      LEADER
                    </span>
                    <span className="text-sm font-extrabold text-foreground">6.0 → 6.5+</span>
                  </div>
                  <p className="text-xs text-foreground/70 mt-1">Văn phong học thuật tự nhiên &amp; Tư duy phản biện cấp cao</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-blue-soft/50 border border-brand-blue/20 text-xs text-foreground/80 font-bold space-y-1">
              <div className="flex items-center gap-2 text-brand-blue">
                <Users className="h-4 w-4" />
                <span>Quy chuẩn lớp học: Tối đa 08 học viên / lớp</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/courses")}
            className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg border-2 border-border/80 hover:bg-muted"
          >
            <span>Xem chi tiết toàn bộ 5 chương trình đào tạo</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* SECTION 7: EVIDENCE OF PROGRESS (MINH CHỨNG TIẾN BỘ)                       */}
      {/* ========================================================================= */}
      <SectionContainer
        id="evidence"
        badge="Minh Chứng Tiến Bộ"
        title="Tiến bộ thực tế từ sự rèn luyện nghiêm túc"
        description="Toàn bộ bảng vàng thành tích, lịch sử nâng band và các bước bứt phá năng lực của học viên được lưu vết chi tiết tại chuyên trang Tiến Bộ."
        background="default"
      >
        <div className="p-8 sm:p-12 rounded-3xl bg-muted/40 border border-border/80 text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <h4 className="text-2xl sm:text-3xl font-black text-foreground">
              Khám Phá Các Câu Chuyện Nâng Band &amp; Hồ Sơ Thực Nghiệm
            </h4>
            <p className="text-sm sm:text-base text-foreground/75 max-w-2xl mx-auto leading-relaxed">
              Mỗi câu chuyện là một hành trình rèn luyện kỷ luật thật, giải phẫu từng điểm nghẽn học thuật và đạt kết quả có thể kiểm chứng tại Học Viện ARIS.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => navigate("/results")}
            className="rounded-2xl px-8 h-14 font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-white shadow-md gap-2"
          >
            <span>Xem toàn bộ hồ sơ bằng chứng tiến bộ</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </SectionContainer>

      {/* Story Detail Dialog */}
      <Dialog open={Boolean(selectedEvidence)} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-2xl text-left">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">
              {selectedEvidence?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedEvidence && (
            <div className="space-y-6 pt-2">
              <div className="flex gap-4 sm:gap-6 items-center">
                <img
                  src={selectedEvidence.imageUrl}
                  alt={selectedEvidence.studentName}
                  className="w-20 h-20 rounded-2xl object-cover border border-border/80 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-foreground text-lg">
                      {selectedEvidence.studentName}
                    </span>
                    {selectedEvidence.studentSchool && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-blue-soft text-brand-blue">
                        {selectedEvidence.studentSchool}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-bold">
                    <span>{selectedEvidence.courseName}</span>
                    <span>•</span>
                    <span>{selectedEvidence.studyDuration}</span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown Bar */}
              <div className="p-4 rounded-2xl bg-brand-blue-soft/50 border border-brand-blue/20 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="space-y-0.5">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground">Overall</span>
                  <p className="text-lg font-black text-brand-red">{selectedEvidence.overallScore}</p>
                </div>
                {selectedEvidence.listeningScore && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase font-bold text-muted-foreground">Listening</span>
                    <p className="text-base font-extrabold text-foreground">{selectedEvidence.listeningScore}</p>
                  </div>
                )}
                {selectedEvidence.readingScore && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase font-bold text-muted-foreground">Reading</span>
                    <p className="text-base font-extrabold text-foreground">{selectedEvidence.readingScore}</p>
                  </div>
                )}
                {selectedEvidence.writingScore && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase font-bold text-muted-foreground">Writing</span>
                    <p className="text-base font-extrabold text-foreground">{selectedEvidence.writingScore}</p>
                  </div>
                )}
                {selectedEvidence.speakingScore && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] uppercase font-bold text-muted-foreground">Speaking</span>
                    <p className="text-base font-extrabold text-foreground">{selectedEvidence.speakingScore}</p>
                  </div>
                )}
              </div>

              {/* Story Content */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">
                  Chia sẻ của học viên
                </h4>
                <p className="text-sm sm:text-base text-foreground/85 leading-relaxed bg-muted/30 p-5 rounded-2xl border border-border/60">
                  "{selectedEvidence.story}"
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => setSelectedEvidence(null)}
                  className="rounded-xl font-bold text-xs"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SECTION 8: FINAL CONVERSION BANNER (HÀNH ĐỘNG NGAY)                       */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Target className="h-4 w-4 text-brand-cyan" />
            <span>Bắt Đầu Đúng Cách</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Bắt đầu bằng việc biết chính xác bạn đang ở đâu.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Làm bài kiểm tra năng lực đầu vào miễn phí để nhận phân tích chi tiết điểm mạnh, điểm yếu và gợi ý lộ trình học tập phù hợp từ ARIS.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red text-white hover:bg-brand-red-hover shadow-md border-0 gap-2.5"
            >
              <span>Làm bài kiểm tra năng lực ngay</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white"
            >
              Liên hệ nhận tư vấn trực tiếp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
