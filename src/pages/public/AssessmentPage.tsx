import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Brain,
  FileCheck,
  Sparkles,
  Target,
  Award,
} from "lucide-react";

export default function AssessmentPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Đánh Giá Năng Lực Đầu Vào — Học Viện ARIS"
        description="Khảo thí 4 kỹ năng miễn phí, xác định chính xác Rank năng lực theo khung 7 cấp bậc ARIS-7 và nhận đề xuất chặng học phù hợp."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Cổng Khảo Thí Chuẩn Hóa</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Biết chính xác bạn{" "}
            <span className="text-brand-blue block sm:inline">
              đang ở đâu.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Bài kiểm tra 45 phút giúp bóc tách năng lực thực tế, nhận diện các điểm nghẽn về ngữ pháp, từ vựng và định vị chính xác Rank của bạn theo khung 7 cấp bậc.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment/result/demo")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2.5"
            >
              <span>Bắt đầu đánh giá năng lực ngay</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/academic-system")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Xem khung 7 cấp bậc ARIS-7
            </Button>
          </div>
        </div>
      </section>

      {/* 4-Step Assessment Flow */}
      <SectionContainer
        badge="Quy Trình Khảo Thí"
        title="4 Bước xác định vị trí và lộ trình học"
        description="Quy trình khảo thí được thiết kế để đưa ra kết quả trung thực và khách quan nhất trong thời gian ngắn."
        background="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Bước 01
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Làm bài khảo thí</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
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
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Hệ thống bóc tách các nhóm lỗi sai ngữ pháp, độ chính xác dùng từ và tốc độ phản xạ xử lý câu hỏi.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue">
                Bước 03
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Xác định Rank ARIS-7</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Định vị chính xác bạn đang ở cấp bậc nào trong 7 rank (từ Học Đồ đến Học Đế) và giai đoạn tiến trình tương ứng.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs px-3 py-1 rounded-lg bg-brand-red-soft text-brand-red">
                Bước 04
              </span>
            </div>
            <h3 className="font-black text-foreground text-xl">Đề xuất chặng học</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Gợi ý chính xác khóa học phù hợp trong 5 chặng (Starter, Dreamer, Builder, Master hoặc Leader) để bắt đầu.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* What You Get (4 Giá Trị Nhận Được) */}
      <SectionContainer
        badge="Kết Quả Nhận Được"
        title="Báo cáo phân tích sau bài kiểm tra"
        description="Bạn sẽ nhận được hồ sơ đánh giá chi tiết làm căn cứ định hướng kế hoạch học tập."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-left max-w-4xl mx-auto">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Năng lực thực tế</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Đo lường chính xác khả năng phát âm, ngữ pháp câu, vốn từ vựng học thuật và mức độ đọc hiểu/nghe hiểu.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Điểm nghẽn chính</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Chỉ rõ thói quen dịch thô, các lỗi ngữ pháp lặp đi lặp lại hoặc nguyên nhân khiến bạn chưa bứt phá được điểm số.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Cấp bậc Rank ARIS-7</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Ghi nhận cấp bậc học thuật chính thức và giai đoạn hiện tại (Sơ kỳ, Trung kỳ, Hậu kỳ hoặc Đỉnh phong).
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Đề xuất chặng học</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Khuyến nghị khóa học phù hợp nhất để bạn không mất thời gian học lại kiến thức đã vững hoặc học nhảy cóc.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            onClick={() => navigate("/assessment/result/demo")}
            className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red text-white hover:bg-brand-red-hover shadow-sm gap-2"
          >
            <span>Bắt đầu bài đánh giá năng lực ngay</span>
            <ArrowRight className="h-5 w-5 text-white" />
          </Button>
        </div>
      </SectionContainer>
    </div>
  );
}
