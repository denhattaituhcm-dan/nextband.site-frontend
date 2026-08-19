import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/common/SEO";
import { cn } from "@/lib/utils";
import { COURSE_CATALOG } from "@/constants/courses";
import { QuickTrialModal } from "@/components/public/QuickTrialModal";
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
  Award,
  Phone,
  FileText,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [trialModalOpen, setTrialModalOpen] = useState(false);

  const courseKey = slug && COURSE_CATALOG[slug] ? slug : "starter";
  const course = COURSE_CATALOG[courseKey];

  return (
    <div className="flex flex-col">
      <SEO
        title={`${course.title} — Chi Tiết Khóa Học ARIS`}
        description={`${course.title}: ${course.target}. Học phí ${course.tuition} trọn khóa, lớp tối đa 8 học viên, 100% giáo viên 8.0+ trực tiếp giảng dạy.`}
      />

      {/* Breadcrumb & Hero Header */}
      <section className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-border/80 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6 text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/courses")}
            className="gap-2 text-foreground/75 hover:text-foreground font-bold -ml-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách 5 khóa học</span>
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-extrabold uppercase tracking-wider",
                course.theme.badgeBg,
                course.theme.badgeText,
                course.theme.badgeBorder
              )}
            >
              <Target className="h-4 w-4" />
              <span>{course.target}</span>
            </span>

            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted text-foreground border border-border text-xs sm:text-sm font-bold">
              <span>{course.rank}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-extrabold",
                course.theme.badgeBg,
                course.theme.badgeText,
                course.theme.badgeBorder
              )}
            >
              <span>Học phí: {course.tuition}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-foreground/85 font-normal leading-relaxed max-w-3xl">
            {course.description}
          </p>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
            
            {/* Left Column: Course Depth Content (Col 1-7) */}
            <div className="lg:col-span-7 space-y-10 text-left">
              
              {/* 1. Học phần trọng tâm */}
              <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className={cn("p-2.5 rounded-2xl", course.theme.iconBg, course.theme.iconText)}>
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-foreground text-xl sm:text-2xl tracking-tight">
                      Học Phần Trọng Tâm ({course.durationHours})
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                      Thiết kế bài bản theo chuẩn The ARIS Way
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {course.modules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-start gap-3.5"
                    >
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black", course.theme.badgeBg, course.theme.badgeText)}>
                        0{idx + 1}
                      </span>
                      <p className="text-sm sm:text-base text-foreground/90 font-medium leading-relaxed">
                        {mod}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Chuẩn đầu ra */}
              <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className={cn("p-2.5 rounded-2xl", course.theme.iconBg, course.theme.iconText)}>
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-foreground text-xl sm:text-2xl tracking-tight">
                      Chuẩn Đầu Ra Cam Kết
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                      Mục tiêu đạt được sau khi hoàn thành khóa
                    </p>
                  </div>
                </div>

                <ul className="space-y-3.5">
                  {course.outcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85 font-medium leading-relaxed">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. Quy chuẩn lớp học & Hình thức đào tạo */}
              <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                  <div className={cn("p-2.5 rounded-2xl", course.theme.iconBg, course.theme.iconText)}>
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-black text-foreground text-xl sm:text-2xl tracking-tight">
                      Quy Chuẩn Đào Tạo Tại ARIS
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                      Không nhồi nhét, tập trung chất lượng
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-foreground text-sm">
                      <Users className="w-4 h-4 text-brand-blue" />
                      <span>Sĩ số tối đa 08 học viên</span>
                    </div>
                    <p className="text-xs text-foreground/75 leading-relaxed">
                      Đảm bảo giảng viên sửa từng lỗi phát âm và từng bài viết cho từng bạn.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-foreground text-sm">
                      <Clock className="w-4 h-4 text-brand-blue" />
                      <span>{course.schedule}</span>
                    </div>
                    <p className="text-xs text-foreground/75 leading-relaxed">
                      Tổng thời lượng {course.durationLabel} học trực tiếp cùng giảng viên.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-foreground text-sm">
                      <Brain className="w-4 h-4 text-brand-blue" />
                      <span>NextBand LMS & Chấm bài</span>
                    </div>
                    <p className="text-xs text-foreground/75 leading-relaxed">
                      Lưu vết tiến độ, nhận xét chi tiết 1-1 theo chuẩn tiêu chí chấm IELTS.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-foreground text-sm">
                      <FileText className="w-4 h-4 text-brand-blue" />
                      <span>Mock Test Chuẩn Phòng Thi</span>
                    </div>
                    <p className="text-xs text-foreground/75 leading-relaxed">
                      Làm quen với áp lực thời gian và đánh giá band điểm thực tế.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. FAQ nhanh */}
              <div className="p-7 sm:p-8 rounded-3xl bg-card border border-border/80 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 text-foreground font-black text-lg">
                  <HelpCircle className="w-5 h-5 text-brand-blue" />
                  <span>Câu Hỏi Thường Gặp Về Khóa Học</span>
                </div>
                <div className="space-y-3 pt-2 text-sm">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <p className="font-bold text-foreground">Học thử 02 buổi có phải đóng phí gì trước không?</p>
                    <p className="text-foreground/75">Không. Bạn được tham gia học thử 02 buổi đầu hoàn toàn miễn phí để trải nghiệm lớp học và phương pháp trước khi đóng học phí.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <p className="font-bold text-foreground">Ai là người trực tiếp giảng dạy?</p>
                    <p className="text-foreground/75">100% các buổi học do các giáo viên có chứng chỉ IELTS 8.0+ công khai trực tiếp đứng lớp và chấm chữa bài.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Summary Pricing Card (Col 8-12) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 text-left">
              <div className={cn(
                "p-7 sm:p-8 rounded-3xl bg-card border-2 shadow-lg space-y-6 transition-all",
                course.theme.borderHover || "border-primary/40"
              )}>
                {/* Header of summary card */}
                <div className="space-y-2 pb-4 border-b border-border/70">
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border",
                    course.theme.badgeBg,
                    course.theme.badgeText,
                    course.theme.badgeBorder
                  )}>
                    {course.stageNumber} — {course.name}
                  </span>
                  
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                      {course.tuition}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground">
                      Trọn khóa · {course.durationLabel}
                    </p>
                  </div>
                </div>

                {/* Inclusions list */}
                <div className="space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-foreground/80">
                    Bao gồm trọn gói:
                  </p>
                  <ul className="space-y-2.5">
                    {course.inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/85 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trial guarantee badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-foreground/85 font-bold">
                    Được trải nghiệm 02 buổi học thử trước khi chính thức hoàn tất học phí.
                  </p>
                </div>

                {/* CTAs */}
                <div className="space-y-2.5 pt-2">
                  <Button
                    size="lg"
                    onClick={() => setTrialModalOpen(true)}
                    className="w-full h-12 rounded-xl font-extrabold text-base bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-md gap-2"
                  >
                    <span>Nhận lịch học thử</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate("/assessment")}
                    className="w-full h-11 rounded-xl font-bold text-sm border-2 border-border/80 hover:bg-muted text-foreground"
                  >
                    Kiểm tra đầu vào cho khóa này
                  </Button>
                </div>

                {/* Footer contact info */}
                <div className="pt-3 border-t border-border/60 text-center space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hotline: <a href="tel:0933319693" className="font-bold text-foreground hover:underline">0933.319.693</a></span>
                  </div>
                  <p>Cơ sở: 68B Phan Bội Châu, P. Dĩ An, TP. Dĩ An</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quick Trial Booking Modal */}
      <QuickTrialModal
        isOpen={trialModalOpen}
        onOpenChange={setTrialModalOpen}
        initialCourseSlug={course.slug}
      />
    </div>
  );
}
