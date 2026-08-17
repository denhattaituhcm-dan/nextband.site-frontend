import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const articleTitle =
    slug === "writing-task-2-critical-thinking"
      ? "Chiến Lược Nâng Band Writing Task 2 Qua Tư Duy Phản Biện"
      : slug === "ielts-trends-2026"
      ? "Xu Hướng Đề Thi IELTS 2026: Trọng Tâm Ngữ Nghĩa & Logic"
      : slug === "academic-rank-announcement"
      ? "Công Bố Chuẩn Đầu Ra Mới Theo Hệ Thống 7 Cấp Bậc ARIS"
      : `Bài Viết: ${slug}`;

  return (
    <div className="space-y-12">
      <SEO
        title={`${articleTitle} — Tin Tức ARIS`}
        description="Bài viết nghiên cứu chuyên sâu về phương pháp học IELTS và phân tích học thuật từ ARIS."
      />

      <SectionContainer
        badge="Bài Viết Học Thuật"
        title={articleTitle}
        description="Góc nhìn chuyên môn từ ban học thuật và khảo thí ARIS IELTS."
        background="default"
      >
        <div className="max-w-3xl mx-auto space-y-8 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/news")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại tin tức &amp; bài viết</span>
          </Button>

          <article className="p-8 rounded-2xl border border-border/80 bg-card space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Ban Chuyên Môn ARIS
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  2026
                </span>
              </div>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                5 phút đọc
              </span>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed">
              <p>
                Để đạt được điểm số cao trong bài thi IELTS, việc nắm vững ngữ pháp và từ vựng chỉ là điều kiện cần. Điều kiện đủ quyết định sự bứt phá từ band 6.5 lên 7.5+ nằm ở khả năng tổ chức tư duy logic và triển khai lập luận có chiều sâu.
              </p>

              <h3 className="text-lg font-bold text-foreground pt-2">
                1. Hiểu Rõ Tiêu Chí Task Response &amp; Coherence
              </h3>
              <p>
                Rất nhiều thí sinh mất điểm đáng tiếc do việc đưa ra các ý tưởng rời rạc mà không có sự giải thích (explanation) và dẫn chứng (illustration) cụ thể. Một đoạn văn học thuật chuẩn mực đòi hỏi sự liền mạch từ câu chủ đề đến câu kết luận.
              </p>

              <h3 className="text-lg font-bold text-foreground pt-2">
                2. Phương Pháp Luyện Tập Có Kỷ Luật Trên NextBand
              </h3>
              <p>
                Thông qua việc nộp bài và nhận phản hồi chi tiết từ giáo viên trên hệ thống NextBand, học viên có thể nhận diện ngay các lỗi sai cố hữu và cải thiện từng câu văn trong các bài tập tiếp theo.
              </p>
            </div>
          </article>
        </div>
      </SectionContainer>
    </div>
  );
}
