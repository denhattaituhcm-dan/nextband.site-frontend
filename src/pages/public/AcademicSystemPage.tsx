import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { AcademicRankSystem } from "@/components/public/AcademicRankSystem";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { Shield, BookOpen, Award, CheckCircle2, Sparkles, ArrowRight, Target } from "lucide-react";

export default function AcademicSystemPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Hệ Thống 7 Cấp Bậc ARIS-7 — Bản Đồ Tiến Độ Học Thuật"
        description="Khung năng lực 7 cấp bậc chính thức của ARIS (Học Đồ, Học Giả, Học Sĩ, Học Sư, Học Bá, Học Tôn, Học Đế) với 4 giai đoạn tiến trình đo lường sự tiến bộ."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Bản Đồ Tiến Độ 7 Cấp Bậc</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Bạn đang ở đâu trên hành trình{" "}
            <span className="text-brand-blue block sm:inline">
              chinh phục tiếng Anh?
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            ARIS chuẩn hóa lộ trình thành 7 cấp bậc năng lực rõ ràng. Mỗi bậc đều có tiêu chuẩn đầu ra cụ thể và 4 giai đoạn tiến trình để bạn đo lường sự tiến bộ từng ngày.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Kiểm tra xem bạn đang ở Rank nào</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/courses")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Xem các khóa học tương ứng
            </Button>
          </div>
        </div>
      </section>

      {/* Main Interactive System Section */}
      <SectionContainer
        badge="Khung Chuẩn Năng Lực"
        title="Chi tiết 7 cấp bậc học thuật ARIS-7"
        description="Chọn từng cấp bậc bên dưới để xem chi tiết tiêu chuẩn năng lực về từ vựng, ngữ pháp, tư duy phản biện và khả năng xử lý bài thi Cambridge."
        background="default"
      >
        <AcademicRankSystem initialRank={5} />
      </SectionContainer>

      {/* 4 Progression Stages Section */}
      <SectionContainer
        badge="Tiến Trình 4 Giai Đoạn"
        title="4 Giai đoạn phát triển trong từng cấp bậc"
        description="Mỗi rank được chia thành 4 giai đoạn phát triển khép kín để định lượng sự tiến bộ và đảm bảo học viên không bị học nhảy cóc."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
              <span>Giai đoạn 1</span>
              <img src="/images/star.png" alt="star" className="w-3.5 h-3.5 object-contain inline-block -mt-0.5" />
            </div>
            <h3 className="font-black text-foreground text-xl">Sơ Kỳ (Phase I)</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Tiếp cận kiến thức cốt lõi, nhận diện cấu trúc dạng đề và làm quen với các tiêu chí chấm điểm cơ bản của rank.
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
            <h3 className="font-black text-foreground text-xl">Trung Kỳ (Phase II)</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Luyện tập chuyên sâu có chủ đích, bóc tách và sửa các lỗi sai ngữ pháp, cách dùng từ và logic lập luận hay gặp.
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
            <h3 className="font-black text-foreground text-xl">Hậu Kỳ (Phase III)</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Nâng cao độ chính xác và tính mạch lạc, rèn luyện kỹ năng xử lý các bài thi trong điều kiện áp lực thời gian thực tế.
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
            <h3 className="font-black text-foreground text-xl">Đỉnh Phong (Apex)</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Đạt chuẩn đầu ra vững chắc của rank, sẵn sàng thực hiện bài kiểm tra khảo thí để nâng lên cấp bậc học thuật tiếp theo.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Final Action CTA */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Target className="h-4 w-4 text-brand-cyan" />
            <span>Khảo Thí Năng Lực</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Xác định vị trí hiện tại của bạn chỉ sau 45 phút.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Thực hiện bài kiểm tra khảo thí chuẩn hóa miễn phí để nhận báo cáo phân tích chi tiết rank năng lực và điểm nghẽn học thuật.
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
