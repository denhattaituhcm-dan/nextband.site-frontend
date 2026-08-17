import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, BookOpen, Target, Brain, ShieldCheck } from "lucide-react";

export default function AssessmentResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Báo Cáo Đánh Giá Năng Lực — ARIS IELTS"
        description="Báo cáo phân tích trình độ và đề xuất lộ trình đào tạo cá nhân hóa theo khung 7 cấp bậc ARIS-7."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/assessment")}
            className="gap-2 text-foreground/75 hover:text-foreground font-bold -ml-3 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại cổng khảo thí</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono font-black px-3.5 py-1 rounded-full bg-brand-red-soft text-brand-red border border-brand-red/30 uppercase tracking-wider">
              BẢN DEMO — Minh họa giao diện báo cáo
            </span>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20">
              Mã hồ sơ mẫu: #{id || "DEMO-SAMPLE"}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Báo Cáo Năng Lực Cá Nhân (Minh Họa)
          </h1>

          <p className="text-lg sm:text-xl text-foreground/85 font-normal leading-relaxed">
            Dưới đây là bản mô phỏng cấu trúc báo cáo khảo thí chuẩn hóa của ARIS. Sau khi hoàn thành bài làm thực tế, bạn sẽ nhận được báo cáo tương tự với dữ liệu phân tích riêng của bản thân.
          </p>
        </div>
      </section>

      {/* Detailed Result Breakdown */}
      <SectionContainer
        badge="Kết Quả Phân Tích"
        title="Định vị cấp bậc &amp; Đề xuất chặng học"
        description="Kết quả dựa trên bài làm 4 kỹ năng và phản xạ xử lý câu hỏi chuẩn Cambridge."
        background="muted"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          {/* Main Rank Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-6">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-brand-blue font-extrabold">
                  Xếp Hạng Năng Lực Hiện Tại
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground">
                  Rank 5 — Học Sĩ (Sơ Kỳ)
                </h3>
              </div>

              <div className="p-3.5 px-5 rounded-2xl bg-brand-blue text-white font-extrabold text-sm flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-cyan" />
                <span>Khoảng điểm: 4.5 – 5.0</span>
              </div>
            </div>

            {/* Analysis points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="font-extrabold text-foreground text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>Điểm mạnh đã đạt được</span>
                </h4>
                <ul className="space-y-2 text-sm text-foreground/75 leading-relaxed pl-7">
                  <li>• Phát âm các âm IPA cơ bản chuẩn xác</li>
                  <li>• Làm chủ cấu trúc câu đơn và câu ghép thông dụng</li>
                  <li>• Đọc hiểu được các bài viết ngắn có từ vựng quen thuộc</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-foreground text-base flex items-center gap-2 text-brand-red">
                  <Target className="h-5 w-5 text-brand-red" />
                  <span>Điểm nghẽn cần khắc phục</span>
                </h4>
                <ul className="space-y-2 text-sm text-foreground/75 leading-relaxed pl-7">
                  <li>• Còn lúng túng khi viết câu phức nhiều mệnh đề</li>
                  <li>• Chưa biết cách phát triển chuỗi luận điểm Writing Task 2</li>
                  <li>• Phản xạ Nói còn ngắc ngứ khi gặp câu hỏi Part 2 &amp; 3</li>
                </ul>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-6 rounded-2xl bg-brand-blue-soft border border-brand-blue/30 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-black uppercase text-brand-blue">
                  Khuyến Nghị Đào Tạo
                </span>
                <h4 className="text-xl font-black text-foreground">
                  Khóa Học Đề Xuất: Khóa MASTER (5.0 → 6.0)
                </h4>
              </div>

              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                Với nền tảng hiện tại của bạn, bắt đầu tại <strong>Khóa MASTER</strong> sẽ giúp bạn củng cố kỹ năng lập luận Writing Task 2 theo phương pháp The ARIS Way và bứt phá band điểm Speaking.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/courses/master")}
                  className="rounded-xl px-6 h-12 font-extrabold text-sm bg-brand-red text-white hover:bg-brand-red-hover gap-2"
                >
                  <span>Xem chi tiết Khóa MASTER</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/contact")}
                  className="rounded-xl px-6 h-12 font-bold text-sm border-2 border-border/80 hover:bg-muted text-foreground"
                >
                  Liên hệ nhận tư vấn xếp lớp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
