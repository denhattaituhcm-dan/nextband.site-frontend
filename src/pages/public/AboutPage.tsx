import React from "react";
import { SectionContainer } from "@/components/public/SectionContainer";
import { PlaceholderCard } from "@/components/public/PlaceholderCard";
import { SEO } from "@/components/common/SEO";
import { ShieldCheck, Target, Award, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <SEO
        title="Giới Thiệu Học Viện ARIS"
        description="ARIS — Học viện đào tạo và khảo thí IELTS chuẩn học thuật. Sứ mệnh, tầm nhìn và giá trị cốt lõi."
      />

      <SectionContainer
        badge="Về Chúng Tôi"
        title="Học Viện Đào Tạo &amp; Khảo Thí ARIS"
        description="Được thành lập với mục tiêu chuẩn hóa phương pháp đào tạo IELTS học thuật, ARIS tập trung vào việc phát triển năng lực tư duy ngôn ngữ thực chất cho học viên."
        background="default"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-lg">Sứ Mệnh</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Trang bị cho học viên năng lực sử dụng tiếng Anh học thuật vững chắc, tư duy phản biện và khả năng thích ứng trong môi trường quốc tế.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-lg">Tầm Nhìn</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Trở thành biểu tượng đào tạo IELTS chuẩn mực về chất lượng khảo thí, phương pháp giảng dạy và công nghệ hỗ trợ học tập tại Việt Nam.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-border/80 bg-card space-y-3">
            <div className="p-2.5 rounded-xl bg-primary-soft text-primary w-fit">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-foreground text-lg">Giá Trị Cốt Lõi</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Tính chuẩn xác học thuật, sự tận tâm trong từng bài chấm chữa và tính trung thực trong việc cam kết đầu ra cho học viên.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
