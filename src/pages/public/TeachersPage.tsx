import React from "react";
import { useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { TeacherShowcase } from "@/components/teachers/TeacherShowcase";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import {
  Award,
  ArrowRight,
} from "lucide-react";

export default function TeachersPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      <SEO
        title="Ban Học Thuật & Đội Ngũ Giảng Dạy — Học Viện ARIS"
        description="Đội ngũ giảng viên trực tiếp đứng lớp và chấm chữa bài tại ARIS. Tiêu chuẩn chuyên môn cao, không giao bài cho trợ giảng chấm đại trà."
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-soft text-brand-blue border border-brand-blue/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Award className="h-4 w-4" />
            <span>Ban Chuyên Môn ARIS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            Đội ngũ trực tiếp giảng dạy{" "}
            <span className="text-brand-blue block sm:inline">
              và chấm sửa từng câu.
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl mx-auto">
            Không giao bài cho trợ giảng chấm đại trà. Mọi bài viết và bài nói của bạn đều được theo sát và phản hồi chi tiết bởi các giảng viên có chuyên môn học thuật vững vàng.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/courses")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Xem chương trình học</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Đánh giá năng lực đầu vào
            </Button>
          </div>
        </div>
      </section>

      {/* Teacher Showcase: Master-Detail Bảng Điểm Đội Ngũ */}
      <TeacherShowcase />

      {/* Teaching Standards (4 Tiêu Chuẩn Giảng Dạy) */}
      <SectionContainer
        badge="Tiêu Chuẩn Giảng Dạy"
        title="4 Chuẩn mực đào tạo bắt buộc tại ARIS"
        description="Mọi hoạt động trên lớp và trên hệ thống NextBand đều được kiểm soát bởi quy trình sư phạm nghiêm ngặt."
        background="muted"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
              Tiêu chuẩn 01
            </div>
            <h3 className="font-black text-foreground text-xl">Chuẩn bị bài giảng</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Giáo án tập trung 100% vào bản chất ngôn ngữ và logic tư duy; tuyệt đối không đưa mẹo vặt hay văn mẫu học thuộc vào lớp học.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
              Tiêu chuẩn 02
            </div>
            <h3 className="font-black text-foreground text-xl">Phản hồi chi tiết</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Mỗi bài nộp đều được bóc tách từng câu văn, chỉ rõ cơ chế lỗi sai về ngữ pháp, dùng từ và hướng dẫn viết lại câu chuẩn xác.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-blue-soft text-brand-blue w-fit">
              Tiêu chuẩn 03
            </div>
            <h3 className="font-black text-foreground text-xl">Kiểm soát bài sửa</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Theo sát 100% việc làm lại bài sửa (Re-attempt) của học viên trên NextBand trước khi cho phép chuyển sang bài tập tiếp theo.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div className="text-xs font-mono font-black px-3 py-1 rounded-lg bg-brand-red-soft text-brand-red w-fit">
              Tiêu chuẩn 04
            </div>
            <h3 className="font-black text-foreground text-xl">Năng lực xác thực</h3>
            <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
              Giảng viên có chứng chỉ chuyên môn được xác minh, liên tục cập nhật xu hướng đề thi Cambridge và tiêu chuẩn khảo thí quốc tế.
            </p>
          </div>
        </div>
      </SectionContainer>

      {/* Final Action CTA */}
      <section className="py-20 sm:py-24 bg-brand-blue text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-extrabold uppercase tracking-wider">
            <Award className="h-4 w-4 text-brand-cyan" />
            <span>Đồng Hành Chuyên Môn</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Trải nghiệm phương pháp học cùng Ban Chuyên Môn ARIS.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
            Bắt đầu bằng việc làm bài đánh giá năng lực 45 phút để nhận phân tích chi tiết từ ban học thuật.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red text-white hover:bg-brand-red-hover shadow-md border-0 gap-2.5"
            >
              <span>Làm bài kiểm tra năng lực ngay</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
