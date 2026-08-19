import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { CoursePricingCard } from "@/components/public/CoursePricingCard";
import { TrustValueStrip } from "@/components/public/TrustValueStrip";
import { QuickTrialModal } from "@/components/public/QuickTrialModal";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { COURSE_CATALOG } from "@/constants/courses";
import {
  BookOpen,
  Target,
  ArrowRight,
  ShieldCheck,
  Clock,
  Brain,
  Users,
} from "lucide-react";

export default function CoursesPage() {
  const navigate = useNavigate();
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState("starter");

  const handleOpenTrial = (slug: string) => {
    setSelectedCourseSlug(slug);
    setTrialModalOpen(true);
  };

  const handleOpenDetail = (slug: string) => {
    navigate(`/courses/${slug}`);
  };

  return (
    <div className="flex flex-col">
      <SEO
        title="5 Chương Trình Đào Tạo IELTS — Học Viện ARIS"
        description="Lộ trình 5 khóa học IELTS từ mất gốc đến 6.5+ tại ARIS: Starter, Dreamer, Builder, Master và Leader, kết nối trực tiếp với hệ thống 7 cấp bậc ARIS-7."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-20 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <BookOpen className="h-4 w-4" />
            <span>Lộ Trình 5 Chặng Đào Tạo</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Lộ trình học tập rõ ràng,{" "}
            <span className="text-brand-blue block sm:inline">
              phù hợp với điểm xuất phát.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Lớp học siêu nhỏ tối đa 08 học viên, 100% giáo viên IELTS 8.0+ trực tiếp đứng lớp, học phí minh bạch và trải nghiệm 02 buổi học thử trước khi quyết định.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => handleOpenTrial("starter")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Nhận lịch học thử 02 buổi</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Đánh giá năng lực để xếp lớp
            </Button>
          </div>
        </div>
      </section>

      {/* 4 Trust Points Strip */}
      <TrustValueStrip />

      {/* Pathway 1: Giai Đoạn Xây Nền Năng Lực (3 Khóa) */}
      <SectionContainer
        badge="Giai Đoạn 1: Xây Nền Năng Lực"
        title="Chặng Xây Nền: Phát âm, Từ vựng &amp; Cấu trúc câu"
        description="Dành cho người mất gốc hoặc có nền tảng cơ bản, tập trung làm chủ ngữ pháp câu và khả năng đọc hiểu/nghe hiểu văn bản học thuật."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <CoursePricingCard
            course={COURSE_CATALOG.starter}
            onTrialClick={handleOpenTrial}
            onDetailClick={handleOpenDetail}
          />

          <CoursePricingCard
            course={COURSE_CATALOG.dreamer}
            onTrialClick={handleOpenTrial}
            onDetailClick={handleOpenDetail}
          />

          <CoursePricingCard
            course={COURSE_CATALOG.builder}
            onTrialClick={handleOpenTrial}
            onDetailClick={handleOpenDetail}
          />
        </div>
      </SectionContainer>

      {/* Pathway 2: Giai Đoạn Bứt Phá Band Điểm (2 Khóa) */}
      <SectionContainer
        badge="Giai Đoạn 2: Bứt Phá Điểm Số"
        title="Chặng Chuyên Sâu: Viết luận, Phản xạ &amp; Tư duy phản biện"
        description="Huấn luyện phương pháp The ARIS Way để làm chủ các dạng đề nâng cao và tối ưu hóa điểm số trong phòng thi IELTS thực tế."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
          <CoursePricingCard
            course={COURSE_CATALOG.master}
            onTrialClick={handleOpenTrial}
            onDetailClick={handleOpenDetail}
          />

          <CoursePricingCard
            course={COURSE_CATALOG.leader}
            onTrialClick={handleOpenTrial}
            onDetailClick={handleOpenDetail}
          />
        </div>
      </SectionContainer>

      {/* Core Operational Commitments Section */}
      <SectionContainer
        badge="Quy Chuẩn Lớp Học"
        title="Tiêu chuẩn đào tạo tại Học Viện ARIS"
        description="Những cam kết về môi trường học tập và trách nhiệm giảng dạy được áp dụng đồng bộ trên toàn bộ 5 khóa học."
        background="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Tối đa 08 học viên</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Sĩ số lớp nhỏ đảm bảo giảng viên theo sát và sửa chữa chi tiết bài làm của từng học viên trong suốt khóa học.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">3 Buổi / Tuần</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Lịch học tiêu chuẩn: 03 buổi mỗi tuần, mỗi buổi 02 giờ, kết hợp làm bài tập và nhận phản hồi trên NextBand.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Sửa lỗi từng câu</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Giáo viên phân tích chi tiết lỗi sai ngữ pháp, từ vựng và lập luận; học viên tự tay viết lại bài sửa trước khi sang bài mới.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="p-2.5 rounded-2xl bg-brand-blue-soft text-brand-blue w-fit">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-xl">Giảng viên chuyên môn</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Đội ngũ giảng viên có chứng chỉ chuyên môn cao, trực tiếp đứng lớp giảng dạy và theo sát tiến độ học tập.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Final Action CTA */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Target className="h-4 w-4 text-brand-cyan" />
            <span>Xác Định Chặng Học</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Bắt đầu bằng việc kiểm tra trình độ đầu vào.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Thực hiện bài kiểm tra khảo thí 4 kỹ năng miễn phí để xác định chính xác bạn nên bắt đầu từ khóa nào trong 5 chặng đào tạo.
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

      {/* Quick Trial Booking Modal */}
      <QuickTrialModal
        isOpen={trialModalOpen}
        onOpenChange={setTrialModalOpen}
        initialCourseSlug={selectedCourseSlug}
      />
    </div>
  );
}
