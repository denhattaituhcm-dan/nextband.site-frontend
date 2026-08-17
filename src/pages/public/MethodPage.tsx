import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  Brain,
  Layers,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileCheck,
  Target,
  PenTool,
  MessageSquare,
  HelpCircle,
  Compass,
  Zap,
  BookOpen,
  ShieldCheck,
  Workflow,
} from "lucide-react";

export default function MethodPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Phương Pháp Đào Tạo The ARIS Way — Tư Duy Học Thuật & Tri Nhận Ngôn Ngữ"
        description="The ARIS Way — Đừng chỉ học cách nói. Hãy hiểu cách tiếng Anh tạo ra ý nghĩa từ gốc rễ ý niệm, góc nhìn và cấu trúc lập luận."
      />

      {/* ========================================================================= */}
      {/* 01. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-black uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Phương Pháp Đào Tạo The ARIS Way</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.08]">
            Đừng chỉ học cách nói.{" "}
            <span className="text-brand-blue block sm:inline">
              Hãy hiểu cách tiếng Anh tạo ra ý nghĩa.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-medium leading-relaxed max-w-3xl mx-auto">
            Từ ý niệm → góc nhìn → cấu trúc → câu chữ. Khi năng lực ngôn ngữ thực sự thay đổi, điểm số mới có lý do để thay đổi.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("four-pillars");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-white shadow-md gap-2"
            >
              <span>Khám phá 4 Nấc Thang Tri Nhận</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/academic-system")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Xem Bản đồ 7 Cấp bậc ARIS-7
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. WHY: GỐC RỄ VẤN ĐỀ TRUYỀN THỐNG                                      */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Nút Thắt Ngôn Ngữ"
        title="Vì sao biết rất nhiều từ vựng nhưng vẫn không thể diễn đạt tự nhiên?"
        description="Phần lớn người học gặp bế tắc trong Writing và Speaking không phải vì thiếu từ, mà vì đang mắc kẹt trong cơ chế dịch thô từng chữ từ tiếng Việt."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Lối học truyền thống */}
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
                  <span>Quy trình hình thành câu máy móc:</span>
                </div>
                <div className="font-mono text-xs text-foreground/75 pl-6 space-y-1">
                  <div>1. Nghĩ ý tưởng bằng tiếng Việt</div>
                  <div>↓ (Tra từ điển tìm từ tương đương)</div>
                  <div>2. Tìm từ vựng "đao to búa lớn" ép vào ngữ pháp</div>
                  <div>↓ (Ghép nối gượng gạo)</div>
                  <div>3. Câu văn dịch Word-by-Word, sai ngữ cảnh</div>
                </div>
              </div>
              <p className="text-foreground/75 leading-relaxed">
                Hậu quả: Người học mất nhiều thời gian suy nghĩ, phát âm ngập ngừng và bài viết bị giám khảo đánh giá là "thiếu tự nhiên", câu từ chắp vá.
              </p>
            </div>
          </div>

          {/* Phương pháp ARIS */}
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
                  <div>3. Câu văn mạch lạc, chính xác đúng tư duy bản xứ</div>
                </div>
              </div>
              <p className="text-foreground/75 leading-relaxed">
                Kết quả: Bạn phản xạ trực tiếp bằng tiếng Anh, kiểm soát hoàn toàn sắc thái câu chữ và xử lý mọi chủ đề Cambridge một cách vững vàng.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 03. THE ARIS WAY: 4 NẤC THANG TRI NHẬN NGÔN NGỮ                           */}
      {/* ========================================================================= */}
      <SectionContainer
        id="four-pillars"
        badge="4 Nấc Thang Tri Nhận"
        title="Phương pháp The ARIS Way hoạt động như thế nào?"
        description="Không sử dụng các thuật ngữ học thuật phức tạp, ARIS chuyển hóa ngôn ngữ học tri nhận thành 4 bước rèn luyện rõ ràng và dễ tiếp cận."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Step 1 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                01
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Hiểu ý nghĩa
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Không học từ vựng như những nhãn dán tiếng Việt đơn thuần. Một từ thực sự nghĩa là gì? Nó mô tả điều gì? Khi ngữ cảnh thay đổi thì sắc thái thay đổi ra sao?
            </p>
            <div className="pt-2 text-sm text-brand-blue font-bold flex items-center gap-2 border-t border-border/60">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Hiểu trọn vẹn bản chất gốc rễ trước khi học cách dùng</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                02
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Chọn góc nhìn
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Cùng một sự việc có thể được diễn đạt theo nhiều cách. Ai là trọng tâm? Điều gì đang được nhấn mạnh? Mối quan hệ nhân quả giữa các ý là gì?
            </p>
            <div className="pt-2 text-sm text-brand-blue font-bold flex items-center gap-2 border-t border-border/60">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Ngữ pháp là công cụ điều hướng góc nhìn, không chỉ là công thức</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                03
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Biến ý thành câu
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Dẫn dắt suy nghĩ từ ý niệm: <strong>Ý tưởng → Mối quan hệ → Cấu trúc → Câu chữ</strong>. Đây là bước then chốt giúp bạn triệt tiêu hoàn toàn thói quen dịch thô từng từ.
            </p>
            <div className="pt-2 text-sm text-brand-blue font-bold flex items-center gap-2 border-t border-border/60">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Xây dựng chuỗi lập luận tuyến tính và mạch lạc tự nhiên</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                04
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Sửa từ gốc
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Khi câu sai, giáo viên không chỉ sửa câu chữ bề mặt mà đặt câu hỏi truy vấn: <em>"Vì sao bạn lại tạo ra câu theo cách đó?"</em> để giải phẫu tận gốc lỗi tư duy.
            </p>
            <div className="pt-2 text-sm text-brand-blue font-bold flex items-center gap-2 border-t border-border/60">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Kết hợp Socratic Questioning và vòng lặp sửa bài khép kín</span>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 04. ONE REAL EXAMPLE: MỘT CÂU ĐƯỢC HÌNH THÀNH NHƯ THẾ NÀO?                */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Minh Họa Thực Tế"
        title="Một câu tiếng Anh được hình thành như thế nào?"
        description="Xem cách phương pháp The ARIS Way dẫn dắt người học từ một câu diễn đạt vụng về đến một cấu trúc học thuật chính xác và tự nhiên."
        background="muted"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          {/* Initial Problem */}
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="text-xs font-mono font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Câu diễn đạt ban đầu của người học:</span>
            </div>
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 font-mono text-base sm:text-lg text-foreground font-bold">
              "The government gave people a lot of money to help them."
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">
              <strong>Cách luyện thi thông thường:</strong> Giáo viên chỉ bảo <em>"Hãy thay từ 'gave' và 'a lot of money' bằng từ cao cấp hơn"</em>, khiến người học nhét từ vựng gượng gạo mà không hiểu bản chất.
            </p>
          </div>

          {/* 4 Framing Questions */}
          <div className="p-8 sm:p-10 rounded-3xl bg-card border-2 border-brand-blue/30 space-y-6 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-blue">
              <Compass className="h-4 w-4" />
              <span>4 Câu Hỏi Định Hình Tư Duy Theo The ARIS Way:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <div className="font-bold text-foreground">1. Ai đang thực hiện hành động?</div>
                <div className="text-foreground/75 text-xs">
                  → Chính phủ với vai trò quản trị và điều phối chính sách công.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <div className="font-bold text-foreground">2. Trọng tâm của câu là gì?</div>
                <div className="text-foreground/75 text-xs">
                  → Khoản ngân sách công cụ: <code className="text-brand-blue font-bold">substantial funding</code>.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <div className="font-bold text-foreground">3. Hành động cốt lõi là gì?</div>
                <div className="text-foreground/75 text-xs">
                  → Phân bổ / Cấp phát ngân sách: <code className="text-brand-blue font-bold">allocated</code>.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <div className="font-bold text-foreground">4. Mục đích hướng đến là gì?</div>
                <div className="text-foreground/75 text-xs">
                  → Hỗ trợ các đối tượng thụ hưởng: <code className="text-brand-blue font-bold">to support...</code>.
                </div>
              </div>
            </div>

            {/* Final Natural Sentence */}
            <div className="pt-4 border-t border-border/60 space-y-2">
              <div className="text-xs font-mono font-bold text-success uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Câu hoàn chỉnh chuẩn xác &amp; tự nhiên:</span>
              </div>
              <div className="p-5 rounded-2xl bg-brand-blue text-white font-mono text-base sm:text-lg font-bold shadow-md">
                "The government allocated substantial funding to support vulnerable communities."
              </div>
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pt-1">
                Người học đạt được câu văn học thuật không phải do học vẹt từ điển, mà vì đã <strong>thấu hiểu cơ chế cấu trúc góc nhìn và chọn đúng ý niệm ngôn ngữ</strong>.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 05. SOCRATIC FEEDBACK: GIÁO VIÊN TRUY VẤN TẬN GỐC                       */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Phương Pháp Truy Vấn"
        title="Giáo viên không chỉ sửa câu. Giáo viên hỏi để bạn tự thấy vì sao câu sai."
        description="Thay vì thụ động sửa lỗi bề mặt, giáo viên ARIS áp dụng phương pháp Socratic để giúp bạn nhận diện điểm nghẽn nhận thức và tự tay sửa lại bài nộp."
        background="default"
      >
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-card border border-border/80 shadow-2xs space-y-6 text-left">
          <div className="space-y-4">
            {/* Dialogue Step 1 */}
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-destructive/15 text-destructive font-black text-xs flex items-center justify-center shrink-0 mt-1">
                HV
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-sm sm:text-base text-foreground/90 space-y-1">
                <div className="font-bold text-xs text-muted-foreground">Học viên viết:</div>
                <div>"Due to the weather is bad, we canceled the trip."</div>
              </div>
            </div>

            {/* Dialogue Step 2 */}
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-brand-blue-soft text-brand-blue font-black text-xs flex items-center justify-center shrink-0 mt-1">
                GV
              </div>
              <div className="p-4 rounded-2xl bg-brand-blue-soft/40 border border-brand-blue/20 text-sm sm:text-base text-foreground space-y-2">
                <div className="font-bold text-xs text-brand-blue">Giảng viên ARIS truy vấn:</div>
                <p>
                  "Sau cụm từ <strong>'Due to'</strong>, em đang dùng một Mệnh đề (Clause) hay một Cụm danh từ (Noun Phrase)? Vì sao trong trường hợp này ta không dùng một mệnh đề có động từ đứng độc lập?"
                </p>
              </div>
            </div>

            {/* Dialogue Step 3 */}
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-destructive/15 text-destructive font-black text-xs flex items-center justify-center shrink-0 mt-1">
                HV
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-sm sm:text-base text-foreground/90 space-y-1">
                <div className="font-bold text-xs text-muted-foreground">Học viên nhận ra:</div>
                <div>"Dạ, 'Due to' là giới từ nên phía sau phải là một cụm danh từ. Em đã bị quen miệng dịch từ 'bởi vì' trong tiếng Việt sang!"</div>
              </div>
            </div>

            {/* Dialogue Step 4 */}
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-success/15 text-success font-black text-xs flex items-center justify-center shrink-0 mt-1">
                GV
              </div>
              <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-sm sm:text-base text-foreground space-y-1">
                <div className="font-bold text-xs text-success">Kết quả viết lại hoàn chỉnh:</div>
                <div className="font-bold font-mono text-foreground">
                  → "Due to adverse weather conditions, the trip was canceled."
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 06. NEXTBAND CLOSED-LOOP LEARNING                                         */}
      {/* ========================================================================= */}
      <SectionContainer
        badge="Hạ Tầng Công Nghệ NextBand"
        title="Vòng lặp rèn luyện khép kín: Nộp → Sửa → Làm lại → Lưu vết"
        description="Phương pháp học thuật chỉ thực sự tạo ra tiến bộ khi được hỗ trợ bởi một hệ thống lưu trữ và bắt buộc sửa lỗi triệt để."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <PenTool className="h-5 w-5" />
            </div>
            <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 01</div>
            <h4 className="font-black text-foreground text-lg">Làm Bài Nộp</h4>
            <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
              Học viên nộp bài viết hoặc bản ghi âm trực tiếp lên nền tảng NextBand LMS theo từng bài học.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-5 w-5" />
            </div>
            <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 02</div>
            <h4 className="font-black text-foreground text-lg">Chấm Từng Câu</h4>
            <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
              Giáo viên bóc tách từng câu, chỉ rõ lỗi tư duy và gợi ý hướng tái cấu trúc ngôn ngữ chuẩn xác.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-red-soft text-brand-red w-fit">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 03</div>
            <h4 className="font-black text-foreground text-lg">Làm Lại (Re-attempt)</h4>
            <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
              Học viên bắt buộc phải tự tay viết lại bài sửa dựa trên nhận xét trước khi chuyển sang bài mới.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-3 rounded-2xl bg-success/15 text-success w-fit">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="font-mono text-xs font-bold text-muted-foreground uppercase">Bước 04</div>
            <h4 className="font-black text-foreground text-lg">Lưu Vết Hồ Sơ</h4>
            <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
              Toàn bộ lịch sử bài làm, phiên bản sửa và điểm số được lưu vết minh bạch để đo lường tiến bộ thật.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* ========================================================================= */}
      {/* 07. FINAL CTA                                                             */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 bg-brand-blue text-white text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-brand-cyan" />
            <span>Lộ Trình Tiến Bộ Đo Lường Được</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Sẵn sàng trải nghiệm phương pháp học sâu cùng ARIS?
          </h2>

          <p className="text-lg sm:text-xl text-white/90 font-normal leading-relaxed max-w-2xl mx-auto">
            Khám phá 7 cấp bậc năng lực học thuật hoặc liên hệ trực tiếp Ban Chuyên Môn để nhận tư vấn lộ trình phù hợp với bạn.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/academic-system")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base bg-white text-brand-blue hover:bg-white/90 shadow-md gap-2"
            >
              <span>Xem Bản Đồ 7 Cấp Bậc ARIS-7</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-2xl px-8 h-14 font-bold text-base border-2 border-white/40 text-white hover:bg-white/10"
            >
              Liên hệ tư vấn lộ trình
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
