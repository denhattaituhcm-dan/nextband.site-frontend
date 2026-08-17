import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { AcademicRankSystem } from "@/components/public/AcademicRankSystem";
import { SEO } from "@/components/common/SEO";
import { Shield, BookOpen, Award, CheckCircle2 } from "lucide-react";

export default function AcademicSystemPage() {
  return (
    <div className="space-y-12">
      <SEO
        title="Hệ Thống Phân Cấp Học Thuật ARIS (7 Cấp Bậc)"
        description="Khung năng lực học thuật 7 cấp bậc chính thức của ARIS: Học Đồ, Học Giả, Học Sĩ, Học Sư, Học Bá, Học Tôn, Học Đế."
      />

      <SectionContainer
        badge="Khung Chuẩn Năng Lực"
        title="Hệ Thống Phân Cấp Học Thuật 7 Bậc ARIS"
        description="Được thiết kế nhằm mang lại sự tường minh tuyệt đối cho lộ trình học IELTS, hệ thống phân cấp chuẩn hóa năng lực ngôn ngữ thành 7 cấp bậc từ Học Đồ đến Học Đế."
        background="default"
      >
        <AcademicRankSystem initialRank={5} />
      </SectionContainer>

      <SectionContainer
        badge="Tiến Trình 4 Giai Đoạn"
        title="Cấu Trúc Từng Cấp Bậc: Sơ Kỳ → Đỉnh Phong"
        description="Mỗi rank trong hệ thống được chia thành 4 giai đoạn tiến trình phát triển để định lượng chính xác sự tiến bộ của học viên."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2.5">
            <div className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary-soft text-primary w-fit">
              Giai đoạn 1
            </div>
            <h3 className="font-extrabold text-foreground text-base">Sơ Kỳ (Phase I)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tiếp cận kiến thức cốt lõi, nhận diện các dạng đề và làm quen với các tiêu chí chấm điểm cơ bản của rank.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2.5">
            <div className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary-soft text-primary w-fit">
              Giai đoạn 2
            </div>
            <h3 className="font-extrabold text-foreground text-base">Trung Kỳ (Phase II)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Luyện tập thực hành chuyên sâu, khắc phục các lỗi sai ngữ pháp và tăng tốc độ xử lý câu hỏi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2.5">
            <div className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary-soft text-primary w-fit">
              Giai đoạn 3
            </div>
            <h3 className="font-extrabold text-foreground text-base">Hậu Kỳ (Phase III)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hoàn thiện độ chuẩn xác ngôn ngữ, làm chủ các bài thi trong điều kiện áp lực thời gian thực tế.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-2.5">
            <div className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary-soft text-primary w-fit">
              Giai đoạn 4
            </div>
            <h3 className="font-extrabold text-foreground text-base">Đỉnh Phong (Apex)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Đạt sự ổn định tuyệt đối về phong độ thi cử, sẵn sàng vượt qua kỳ khảo thí thăng hạng hoặc thi thật.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
