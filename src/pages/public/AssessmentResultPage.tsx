import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, BookOpen } from "lucide-react";

export default function AssessmentResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      <SEO
        title="Kết Quả Đánh Giá Năng Lực Đầu Vào — ARIS IELTS"
        description="Báo cáo phân tích trình độ và đề xuất lộ trình đào tạo cá nhân hóa từ ban học thuật ARIS."
      />

      <SectionContainer
        badge="Báo Cáo Khảo Thí"
        title="Kết Quả Đánh Giá Năng Lực"
        description="Phân tích tổng quan trình độ hiện tại và định hướng giai đoạn tiến trình học thuật phù hợp."
        background="default"
      >
        <div className="max-w-3xl mx-auto space-y-8 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessment")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Làm lại bài kiểm tra</span>
          </Button>

          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-6">
              <div className="space-y-1">
                <span className="text-xs font-mono text-muted-foreground">Mã kết quả: #{id}</span>
                <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                  Xếp Hạng: Rank 5 — Học Sĩ (Sơ Kỳ)
                </h3>
              </div>

              <div className="p-3 rounded-xl bg-primary-soft text-primary font-bold text-xs flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>Tương đương IELTS 5.0 - 5.5</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wide">
                Đề Xuất Lộ Trình Đào Tạo Phù Hợp
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Với nền tảng hiện tại, bạn nên bắt đầu với khóa <strong>ARIS Intensive (5.0 - 6.5)</strong> để củng cố kỹ năng viết Task 2 và phản xạ Speaking chuyên sâu.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => navigate("/courses/intensive")}
                  className="rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Xem chi tiết khóa ARIS Intensive</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="rounded-xl font-bold text-xs border-border"
                >
                  Nhận tư vấn từ ban học thuật
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
