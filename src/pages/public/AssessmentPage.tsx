import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { ShieldCheck, ArrowRight, CheckCircle2, Clock, Brain, FileCheck } from "lucide-react";

export default function AssessmentPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12">
      <SEO
        title="Đánh Giá Năng Lực Đầu Vào Chuẩn Học Thuật — ARIS IELTS"
        description="Bài kiểm tra trình độ IELTS chuẩn hóa 4 kỹ năng giúp xác định chính xác rank học thuật hiện tại và lộ trình đào tạo tối ưu."
      />

      <SectionContainer
        badge="Khảo Thí Chuẩn Hóa"
        title="Đánh Giá Năng Lực Đầu Vào Theo Khung 7 Cấp Bậc"
        description="Bài kiểm tra đầu vào được xây dựng bởi ban học thuật ARIS, mô phỏng cấu trúc đề thi Cambridge và xác định chính xác điểm nghẽn của bạn."
        background="default"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-6">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-primary">
                  Standard Placement Test
                </span>
                <h3 className="text-2xl font-extrabold text-foreground tracking-tight">
                  Khảo Thí Năng Lực Toàn Diện
                </h3>
              </div>

              <Button
                onClick={() => navigate("/assessment/result/demo")}
                className="rounded-xl px-6 h-11 font-bold text-xs sm:text-sm bg-primary text-primary-foreground gap-2"
              >
                <span>Bắt đầu bài kiểm tra</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Thời lượng</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  45 - 60 phút đánh giá đa chiều các kỹ năng ngữ pháp, từ vựng và đọc hiểu.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Brain className="h-4 w-4 text-primary" />
                  <span>Phương pháp</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Thuật toán xác định chính xác cấp bậc từ Học Đồ (Rank 3) đến Học Đế (Rank 9).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span>Báo cáo kết quả</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nhận phân tích chi tiết điểm mạnh, điểm yếu và đề xuất khóa học phù hợp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
