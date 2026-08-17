import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";

export default function CoursesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      <SEO
        title="Chương Trình Đào Tạo IELTS Học Thuật"
        description="Các khóa học IELTS từ nền tảng đến nâng cao tại ARIS. Lộ trình đào tạo chuẩn hóa theo hệ thống 7 cấp bậc."
      />

      <SectionContainer
        badge="Chương Trình Đào Tạo"
        title="Lộ Trình Khóa Học IELTS Chuẩn Học Thuật"
        description="Được thiết kế theo chuẩn khảo thí quốc tế, các khóa học tại ARIS giúp học viên bứt phá band điểm bền vững."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="course"
            badge="Khởi động"
            title="ARIS Foundation"
            subtitle="Mục tiêu 3.5 - 5.0 (Học Đồ &amp; Học Giả)"
            description="Xây dựng nền tảng ngữ âm, từ vựng học thuật cốt lõi và làm quen với cấu trúc các dạng bài thi IELTS."
            metadata={["Thời lượng: 12 tuần", "4 Kỹ năng", "NextBand LMS"]}
            ctaLabel="Xem chi tiết khóa học"
            onCtaClick={() => navigate("/courses/foundation")}
          />

          <PlaceholderCard
            variant="course"
            badge="Trọng tâm"
            title="ARIS Intensive"
            subtitle="Mục tiêu 5.0 - 6.5 (Học Sĩ &amp; Học Sư)"
            description="Làm chủ phương pháp xử lý đề thi nâng cao, luyện viết học thuật Task 1 &amp; 2 và phản xạ Speaking Part 2 &amp; 3."
            metadata={["Thời lượng: 14 tuần", "Chấm bài 1:1", "Thi thử định kỳ"]}
            ctaLabel="Xem chi tiết khóa học"
            onCtaClick={() => navigate("/courses/intensive")}
          />

          <PlaceholderCard
            variant="course"
            badge="Bứt phá"
            title="ARIS Master"
            subtitle="Mục tiêu 6.5 - 7.5+ (Học Bá &amp; Học Tôn)"
            description="Huấn luyện tư duy phản biện sắc bén, kiểm soát văn phong học thuật bản ngữ và tối ưu hóa độ chính xác."
            metadata={["Thời lượng: 10 tuần", "Giảng viên 8.0+", "Phản hồi nâng cao"]}
            ctaLabel="Xem chi tiết khóa học"
            onCtaClick={() => navigate("/courses/master")}
          />
        </div>
      </SectionContainer>
    </div>
  );
}
