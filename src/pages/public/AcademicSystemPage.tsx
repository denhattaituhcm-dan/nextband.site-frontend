import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { AcademicRankSystem } from "@/components/public/AcademicRankSystem";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  Brain,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Target,
  PenTool,
  Compass,
  ShieldCheck,
  Sparkles,
  FileCheck,
  MessageSquare,
} from "lucide-react";

export default function AcademicSystemPage() {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col">
      <SEO
        title="Hệ Thống Học Thuật ARIS — Phương Pháp The ARIS Way, Chuẩn Năng Lực & Khung ARIS-7"
        description="ARIS xây dựng năng lực ngôn ngữ theo một hệ thống rõ ràng: từ phương pháp tri nhận bản chất The ARIS Way, 4 chuẩn năng lực cốt lõi đến bản đồ 7 cấp bậc ARIS-7."
      />

      {/* ========================================================================= */}
      {/* 01. HERO SECTION: ACADEMIC THESIS                                         */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-black uppercase tracking-wider">
            <Layers className="h-4 w-4" />
            <span>Hệ Thống Học Thuật ARIS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.15]">
            ARIS xây dựng năng lực ngôn ngữ theo một hệ thống rõ ràng —{" "}
            <span className="text-brand-blue block sm:inline">
              từ cách hình thành câu, đến chuẩn năng lực và từng bước tiến bộ.
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-foreground/85 font-medium leading-relaxed max-w-3xl mx-auto">
            Không học mẹo, không học thuộc bài mẫu. ARIS kết hợp phương pháp luận tri nhận bản chất (The ARIS Way) và khung chuẩn năng lực học thuật (ARIS-7) để bạn thấu hiểu điểm nghẽn và đo lường sự tiến bộ thực chất.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-md gap-2"
            >
              <span>Tìm hiểu vị trí khởi điểm phù hợp</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollToSection("the-aris-way")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Khám phá phương pháp The ARIS Way
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. SECTION 02: THE ARIS WAY — HOW (CƠ CHẾ TƯ DUY)                        */}
      {/* ========================================================================= */}
      <section id="the-aris-way" className="scroll-mt-20">
        <SectionContainer
          badge="Phương Pháp The ARIS Way"
          title="Hiểu cách tiếng Anh tạo ra ý nghĩa từ bản chất"
          description="Phần lớn người học gặp bế tắc trong Writing và Speaking không phải vì thiếu từ vựng, mà vì đang mắc kẹt trong cơ chế dịch thô từng chữ từ tiếng Việt."
          background="muted"
        >
          {/* Comparison Cards: Old vs The ARIS Way */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Lối học cũ */}
            <div className="p-8 sm:p-10 rounded-3xl border-2 border-border/80 bg-card space-y-6 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xs px-3 py-1.5 rounded-xl bg-destructive/15 text-destructive uppercase tracking-wider">
                  Lối Học Cũ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  Dịch Thô &amp; Ghép Công Thức
                </h3>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-foreground/80">
                <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-2">
                  <div className="font-bold text-destructive flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>Quy trình tạo câu máy móc:</span>
                  </div>
                  <div className="font-mono text-xs text-foreground/75 pl-6 space-y-1">
                    <div>1. Nghĩ ý tưởng bằng tiếng Việt</div>
                    <div>↓ (Tra từ điển tìm từ tương đương)</div>
                    <div>2. Tìm từ vựng phức tạp ép vào cấu trúc mẫu</div>
                    <div>↓ (Ghép nối gượng gạo)</div>
                    <div>3. Câu văn dịch Word-by-Word, sai ngữ cảnh</div>
                  </div>
                </div>
                <p className="text-foreground/75 leading-relaxed text-sm">
                  Hậu quả: Người học mất nhiều thời gian suy nghĩ, phát âm ngập ngừng và câu văn bị rời rạc, chắp vá.
                </p>
              </div>
            </div>

            {/* The ARIS Way */}
            <div className="p-8 sm:p-10 rounded-3xl border-2 border-brand-blue/30 bg-card space-y-6 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xs px-3 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue uppercase tracking-wider">
                  The ARIS Way
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  Tri Nhận Bản Chất Ngôn Ngữ
                </h3>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-foreground/80">
                <div className="p-4 rounded-2xl bg-brand-blue-soft/40 border border-brand-blue/30 space-y-2">
                  <div className="font-bold text-brand-blue flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Quy trình tri nhận tự nhiên:</span>
                  </div>
                  <div className="font-mono text-xs text-foreground/75 pl-6 space-y-1">
                    <div>1. Kích hoạt Ý niệm &amp; Trường nghĩa (Concept)</div>
                    <div>↓ (Lựa chọn góc nhìn biểu đạt)</div>
                    <div>2. Chọn tiêu điểm &amp; Mối quan hệ giữa các thực thể</div>
                    <div>↓ (Hình thành câu chuẩn xác)</div>
                    <div>3. Câu văn mạch lạc, chính xác đúng tư duy học thuật</div>
                  </div>
                </div>
                <p className="text-foreground/75 leading-relaxed text-sm">
                  Kết quả: Bạn phản xạ trực tiếp bằng tiếng Anh, kiểm soát sắc thái câu chữ và diễn đạt tự nhiên theo ngữ cảnh.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Nấc Thang Tri Nhận */}
          <div className="pt-12 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                4 Nấc Thang Tri Nhận Ngôn Ngữ
              </h3>
              <p className="text-sm sm:text-base text-foreground/75">
                Chuyển hóa nguyên lý ngôn ngữ học thành 4 bước rèn luyện rõ ràng:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Step 1 */}
              <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                    01
                  </span>
                  <h4 className="text-lg font-black text-foreground">
                    Hiểu ý nghĩa
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Hiểu rõ nét nghĩa bản chất của từ thay vì chỉ gắn nhãn tiếng Việt. Từ đó mô tả điều gì? Sắc thái thay đổi ra sao theo ngữ cảnh?
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                    02
                  </span>
                  <h4 className="text-lg font-black text-foreground">
                    Chọn góc nhìn
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Cùng một sự việc có nhiều cách diễn đạt. Ai là chủ thể? Trọng tâm cần nhấn mạnh là gì? Quan hệ nhân quả giữa các ý là gì?
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                    03
                  </span>
                  <h4 className="text-lg font-black text-foreground">
                    Biến ý thành câu
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Dẫn dắt suy nghĩ theo chuỗi: <strong>Ý niệm → Mối quan hệ → Cấu trúc → Câu chữ</strong>, triệt tiêu thói quen dịch thô từng từ.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                    04
                  </span>
                  <h4 className="text-lg font-black text-foreground">
                    Sửa từ gốc
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Khi câu sai, giáo viên giúp bạn nhận diện vì sao bạn lại chọn cấu trúc đó để bóc tách tận gốc lỗi tư duy thay vì chỉ sửa chữ bề mặt.
                </p>
              </div>
            </div>
          </div>

          {/* HERO VISUAL CASE STUDY */}
          <div className="pt-12 space-y-6 text-left">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Case Study Minh Họa Thực Tế</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                Một câu tiếng Anh được hình thành như thế nào?
              </h3>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {/* Initial Sentence */}
              <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
                <div className="text-xs font-mono font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <span>Câu diễn đạt ban đầu của người học:</span>
                </div>
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 font-mono text-sm sm:text-base text-foreground font-bold break-words">
                  "The government gave people a lot of money to help them."
                </div>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  <strong>Cách luyện thi thông thường:</strong> Giáo viên chỉ bảo thay từ <em>"gave"</em> hoặc <em>"a lot of money"</em> bằng từ phức tạp hơn, khiến câu trở nên gượng gạo và thiếu tự nhiên.
                </p>
              </div>

              {/* 4 Framing Questions & Result */}
              <div className="p-6 sm:p-10 rounded-3xl bg-card border-2 border-brand-blue/30 space-y-6 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-blue">
                  <Compass className="h-4 w-4" />
                  <span>4 Câu Hỏi Định Hình Tư Duy Theo The ARIS Way:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="font-bold text-foreground text-xs sm:text-sm">1. Ai đang thực hiện hành động?</div>
                    <div className="text-foreground/75 text-xs">
                      → Chính phủ với vai trò quản trị và điều phối chính sách công.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="font-bold text-foreground text-xs sm:text-sm">2. Trọng tâm của câu là gì?</div>
                    <div className="text-foreground/75 text-xs">
                      → Khoản ngân sách công cụ: <code className="text-brand-blue font-bold">substantial funding</code>.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="font-bold text-foreground text-xs sm:text-sm">3. Hành động cốt lõi là gì?</div>
                    <div className="text-foreground/75 text-xs">
                      → Phân bổ / Cấp phát ngân sách: <code className="text-brand-blue font-bold">allocated</code>.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="font-bold text-foreground text-xs sm:text-sm">4. Mục đích hướng đến là gì?</div>
                    <div className="text-foreground/75 text-xs">
                      → Hỗ trợ các đối tượng thụ hưởng: <code className="text-brand-blue font-bold">to support vulnerable communities</code>.
                    </div>
                  </div>
                </div>

                {/* Final Sentence Box */}
                <div className="pt-4 border-t border-border/60 space-y-2">
                  <div className="text-xs font-mono font-bold text-success uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Câu hoàn chỉnh chuẩn xác &amp; tự nhiên:</span>
                  </div>
                  <div className="p-4 sm:p-5 rounded-2xl bg-brand-blue text-white font-mono text-sm sm:text-base font-bold shadow-md break-words">
                    "The government allocated substantial funding to support vulnerable communities."
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed pt-1">
                    Người học tạo ra câu văn học thuật không phải do học vẹt từ điển, mà vì đã <strong>thấu hiểu cơ chế cấu trúc góc nhìn và chọn đúng ý niệm ngôn ngữ</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* ========================================================================= */}
      {/* 03. SECTION 03: COMPETENCY FRAMEWORK — WHAT (CHUẨN NĂNG LỰC)              */}
      {/* ========================================================================= */}
      <section id="competency-framework" className="scroll-mt-20">
        <SectionContainer
          badge="Chuẩn Năng Lực Cốt Lõi"
          title="ARIS quan tâm bạn đang thực sự kiểm soát những năng lực nào"
          description="Thay vì chỉ nhìn vào điểm số bề mặt, ARIS đo lường sự tiến bộ dựa trên 4 trụ cột năng lực biểu đạt và lập luận cốt lõi."
          background="default"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left max-w-5xl mx-auto">
            {/* C1: Meaning Precision */}
            <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs hover:border-brand-blue/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                  C1 • WHAT meaning?
                </span>
                <Brain className="h-5 w-5 text-brand-blue" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Meaning Precision
              </h3>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Khả năng lựa chọn từ và cụm từ truyền tải chính xác nét nghĩa và trường nghĩa dự định, triệt tiêu thói quen dịch từng từ một từ tiếng Việt sang tiếng Anh.
              </p>
              <div className="pt-2 text-xs font-bold text-brand-blue flex items-center gap-1.5 border-t border-border/60">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Dùng đúng từ theo ngữ cảnh, không chắp vá từ phức tạp sai lệch nghĩa</span>
              </div>
            </div>

            {/* C2: Structural Control */}
            <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs hover:border-brand-blue/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                  C2 • HOW structured?
                </span>
                <Layers className="h-5 w-5 text-brand-blue" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Structural Control
              </h3>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Khả năng lựa chọn và làm chủ cấu trúc câu (đơn, ghép, phức, bị động) để phản ánh chính xác quan hệ ý nghĩa (nguyên nhân, nhượng bộ, điều kiện, mục đích) mà không dựa vào mẫu câu học thuộc.
              </p>
              <div className="pt-2 text-xs font-bold text-brand-blue flex items-center gap-1.5 border-t border-border/60">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Cấu trúc phục vụ mục đích biểu đạt, không nhồi nhét ngữ pháp máy móc</span>
              </div>
            </div>

            {/* C3: Logical Progression */}
            <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs hover:border-brand-blue/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                  C3 • HOW developed?
                </span>
                <Compass className="h-5 w-5 text-brand-blue" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Logical Progression
              </h3>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Khả năng triển khai ý tưởng theo chuỗi suy luận chặt chẽ: giải thích rõ cơ chế và nguyên nhân trước khi đưa ra minh chứng, tạo tính mạch lạc và thuyết phục tự thân cho đoạn văn.
              </p>
              <div className="pt-2 text-xs font-bold text-brand-blue flex items-center gap-1.5 border-t border-border/60">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Lập luận có căn cứ, không nhảy cóc ý hay lạm dụng từ nối bề mặt</span>
              </div>
            </div>

            {/* C4: Contextual Appropriateness */}
            <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs hover:border-brand-blue/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs px-3 py-1 rounded-xl bg-brand-blue-soft text-brand-blue">
                  C4 • APPROPRIATE for whom/why?
                </span>
                <ShieldCheck className="h-5 w-5 text-brand-blue" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Contextual Appropriateness
              </h3>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Khả năng điều chỉnh phong cách ngôn ngữ, độ trang trọng và sắc thái học thuật phù hợp với định dạng bài thi (Academic Register cho Writing; giao tiếp tự nhiên cho Speaking).
              </p>
              <div className="pt-2 text-xs font-bold text-brand-blue flex items-center gap-1.5 border-t border-border/60">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Giữ vững phong thái học thuật khách quan, điềm đạm và chính xác</span>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* ========================================================================= */}
      {/* 04. SECTION 04: ARIS-7 FRAMEWORK — WHERE (BẢN ĐỒ NĂNG LỰC)                */}
      {/* ========================================================================= */}
      <section id="aris-7" className="scroll-mt-20">
        <SectionContainer
          badge="Khung Chuẩn Năng Lực ARIS-7"
          title="ARIS-7 không phải danh hiệu. Đó là bản đồ năng lực theo từng nấc phát triển."
          description="Mỗi cấp bậc định vị rõ hồ sơ năng lực hiện tại, điểm nghẽn cần phá vỡ và chuẩn đầu ra cụ thể để bạn vững bước lên nấc tiếp theo."
          background="muted"
        >
          {/* Interactive Rank Component */}
          <AcademicRankSystem initialRank={5} />

          {/* 4 Progression Stages */}
          <div className="pt-14 space-y-6 text-left">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                4 Giai Đoạn Phát Triển Trong Từng Cấp Bậc
              </h3>
              <p className="text-sm sm:text-base text-foreground/75">
                Mỗi rank được chia thành 4 giai đoạn tiến trình để đảm bảo học viên tích lũy năng lực vững chắc mà không bị học nhảy cóc:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
              <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
                  <span>Giai đoạn 1</span>
                  <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                </div>
                <h4 className="font-black text-foreground text-xl">Sơ Kỳ (Phase I)</h4>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Tiếp cận kiến thức cốt lõi, nhận diện cấu trúc dạng đề và làm quen với các tiêu chí chuẩn năng lực của rank.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
                  <span>Giai đoạn 2</span>
                  <div className="inline-flex items-center -space-x-0.5">
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                  </div>
                </div>
                <h4 className="font-black text-foreground text-xl">Trung Kỳ (Phase II)</h4>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Luyện tập chuyên sâu có chủ đích, bóc tách và sửa các lỗi sai ngữ nghĩa, cấu trúc và logic lập luận hay gặp.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
                  <span>Giai đoạn 3</span>
                  <div className="inline-flex items-center -space-x-0.5">
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                  </div>
                </div>
                <h4 className="font-black text-foreground text-xl">Hậu Kỳ (Phase III)</h4>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Nâng cao độ chính xác và tính mạch lạc, rèn luyện kỹ năng xử lý các bài thi trong điều kiện thời gian thực tế.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-red-soft text-brand-red w-fit">
                  <span>Giai đoạn 4</span>
                  <div className="inline-flex items-center -space-x-0.5">
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                    <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
                  </div>
                </div>
                <h4 className="font-black text-foreground text-xl">Đỉnh Phong (Apex)</h4>
                <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                  Đạt chuẩn đầu ra vững chắc của rank, sẵn sàng thực hiện bài khảo thí để xác nhận bước lên nấc năng lực tiếp theo.
                </p>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* ========================================================================= */}
      {/* 05. SECTION 05: HOW YOU MOVE & PROOF (QUY TRÌNH RÈN LUYỆN & MINH CHỨNG)   */}
      {/* ========================================================================= */}
      <section id="how-you-move" className="scroll-mt-20">
        <SectionContainer
          badge="Quy Trình Rèn Luyện &amp; Minh Chứng"
          title="Phương pháp chỉ tạo ra kết quả khi đi kèm phản hồi có chủ đích"
          description="Mọi bài viết và bài nói của học viên đều được bóc tách chi tiết trên nền tảng NextBand LMS để chỉ rõ nguyên nhân vì sao câu chưa đạt và hướng dẫn tự sửa lại."
          background="default"
        >
          {/* 3 Steps: Practice -> Teacher Feedback -> NextBand Record */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left max-w-5xl mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
              <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
                <PenTool className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 01</div>
              <h4 className="font-black text-foreground text-xl">Luyện Tập Có Mục Tiêu</h4>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Học viên thực hiện bài tập Writing hoặc Speaking trực tiếp trên nền tảng NextBand LMS theo từng chủ điểm học thuật.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
              <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
                <Brain className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 02</div>
              <h4 className="font-black text-foreground text-xl">Phản Hồi &amp; Truy Vấn 1:1</h4>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Giáo viên bóc tách từng câu văn, đặt câu hỏi truy vấn để học viên tự nhận ra điểm nghẽn tư duy thay vì chỉ sửa lỗi ngữ pháp bề mặt.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
              <div className="p-3 rounded-2xl bg-success/15 text-success w-fit">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 03</div>
              <h4 className="font-black text-foreground text-xl">Lưu Vết Hồ Sơ Học Tập</h4>
              <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                Toàn bộ lịch sử bài nộp, nhận xét của giáo viên và kết quả đánh giá được lưu trữ minh bạch trên NextBand để theo dõi tiến độ.
              </p>
            </div>
          </div>

          {/* Socratic Feedback Dialogue Case Study */}
          <div className="pt-12 max-w-4xl mx-auto space-y-6 text-left">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Minh Họa Phản Hồi Socratic Thực Tế</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                Giáo viên không chỉ sửa câu — Giáo viên hỏi để bạn tự thấy vì sao câu sai
              </h3>
            </div>

            <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-6">
              <div className="space-y-4">
                {/* Dialogue Step 1 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-8 w-8 rounded-full bg-destructive/15 text-destructive font-black text-xs flex items-center justify-center shrink-0 mt-1">
                    HV
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-foreground/90 space-y-1">
                    <div className="font-bold text-xs text-muted-foreground">Học viên viết:</div>
                    <div className="font-mono font-semibold">"Due to the weather is bad, we canceled the trip."</div>
                  </div>
                </div>

                {/* Dialogue Step 2 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-8 w-8 rounded-full bg-brand-blue-soft text-brand-blue font-black text-xs flex items-center justify-center shrink-0 mt-1">
                    GV
                  </div>
                  <div className="p-4 rounded-2xl bg-brand-blue-soft/40 border border-brand-blue/20 text-xs sm:text-sm text-foreground space-y-2">
                    <div className="font-bold text-xs text-brand-blue">Giảng viên ARIS truy vấn:</div>
                    <p className="leading-relaxed">
                      "Sau cụm từ <strong>'Due to'</strong>, em đang dùng một Mệnh đề (Clause) hay một Cụm danh từ (Noun Phrase)? Vì sao trong trường hợp này ta không dùng một mệnh đề có động từ đứng độc lập?"
                    </p>
                  </div>
                </div>

                {/* Dialogue Step 3 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-8 w-8 rounded-full bg-destructive/15 text-destructive font-black text-xs flex items-center justify-center shrink-0 mt-1">
                    HV
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm text-foreground/90 space-y-1">
                    <div className="font-bold text-xs text-muted-foreground">Học viên nhận ra:</div>
                    <div>"Dạ, 'Due to' là giới từ nên phía sau phải là một cụm danh từ. Em đã bị quen miệng dịch từ 'bởi vì' trong tiếng Việt sang!"</div>
                  </div>
                </div>

                {/* Dialogue Step 4 */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-8 w-8 rounded-full bg-success/15 text-success font-black text-xs flex items-center justify-center shrink-0 mt-1">
                    GV
                  </div>
                  <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-xs sm:text-sm text-foreground space-y-1">
                    <div className="font-bold text-xs text-success">Kết quả viết lại hoàn chỉnh:</div>
                    <div className="font-bold font-mono text-foreground break-words">
                      → "Due to adverse weather conditions, the trip was canceled."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionContainer>
      </section>

      {/* ========================================================================= */}
      {/* 06. SECTION 06: ACTION CTA (ENTRY POINT)                                  */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-brand-blue text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs font-extrabold uppercase tracking-wider">
            <Target className="h-4 w-4 text-brand-cyan" />
            <span>Khảo Thí Năng Lực Đầu Vào</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Tìm hiểu vị trí khởi điểm phù hợp của bạn.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 font-normal leading-relaxed max-w-2xl mx-auto">
            Thực hiện bài đánh giá năng lực đầu vào chuẩn hóa để nhận báo cáo phân tích chi tiết về điểm mạnh, điểm nghẽn và cấp bậc năng lực học thuật tương ứng.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-md gap-2"
            >
              <span>Đăng ký đánh giá đầu vào</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/courses")}
              className="rounded-2xl px-8 h-14 font-bold text-base border-2 border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white"
            >
              Khám phá các khóa học
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
