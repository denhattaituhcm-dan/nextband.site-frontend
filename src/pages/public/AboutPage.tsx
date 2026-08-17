import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  ShieldCheck,
  Target,
  Award,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Brain,
  Compass,
  Layers,
} from "lucide-react";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Về Học Viện ARIS — Bản Sắc & Sứ Mệnh"
        description="ARIS — Học viện Ngôn ngữ Học thuật & Tư duy Phản biện. Nơi xây dựng năng lực tiếng Anh thực chất, không học mẹo, không học thuộc bài mẫu."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>Bản Sắc &amp; Sứ Mệnh</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Một môi trường học thuật{" "}
            <span className="text-brand-blue block sm:inline">
              trung thực và kỷ luật.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Chúng tôi không bán mẹo thi cấp tốc. Chúng tôi giúp người học xây dựng năng lực sử dụng tiếng Anh thực chất để tự tin học tập và làm việc trong môi trường quốc tế.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/method")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Khám phá phương pháp The ARIS Way</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Đánh giá năng lực đầu vào
            </Button>
          </div>
        </div>
      </section>

      {/* Section 1: 3 Cam Kết Nội Bộ */}
      <SectionContainer
        badge="Nguyên Tắc Đào Tạo"
        title="3 Cam kết không thể thay đổi tại ARIS"
        description="Mọi lớp học, bài giảng và hoạt động chấm chữa tại ARIS đều phải tuân thủ nghiêm ngặt 3 chuẩn mực sư phạm cốt lõi."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              01. Không dạy học vẹt bài mẫu
            </h3>
            <p className="text-base text-foreground/75 leading-relaxed">
              Tuyệt đối không bắt học viên học thuộc lòng các bài văn mẫu. Chúng tôi hướng dẫn bạn tự xây dựng luận điểm logic và diễn đạt ý tưởng của chính mình.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              02. Không nhận xét chung chung
            </h3>
            <p className="text-base text-foreground/75 leading-relaxed">
              Mọi bài viết và bài nói đều được giáo viên bóc tách từng câu, chỉ rõ cơ chế lỗi sai về mặt ngữ pháp, dùng từ và cách phát triển lập luận.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
            <div className="p-3 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">
              03. Luôn yêu cầu làm bài sửa
            </h3>
            <p className="text-base text-foreground/75 leading-relaxed">
              Nhận xét chỉ có giá trị khi học viên hành động. Bạn bắt buộc phải tự tay viết lại bài sửa để triệt tiêu lỗi sai cũ trước khi chuyển sang bài mới.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Section 2: Kiến Trúc Hệ Sinh Thái ARIS & NextBand */}
      <SectionContainer
        badge="Hệ Sinh Thái"
        title="Sự kết hợp giữa Học viện và Công nghệ học tập"
        description="ARIS định hình triết lý và tiêu chuẩn chuyên môn; NextBand đóng vai trò hạ tầng công nghệ theo dõi và đo lường sự tiến bộ."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue-soft text-brand-blue text-xs font-extrabold uppercase">
              <span>Học Viện ARIS</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              Tiêu Chuẩn Học Thuật &amp; Sư Phạm
            </h3>
            <p className="text-base text-foreground/75 leading-relaxed">
              ARIS chịu trách nhiệm xây dựng khung chuẩn năng lực 7 cấp bậc (ARIS-7), phương pháp giải phẫu ngôn ngữ (The ARIS Way) và đào tạo đội ngũ giảng viên chuyên môn cao.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm sm:text-base text-foreground/80 font-bold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Khung 7 Cấp Bậc định vị năng lực rõ ràng
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Giáo trình tập trung vào tư duy phản biện
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Đội ngũ giảng viên có chứng chỉ chuyên môn
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl border border-border/80 bg-card space-y-4 shadow-2xs">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-red-soft text-brand-red text-xs font-extrabold uppercase">
              <span>Hạ Tầng NextBand</span>
            </div>
            <h3 className="text-2xl font-black text-foreground">
              Nền Tảng Quản Lý &amp; Khảo Thí Số
            </h3>
            <p className="text-base text-foreground/75 leading-relaxed">
              NextBand là bàn làm việc trực tuyến của học viên, nơi mọi bài nộp được lưu trữ nguyên bản, phòng thi mô phỏng chuẩn xác và nhật ký tiến bộ được cập nhật từng ngày.
            </p>
            <ul className="space-y-2.5 pt-2 text-sm sm:text-base text-foreground/80 font-bold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Lưu vết 100% bài nộp và lịch sử sửa bài
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Giao diện làm bài thi mô phỏng chuẩn Cambridge
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Không gửi bài qua tin nhắn trôi nổi
              </li>
            </ul>
          </div>
        </div>
      </SectionContainer>

      {/* Section 3: Lời Hứa Thương Hiệu */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-brand-cyan" />
            <span>Lời Hứa Từ ARIS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Đo lường minh bạch. Rèn luyện có kỷ luật. Tiến bộ từ bản chất.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            ARIS cam kết mang đến một lộ trình học tập chuẩn mực, nơi mọi điểm nghẽn của bạn được giải phẫu rõ ràng và mọi phản hồi đều phục vụ sự phát triển năng lực thực chất.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/courses")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red text-white hover:bg-brand-red-hover shadow-md border-0 gap-2.5"
            >
              <span>Xem các chương trình đào tạo</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
