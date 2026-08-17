import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";
import { Brain, Layers, RefreshCw, Sparkles } from "lucide-react";

export default function MethodPage() {
  return (
    <div className="space-y-12">
      <SEO
        title="Phương Pháp Đào Tạo ARIS — The ARIS Way"
        description="Phương pháp đào tạo IELTS chuẩn học thuật của ARIS. Phát triển toàn diện 4 kỹ năng qua tư duy phản biện và phản hồi 1:1."
      />

      <SectionContainer
        badge="Phương Pháp Độc Quyền"
        title="The ARIS Way — Tư Duy Học Thuật &amp; Kỷ Luật Luyện Tập"
        description="Khác biệt hoàn toàn với cách học mẹo thi hay học tủ, phương pháp ARIS xây dựng năng lực giải quyết đề thi dựa trên nguyên lý ngôn ngữ học ứng dụng."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="p-3 rounded-xl bg-primary-soft text-primary w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              01. Nguyên Lý Giải Mã Cấu Trúc Đề
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Học viên được hướng dẫn nhận diện bản chất yêu cầu của từng dạng câu hỏi Cambridge, phân tích bẫy thông tin và cách phân bổ thời gian tối ưu cho từng kỹ năng.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="p-3 rounded-xl bg-primary-soft text-primary w-fit">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              02. Xây Dựng Luận Điểm Đa Chiều
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Huấn luyện kỹ năng mở rộng ý niệm, lập luận sắc bén và kết nối mạch lạc (Coherence &amp; Cohesion) để đạt điểm cao trong Writing Task 2 và Speaking Part 3.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="p-3 rounded-xl bg-primary-soft text-primary w-fit">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              03. Vòng Lặp Phản Hồi Kép
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mỗi bài nộp trên hệ thống NextBand đều được giáo viên chấm chữa từng câu, chỉ rõ lỗi sai về ngữ pháp, dùng từ và hướng dẫn viết lại câu chuẩn xác hơn.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-4">
            <div className="p-3 rounded-xl bg-primary-soft text-primary w-fit">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              04. Đo Lường Theo Khung 7 Cấp Bậc
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Học viên luôn nắm rõ mình đang ở cấp bậc nào (từ Học Đồ đến Học Đế) và cần hoàn thiện giai đoạn nào (Sơ kỳ, Trung kỳ, Hậu kỳ, Đỉnh phong) để nâng band.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
