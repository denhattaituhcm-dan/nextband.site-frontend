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
} from "lucide-react";

export default function MethodPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Phương Pháp Đào Tạo The ARIS Way — Tư Duy Học Thuật"
        description="The ARIS Way — Phương pháp đào tạo IELTS tập trung vào bản chất ngôn ngữ, logic lập luận và vòng lặp phản hồi sửa lỗi triệt để."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Phương Pháp The ARIS Way</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Học cách tư duy bằng tiếng Anh,{" "}
            <span className="text-brand-red block sm:inline">
              không học mẹo làm bài.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Điểm số IELTS cao chỉ là kết quả tự nhiên khi bạn có khả năng tổ chức suy nghĩ logic và diễn đạt câu văn chuẩn xác.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/academic-system")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-blue hover:bg-brand-blue-hover text-white shadow-sm gap-2"
            >
              <span>Xem Bản đồ 7 Cấp bậc ARIS-7</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Làm bài kiểm tra đầu vào
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1: 4 Trụ Cột The ARIS Way */}
      <SectionContainer
        badge="4 Trụ Cột Phương Pháp"
        title="Quy trình rèn luyện tư duy ngôn ngữ"
        description="Mỗi bài học được thiết kế để dẫn dắt bạn đi từ việc hiểu đúng bản chất câu hỏi đến việc tạo ra bài viết hoặc bài nói hoàn chỉnh."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                01
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Hiểu đúng bản chất đề
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Không đoán mò từ khóa. Bạn được hướng dẫn cách bóc tách chính xác yêu cầu của đề bài và tiêu chí chấm điểm của giám khảo Cambridge để trả lời trúng trọng tâm.
            </p>
            <div className="pt-2 text-sm text-foreground/80 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Nhận diện bẫy thông tin và cấu trúc câu hỏi</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                02
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Lập luận có cấu trúc
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Tập trung xây dựng chuỗi lập luận mạch lạc: Luận điểm chính $\rightarrow$ Lý giải nguyên nhân $\rightarrow$ Dẫn chứng thực tế. Triệt tiêu hoàn toàn thói quen viết câu rời rạc.
            </p>
            <div className="pt-2 text-sm text-foreground/80 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Kiểm soát tính mạch lạc và liên kết (Cohesion)</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                03
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Rèn luyện có chủ đích
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Không giải đề tràn lan để tạo cảm giác tiến bộ ảo. Bạn tập trung giải quyết dứt điểm các điểm nghẽn ngữ pháp câu phức và mở rộng vốn từ theo ngữ cảnh cụ thể.
            </p>
            <div className="pt-2 text-sm text-foreground/80 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Chữa đúng điểm yếu cá nhân thay vì học đại trà</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-base px-3.5 py-1.5 rounded-xl bg-brand-blue-soft text-brand-blue">
                04
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Vòng lặp phản hồi khép kín
              </h3>
            </div>
            <p className="text-base text-foreground/75 leading-relaxed">
              Mỗi bài nộp đều nhận nhận xét chi tiết từng câu từ giáo viên. Học viên bắt buộc phải tự tay viết lại bài sửa (Re-attempt) để hoàn thiện trước khi sang bài tiếp theo.
            </p>
            <div className="pt-2 text-sm text-foreground/80 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Lưu vết tiến trình bài nộp trên hệ thống NextBand</span>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Section 2: So Sánh Trực Quan Cách Học */}
      <SectionContainer
        badge="So Sánh Phương Pháp"
        title="Sự khác biệt trong cơ chế hình thành câu"
        description="Vì sao cách học cũ khiến bạn lúng túng khi viết luận và phương pháp ARIS giải quyết tận gốc vấn đề này như thế nào."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Traditional Way */}
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-5 shadow-2xs opacity-90">
            <div className="flex items-center gap-2 text-destructive font-black text-lg">
              <XCircle className="h-5 w-5" />
              <span>Cách Học Dịch Thô Truyền Thống</span>
            </div>
            <div className="p-5 rounded-2xl bg-muted/40 space-y-3 font-mono text-sm">
              <div className="p-3 rounded-xl bg-background border border-border/60">
                1. Nghĩ ý niệm bằng tiếng Việt
              </div>
              <div className="text-center text-muted-foreground">↓ (Dịch thô từng từ)</div>
              <div className="p-3 rounded-xl bg-background border border-border/60">
                2. Cố nhồi từ vựng khó / Mẫu câu học thuộc
              </div>
              <div className="text-center text-muted-foreground">↓ (Gượng ép)</div>
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-bold">
                3. Câu văn thiếu tự nhiên, sai ngữ pháp
              </div>
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Hậu quả: Học viên mất nhiều thời gian suy nghĩ, dễ sai ngữ cảnh và bế tắc khi gặp các chủ đề lạ ngoài bộ đề đã học tủ.
            </p>
          </div>

          {/* The ARIS Way */}
          <div className="p-8 rounded-3xl border-2 border-brand-blue/30 bg-card space-y-5 shadow-sm">
            <div className="flex items-center gap-2 text-brand-blue font-black text-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span>Phương Pháp The ARIS Way</span>
            </div>
            <div className="p-5 rounded-2xl bg-brand-blue-soft/50 space-y-3 font-mono text-sm">
              <div className="p-3 rounded-xl bg-background border border-border/60 font-bold text-foreground">
                1. Xác định ý niệm &amp; Quan hệ logic
              </div>
              <div className="text-center text-brand-blue font-bold">↓ (Tổ chức tư duy)</div>
              <div className="p-3 rounded-xl bg-background border border-border/60 font-bold text-foreground">
                2. Lựa chọn cấu trúc ngữ pháp học thuật
              </div>
              <div className="text-center text-brand-blue font-bold">↓ (Biểu đạt tự nhiên)</div>
              <div className="p-3 rounded-xl bg-primary text-white border-0 font-bold">
                3. Câu văn mạch lạc, chính xác và tự nhiên
              </div>
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Kết quả: Bạn phản xạ câu văn trực tiếp bằng tiếng Anh, kiểm soát hoàn toàn tính mạch lạc và tự tin xử lý mọi dạng đề Cambridge.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Section 3: Socratic Questioning Dialogue Example */}
      <SectionContainer
        badge="Ví Dụ Thực Tế"
        title="Cách giáo viên ARIS hướng dẫn sửa bài"
        description="Thay vì chỉ sửa đáp án một cách thụ động, giáo viên đặt câu hỏi truy vấn để bạn tự nhận diện lỗ hổng và hiểu sâu cơ chế của câu văn."
        background="muted"
      >
        <div className="max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl bg-card border border-border/80 space-y-6 text-left shadow-2xs">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue font-mono font-bold text-xs">
              HỘI THOẠI CHUYÊN MÔN
            </div>
            <span className="text-sm font-bold text-foreground">Phân tích một trường hợp dùng từ</span>
          </div>

          <div className="space-y-4 text-sm sm:text-base">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
              <span className="font-bold text-foreground/70 text-xs uppercase tracking-wider">Học viên</span>
              <p className="text-foreground italic">"Em dùng từ này trong bài viết vì nghe nó tự nhiên hơn ạ."</p>
            </div>

            <div className="p-4 rounded-2xl bg-brand-blue-soft/60 border border-brand-blue/30 space-y-1">
              <span className="font-bold text-brand-blue text-xs uppercase tracking-wider">Giảng viên ARIS (Truy vấn Socratic)</span>
              <p className="text-foreground font-medium">
                "Tự nhiên hơn ở điểm nào? Từ này thay đổi sắc thái gì của câu? Nếu bỏ từ này đi thì ý nghĩa của câu còn chính xác với ngữ cảnh học thuật không?"
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-success/10 border border-success/30 space-y-1">
              <span className="font-bold text-success text-xs uppercase tracking-wider">Kết quả chuyển hóa</span>
              <p className="text-foreground font-medium">
                → Học viên tự phát hiện vấn đề ngữ nghĩa, hiểu rõ bản chất cấu trúc và hình thành thói quen kiểm soát từ ngữ chặt chẽ.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Final CTA */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Target className="h-4 w-4 text-brand-cyan" />
            <span>Khám Phá Tiến Trình</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Xem cách ARIS chuẩn hóa lộ trình thành 7 cấp bậc rõ ràng.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Mỗi cấp bậc đều có tiêu chuẩn năng lực và 4 giai đoạn tiến trình cụ thể để bạn biết chính xác mình cần hoàn thiện điều gì.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/academic-system")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red text-white hover:bg-brand-red-hover shadow-md border-0 gap-2.5"
            >
              <span>Xem Hệ thống 7 Cấp bậc ARIS-7</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
