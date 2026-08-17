import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";

export default function TeachersPage() {
  return (
    <div className="space-y-12">
      <SEO
        title="Đội Ngũ Giảng Viên ARIS IELTS"
        description="Đội ngũ giảng viên và chuyên gia học thuật giàu kinh nghiệm tại ARIS. 100% sở hữu chứng chỉ IELTS 8.0+."
      />

      <SectionContainer
        badge="Đội Ngũ Học Thuật"
        title="Giảng Viên &amp; Chuyên Gia Học Thuật"
        description="Đội ngũ giảng viên tại ARIS được tuyển chọn khắt khe với chuyên môn vững vàng, khả năng sư phạm xuất sắc và sự tận tâm tuyệt đối."
        background="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="teacher"
            badge="Chuyên môn"
            title="Lưu Văn Đẳng"
            subtitle="Academic Director"
            description="Phụ trách định hướng chiến lược đào tạo và phát triển hệ thống khảo thí ARIS. IELTS 8.0+ với nhiều năm kinh nghiệm huấn luyện học viên đạt band cao."
            metadata={["IELTS 8.0+", "Trưởng ban Chuyên môn"]}
          />
          <PlaceholderCard
            variant="teacher"
            badge="Writing & Speaking"
            title="Giảng Viên Cao Cấp A"
            subtitle="Lead Instructor"
            description="Chuyên sâu về huấn luyện tư duy phản biện, cấu trúc lập luận Writing Task 2 và phản xạ lưu loát Speaking Part 3."
            metadata={["IELTS 8.5", "5+ năm kinh nghiệm"]}
          />
          <PlaceholderCard
            variant="teacher"
            badge="Reading & Listening"
            title="Giảng Viên Cao Cấp B"
            subtitle="Senior Instructor"
            description="Chuyên gia giải phẫu văn bản học thuật và chiến thuật xử lý các bẫy đề thi Cambridge dưới áp lực thời gian."
            metadata={["IELTS 8.0", "Thạc sĩ TESOL"]}
          />
        </div>
      </SectionContainer>
    </div>
  );
}
