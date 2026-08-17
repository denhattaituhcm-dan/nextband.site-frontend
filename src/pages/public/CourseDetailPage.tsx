import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, BookOpen, ShieldCheck } from "lucide-react";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const courseTitle =
    slug === "foundation"
      ? "ARIS Foundation (3.5 - 5.0)"
      : slug === "intensive"
      ? "ARIS Intensive (5.0 - 6.5)"
      : slug === "master"
      ? "ARIS Master (6.5 - 7.5+)"
      : `Khóa Học: ${slug}`;

  return (
    <div className="space-y-12">
      <SEO
        title={`${courseTitle} — Chương Trình Đào Tạo IELTS`}
        description="Thông tin chi tiết lộ trình, chuẩn đầu ra và phương pháp đào tạo của khóa học tại ARIS."
      />

      <SectionContainer
        badge="Chi Tiết Khóa Học"
        title={courseTitle}
        description="Chương trình đào tạo được cấu trúc bài bản, kết hợp học lý thuyết trọng tâm và làm bài tập trên hệ thống NextBand."
        background="default"
      >
        <div className="max-w-4xl mx-auto space-y-8 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courses")}
            className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách khóa học</span>
          </Button>

          <div className="p-8 rounded-2xl border border-border/80 bg-card space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-soft text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Mục Tiêu &amp; Chuẩn Đầu Ra</h3>
                  <p className="text-xs text-muted-foreground">Theo khung 7 cấp bậc ARIS</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigate("/assessment")}
                  className="rounded-xl font-bold text-xs bg-primary text-primary-foreground"
                >
                  Kiểm tra đầu vào cho khóa này
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <span className="text-xs font-bold text-primary uppercase">Nội dung cốt lõi</span>
                <ul className="space-y-1.5 text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>Luyện tập 4 kỹ năng chuẩn Cambridge</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>Chấm chữa 1:1 hàng tuần trên NextBand</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                <span className="text-xs font-bold text-primary uppercase">Hình thức học tập</span>
                <ul className="space-y-1.5 text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Học trực tiếp kết hợp bài tập trực tuyến</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Cam kết tiến bộ theo từng giai đoạn</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
