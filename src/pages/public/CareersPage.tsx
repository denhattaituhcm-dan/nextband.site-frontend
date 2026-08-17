import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Users,
  Brain,
  Award,
  Target,
} from "lucide-react";

export default function CareersPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Cơ Hội Nghề Nghiệp & Tuyển Dụng — Học Viện ARIS"
        description="Gia nhập đội ngũ giảng viên và chuyên viên học thuật tại ARIS. Môi trường làm việc tôn trọng tri thức, đề cao năng lực thực chất."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Cơ Hội Nghề Nghiệp</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Xây dựng môi trường học thuật{" "}
            <span className="text-brand-blue block sm:inline">
              chuẩn mực cùng ARIS.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Chúng tôi tìm kiếm những giảng viên và chuyên viên học thuật đam mê bản chất ngôn ngữ, tôn trọng tri thức và có tinh thần trách nhiệm cao với từng học viên.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => {
                const el = document.getElementById("open-positions");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Xem vị trí đang tuyển</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/about")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Tìm hiểu về ARIS
            </Button>
          </div>
        </div>
      </section>

      {/* Open Positions Grid */}
      <SectionContainer
        id="open-positions"
        badge="Vị Trí Đang Tuyển"
        title="Các cơ hội làm việc tại ARIS"
        description="Chọn vị trí phù hợp với năng lực chuyên môn và định hướng phát triển của bạn."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <PlaceholderCard
            variant="job"
            badge="Toàn thời gian / Bán thời gian"
            title="Giảng Viên IELTS Writing &amp; Speaking"
            subtitle="Ban Chuyên Môn"
            description="Trực tiếp giảng dạy và chấm chữa bài viết, bài nói cho học viên theo phương pháp The ARIS Way; yêu cầu năng lực chuyên môn và sư phạm vững vàng."
            metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Lớp tối đa 8 học viên", "Môi trường học thuật"]}
            ctaLabel="Xem chi tiết &amp; Ứng tuyển"
            onCtaClick={() => navigate("/careers/ielts-teacher")}
          />

          <PlaceholderCard
            variant="job"
            badge="Toàn thời gian"
            title="Chuyên Viên Điều Phối Học Thuật"
            subtitle="Academic Coordinator"
            description="Điều phối lịch học, theo dõi tiến độ nộp bài và làm bài sửa của học viên trên hệ thống NextBand; đảm bảo chất lượng vận hành lớp học."
            metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Vận hành NextBand LMS", "Chế độ đãi ngộ tốt"]}
            ctaLabel="Xem chi tiết &amp; Ứng tuyển"
            onCtaClick={() => navigate("/careers/academic-coordinator")}
          />

          <PlaceholderCard
            variant="job"
            badge="Bán thời gian"
            title="Trợ Giảng Học Thuật (TA)"
            subtitle="Hỗ Trợ Học Tập"
            description="Đồng hành hỗ trợ học viên luyện tập phát âm, giải đáp thắc mắc bài tập cơ bản và hỗ trợ tổ chức các kỳ thi thử Cambridge định kỳ."
            metadata={["TP. Dĩ An, Tỉnh Bình Dương", "Linh hoạt ca làm", "Cơ hội rèn luyện chuyên môn"]}
            ctaLabel="Xem chi tiết &amp; Ứng tuyển"
            onCtaClick={() => navigate("/careers/teaching-assistant")}
          />
        </div>
      </SectionContainer>

      {/* Why ARIS (3 Điểm Khác Biệt Môi Trường Làm Việc) */}
      <SectionContainer
        badge="Môi Trường Làm Việc"
        title="Vì sao bạn nên đồng hành cùng ARIS?"
        description="Chúng tôi xây dựng một văn hóa làm việc tập trung vào giá trị giáo dục thực chất và sự tôn trọng lẫn nhau."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              01. Chuẩn mực chuyên môn
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Tập trung 100% vào việc dạy học thực chất. Tuyệt đối không áp đặt chỉ tiêu thương mại hay yêu cầu giáo viên phải dạy mẹo thi thiếu cơ sở.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              02. Văn hóa phản hồi cởi mở
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Mọi ý kiến đóng góp về giáo trình, phương pháp giảng dạy và cải tiến hệ thống đều được lắng nghe, thảo luận và thử nghiệm nghiêm túc.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              03. Phát triển nghề nghiệp
            </h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Cơ hội nâng cao năng lực nghiên cứu ngôn ngữ học ứng dụng, làm chủ hạ tầng công nghệ NextBand và tham gia xây dựng hệ thống khảo thí chuẩn mực.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Final Action CTA */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Briefcase className="h-4 w-4 text-brand-cyan" />
            <span>Gia Nhập ARIS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Cùng chúng tôi tạo nên sự khác biệt trong đào tạo IELTS.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Gửi hồ sơ ứng tuyển của bạn ngay hôm nay để nhận phản hồi từ bộ phận tuyển dụng ARIS.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/careers/ielts-teacher")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red text-white hover:bg-brand-red-hover shadow-md border-0 gap-2.5"
            >
              <span>Ứng tuyển vị trí Giảng viên ngay</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
