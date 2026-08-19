import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { cn } from "@/lib/utils";
import { COURSE_CATALOG } from "@/constants/courses";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  ShieldCheck,
  Target,
  Brain,
  Users,
} from "lucide-react";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const course = COURSE_CATALOG[slug || "starter"] || COURSE_CATALOG.starter;

  return (
    <div className="flex flex-col">
      <SEO
        title={`${course.title} — Chi Tiết Khóa Học ARIS`}
        description={course.description}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courses")}
            className="gap-2 text-foreground/75 hover:text-foreground font-bold -ml-3 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách 5 khóa học</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-extrabold uppercase tracking-wider",
                course.theme.badgeBg,
                course.theme.badgeText,
                course.theme.badgeBorder
              )}
            >
              <Target className="h-4 w-4" />
              <span>{course.target}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted text-foreground border border-border text-xs sm:text-sm font-bold">
              <span>{course.rank}</span>
            </div>

            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-extrabold",
                course.theme.badgeBg,
                course.theme.badgeText,
                course.theme.badgeBorder
              )}
            >
              <span>Học phí: {course.tuition}</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
            {course.title}
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-foreground/85 font-normal leading-relaxed max-w-3xl">
            {course.description}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/assessment")}
              className="rounded-2xl px-8 h-14 font-extrabold text-base sm:text-lg bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm gap-2"
            >
              <span>Kiểm tra đầu vào cho khóa này</span>
              <ArrowRight className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="rounded-2xl px-8 h-14 font-bold text-base sm:text-lg border-2 border-border/80 hover:bg-muted text-foreground"
            >
              Liên hệ tư vấn xếp lớp
            </Button>
          </div>
        </div>
      </section>

      {/* Course Modules & Learning Details Section */}
      <SectionContainer
        badge="Nội Dung Học Tập"
        title="Chương trình đào tạo &amp; Chuẩn đầu ra"
        description="Mỗi học phần được thiết kế để giải quyết dứt điểm các lỗi sai thường gặp và giúp bạn tự tin nâng cấp bậc năng lực."
        background="muted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Syllabus Modules */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2.5 rounded-2xl", course.theme.iconBg, course.theme.iconText)}
              >
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-xl">Học Phần Trọng Tâm</h3>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground">Theo chuẩn The ARIS Way</p>
              </div>
            </div>

            <ul className="space-y-3.5 pt-2">
              {course.modules.map((mod, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span>{mod}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Outcomes */}
          <div className="p-8 rounded-3xl bg-card border border-border/80 space-y-5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2.5 rounded-2xl", course.theme.iconBg, course.theme.iconText)}
              >
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-black text-foreground text-xl">Chuẩn Đầu Ra Đạt Được</h3>
                <p className="text-xs sm:text-sm font-bold text-muted-foreground">{course.rank}</p>
              </div>
            </div>

            <ul className="space-y-3.5 pt-2">
              {course.outcomes.map((outcome, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionContainer>

      {/* Class Specifications */}
      <SectionContainer
        badge="Quy Chuẩn Lớp Học"
        title="Thời lượng &amp; Hình thức học tập"
        description="Đảm bảo sự tương tác tối đa giữa giảng viên và từng học viên trong lớp học."
        background="default"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div
              className={cn("p-2.5 rounded-2xl w-fit", course.theme.iconBg, course.theme.iconText)}
            >
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-lg">Sĩ Số Lớp Học</h3>
            <p className={cn("text-base font-extrabold", course.theme.badgeText)}>{course.classSize}</p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Giáo viên theo sát và sửa chữa chi tiết bài làm của từng bạn.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div
              className={cn("p-2.5 rounded-2xl w-fit", course.theme.iconBg, course.theme.iconText)}
            >
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-lg">Thời Lượng &amp; Lịch Học</h3>
            <p className={cn("text-base font-extrabold", course.theme.badgeText)}>{course.schedule}</p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Tổng thời lượng: {course.durationLabel}.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-card border border-border/80 space-y-3 shadow-2xs">
            <div
              className={cn("p-2.5 rounded-2xl w-fit", course.theme.iconBg, course.theme.iconText)}
            >
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-black text-foreground text-lg">Hệ Thống NextBand</h3>
            <p className={cn("text-base font-extrabold", course.theme.badgeText)}>Lưu vết bài nộp &amp; sửa bài</p>
            <p className="text-sm text-foreground/75 leading-relaxed">
              Nhận phản hồi 1:1 và làm lại bài sửa trực tiếp trên nền tảng.
            </p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}
