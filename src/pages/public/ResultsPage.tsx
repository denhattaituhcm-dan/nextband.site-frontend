import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";

export default function ResultsPage() {
  return (
    <div className="space-y-12">
      <SEO
        title="Bảng Vàng Thành Tích & Kết Quả Học Viên ARIS"
        description="Kết quả thi thực tế và sự tiến bộ của học viên tại ARIS IELTS qua các mốc thời gian."
      />

      <SectionContainer
        badge="Bảng Vàng Thành Tích"
        title="Kết Quả Thi Thực Tế Của Học Viên"
        description="Sự tiến bộ vượt bậc và điểm số IELTS chính thức là minh chứng rõ ràng nhất cho chất lượng đào tạo tại ARIS."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="result"
            badge="Bứt phá xuất sắc"
            title="IELTS Overall 8.0"
            subtitle="Khóa ARIS Master"
            description="Đạt 9.0 Listening, 8.5 Reading sau khóa học rèn luyện tư duy phản biện và làm bài trên hệ thống NextBand."
            metadata={["Listening: 9.0", "Reading: 8.5", "Writing: 7.5"]}
          />
          <PlaceholderCard
            variant="result"
            badge="Nâng band cấp tốc"
            title="IELTS Overall 7.5"
            subtitle="Khóa ARIS Intensive"
            description="Tăng từ 5.5 lên 7.5 chỉ sau một lộ trình học tập kỷ luật và được sửa bài chi tiết 1:1 hàng tuần."
            metadata={["Reading: 8.5", "Listening: 8.0", "Speaking: 7.0"]}
          />
          <PlaceholderCard
            variant="result"
            badge="Vững vàng mục tiêu"
            title="IELTS Overall 7.0"
            subtitle="Khóa ARIS Foundation"
            description="Xây dựng nền tảng từ mất gốc và đạt mục tiêu xét tuyển đại học chỉ sau 2 kỳ học liên tục."
            metadata={["Writing: 7.0", "Speaking: 7.0", "Reading: 7.5"]}
          />
        </div>
      </SectionContainer>
    </div>
  );
}
