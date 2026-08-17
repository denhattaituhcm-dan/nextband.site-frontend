import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";

export default function CareersPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      <SEO
        title="Cơ Hội Nghề Nghiệp Tại ARIS IELTS"
        description="Gia nhập đội ngũ giảng viên và chuyên viên học thuật tại ARIS. Môi trường làm việc chuyên nghiệp, chuẩn mực và tôn trọng tri thức."
      />

      <SectionContainer
        badge="Cơ Hội Nghề Nghiệp"
        title="Đồng Hành Cùng Sự Phát Triển Của ARIS"
        description="Chúng tôi chào đón những ứng viên tài năng, tâm huyết với giáo dục học thuật và mong muốn đồng hành phát triển cùng hệ thống."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="job"
            badge="Toàn thời gian"
            title="Giảng Viên IELTS Writing &amp; Speaking"
            subtitle="Ban Học thuật"
            description="Yêu cầu IELTS 8.0+ (Writing &amp; Speaking >= 7.5), có tư duy học thuật sắc bén và kỹ năng truyền đạt lôi cuốn."
            metadata={["Dĩ An, Bình Dương / TP.HCM", "Môi trường học thuật"]}
            ctaLabel="Xem chi tiết &amp; Ứng tuyển"
            onCtaClick={() => navigate("/careers/ielts-teacher")}
          />
          <PlaceholderCard
            variant="job"
            badge="Toàn thời gian"
            title="Chuyên Viên Điều Phối Học Thuật"
            subtitle="Academic Coordinator"
            description="Điều phối lịch trình học tập, giám sát chất lượng đào tạo và vận hành nền tảng NextBand."
            metadata={["Toàn thời gian", "Đãi ngộ hấp dẫn"]}
            ctaLabel="Xem chi tiết &amp; Ứng tuyển"
            onCtaClick={() => navigate("/careers/academic-coordinator")}
          />
          <PlaceholderCard
            variant="job"
            badge="Bán thời gian"
            title="Trợ Giảng Học Thuật (TA)"
            subtitle="Hỗ trợ học tập"
            description="Đồng hành hỗ trợ học viên thực hành bài tập và chấm bài trắc nghiệm, hỗ trợ tổ chức kỳ thi thử."
            metadata={["IELTS 7.0+", "Linh hoạt ca làm"]}
            ctaLabel="Xem chi tiết &amp; Ứng tuyển"
            onCtaClick={() => navigate("/careers/teaching-assistant")}
          />
        </div>
      </SectionContainer>
    </div>
  );
}
