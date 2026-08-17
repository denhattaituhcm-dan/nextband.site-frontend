import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";

export default function NewsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      <SEO
        title="Tin Tức & Bài Viết Học Thuật — ARIS IELTS"
        description="Tổng hợp các bài viết nghiên cứu phương pháp học IELTS, phân tích đề thi Cambridge và tin tức học thuật từ ARIS."
      />

      <SectionContainer
        badge="Tin Tức &amp; Học Thuật"
        title="Góc Nhìn Học Thuật &amp; Phương Pháp Nghiên Cứu"
        description="Các bài viết chia sẻ chuyên sâu về phương pháp học tiếng Anh học thuật, chiến thuật xử lý bài thi và thông báo từ học viện."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <PlaceholderCard
            variant="article"
            badge="Học thuật"
            title="Chiến Lược Nâng Band Writing Task 2 Qua Tư Duy Phản Biện"
            subtitle="Phân tích chuyên sâu"
            description="Phân tích cách xây dựng luận điểm thuyết phục và tránh bẫy liệt kê ý tưởng trong bài thi viết học thuật."
            metadata={["Tác giả: Ban Chuyên môn", "Thời gian đọc: 5 phút"]}
            ctaLabel="Đọc bài viết"
            onCtaClick={() => navigate("/news/writing-task-2-critical-thinking")}
          />
          <PlaceholderCard
            variant="article"
            badge="Khảo thí"
            title="Xu Hướng Đề Thi IELTS 2026: Trọng Tâm Ngữ Nghĩa &amp; Logic"
            subtitle="Xu hướng khảo thí"
            description="Tổng hợp những thay đổi đáng chú ý trong độ khó của bài thi Reading và các dạng câu hỏi Speaking Part 3 mới."
            metadata={["Tác giả: Ban Khảo thí", "Thời gian đọc: 7 phút"]}
            ctaLabel="Đọc bài viết"
            onCtaClick={() => navigate("/news/ielts-trends-2026")}
          />
          <PlaceholderCard
            variant="article"
            badge="Thông báo"
            title="Công Bố Chuẩn Đầu Ra Mới Theo Hệ Thống 7 Cấp Bậc ARIS"
            subtitle="Hệ thống học thuật"
            description="Chi tiết về việc áp dụng khung đánh giá 7 bậc cho toàn bộ học viên NextBand nhằm cá nhân hóa lộ trình học."
            metadata={["Tác giả: Academic Board", "Thời gian đọc: 4 phút"]}
            ctaLabel="Đọc bài viết"
            onCtaClick={() => navigate("/news/academic-rank-announcement")}
          />
        </div>
      </SectionContainer>
    </div>
  );
}
