import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileText,
  RefreshCw,
  TrendingUp,
  Target,
  FileCheck,
  Brain,
} from "lucide-react";

export default function ResultsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Minh Chứng Tiến Bộ Thực Nghiệm — Học Viện ARIS"
        description="Minh chứng tiến bộ học tập qua dữ liệu bài nộp, nhật ký sửa bài và sự phát triển năng lực tư duy ngôn ngữ thực chất tại ARIS."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Minh Chứng Thực Nghiệm</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Tiến bộ phải{" "}
            <span className="text-brand-blue block sm:inline">
              nhìn thấy được.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Chúng tôi không đo lường kết quả bằng những lời hứa mơ hồ. Sự tiến bộ được chứng minh qua từng câu văn được sửa chữa, sự hoàn thiện trong lập luận và lịch sử bài nộp lưu trữ trên hệ thống.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Đánh giá năng lực ngay</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/method")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Xem phương pháp The ARIS Way
            </Button>
          </div>
        </div>
      </section>

      {/* Progress Visualization: Before -> Training -> After */}
      <SectionContainer
        badge="Hành Trình Thực Nghiệm"
        title="Quá trình chuyển hóa năng lực thực tế"
        description="Sự thay đổi không diễn ra sau một đêm, mà là kết quả của việc kiên trì sửa chữa từng điểm nghẽn qua 3 giai đoạn."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {/* Phase 1: Before */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-muted text-foreground/80">
                Giai đoạn 1
              </span>
              <h3 className="text-2xl font-black text-foreground pt-2">
                Điểm Nghẽn Ban Đầu
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Học viên thường có thói quen dịch từng từ từ tiếng Việt, dùng từ vựng gượng ép hoặc học vẹt bài mẫu khiến câu văn thiếu tự nhiên và lúng túng khi gặp đề lạ.
            </p>
            <div className="pt-3 border-t border-border/60 text-xs sm:text-sm text-foreground/80 font-bold space-y-1.5">
              <div className="text-muted-foreground">• Dịch thô từng từ</div>
              <div className="text-muted-foreground">• Thiếu liên kết giữa các câu</div>
              <div className="text-muted-foreground">• Phụ thuộc vào văn mẫu</div>
            </div>
          </div>

          {/* Phase 2: Training */}
          <div className="p-8 rounded-3xl bg-card border-2 border-brand-blue/40 space-y-4 shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Giai đoạn 2
              </span>
              <h3 className="text-2xl font-black text-foreground pt-2">
                Rèn Luyện Kỷ Luật
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Học viên được hướng dẫn tổ chức ý tưởng theo The ARIS Way, nộp bài định kỳ và nhận phản hồi chi tiết từng câu từ giáo viên trên hệ thống NextBand.
            </p>
            <div className="pt-3 border-t border-border/60 text-xs sm:text-sm text-brand-blue font-bold space-y-1.5">
              <div>✓ Giáo viên sửa chi tiết từng câu</div>
              <div>✓ Bắt buộc làm bài sửa (Re-attempt)</div>
              <div>✓ Đo lường lỗi sai theo tuần</div>
            </div>
          </div>

          {/* Phase 3: After */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-red-soft text-brand-red">
                Giai đoạn 3
              </span>
              <h3 className="text-2xl font-black text-foreground pt-2">
                Năng Lực Chuẩn Hóa
              </h3>
            </div>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Khả năng phản xạ câu văn trực tiếp bằng tiếng Anh, cấu trúc đoạn văn mạch lạc và tự tin xử lý mọi dạng câu hỏi trong bài thi Cambridge thực tế.
            </p>
            <div className="pt-3 border-t border-border/60 text-xs sm:text-sm text-success font-bold space-y-1.5">
              <div>✓ Luận điểm sắc bén, có dẫn chứng</div>
              <div>✓ Văn phong tự nhiên, đúng ngữ cảnh</div>
              <div>✓ Tự tin thi thử trong phòng thi NextBand</div>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Proof from NextBand */}
      <SectionContainer
        badge="Minh Bạch Dữ Liệu"
        title="3 Minh chứng lưu vết trên hệ thống NextBand"
        description="Mọi bước trong hành trình rèn luyện của học viên đều được ghi nhận nguyên bản và đo lường minh bạch."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              Nhật ký bài nộp gốc
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Toàn bộ bài viết Task 1, Task 2 và ghi âm Speaking được lưu trữ đầy đủ theo từng mốc thời gian để học viên so sánh sự tiến bộ.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              Bản giải phẫu lỗi sai
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Giáo viên bóc tách cơ chế lỗi sai về ngữ pháp câu phức, dùng từ chưa chính xác và hướng dẫn cách viết lại câu chuẩn xác hơn.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              Hồ sơ bài sửa (Re-attempt)
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Học viên tự tay viết lại bài sửa sau khi tiếp thu nhận xét, giúp triệt tiêu hoàn toàn thói quen lặp lại lỗi sai cũ trong bài tập tiếp theo.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Final Action CTA */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Target className="h-4 w-4 text-brand-cyan" />
            <span>Đo Lường Năng Lực</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Bắt đầu hành trình tiến bộ từ bản chất ngay hôm nay.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Thực hiện bài kiểm tra khảo thí chuẩn hóa miễn phí để nhận báo cáo phân tích chi tiết từ ARIS.
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
          </div>
        </div>
      </section>
    </div>
  );
}
