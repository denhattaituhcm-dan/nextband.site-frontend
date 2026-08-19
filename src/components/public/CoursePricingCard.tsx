import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseData } from "@/constants/courses";

interface CoursePricingCardProps {
  course: CourseData;
  onTrialClick: (slug: string) => void;
  onDetailClick: (slug: string) => void;
  className?: string;
}

export function CoursePricingCard({
  course,
  onTrialClick,
  onDetailClick,
  className,
}: CoursePricingCardProps) {
  const { theme } = course;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-2xs hover:shadow-md transition-all duration-200",
        theme?.borderHover || "hover:border-primary/50",
        theme?.shadowHover,
        className
      )}
    >
      <div className="space-y-4">
        {/* Top bar: Stage Badge & Icon */}
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border",
              cn(theme.badgeBg, theme.badgeText, theme.badgeBorder)
            )}
          >
            {course.stageNumber}
          </span>

          <div
            className={cn(
              "p-2.5 rounded-2xl",
              cn(theme.iconBg, theme.iconText)
            )}
          >
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Target & Title */}
        <div className="space-y-1.5">
          <p
            className={cn(
              "text-xs sm:text-sm font-bold uppercase tracking-wider",
              theme.badgeText
            )}
          >
            {course.target}
          </p>
          <h3
            className={cn(
              "text-2xl font-black text-foreground tracking-tight transition-colors",
              theme.titleHover
            )}
          >
            {course.title}
          </h3>
        </div>

        {/* Short Description */}
        <p className="text-sm sm:text-base text-foreground/75 leading-relaxed min-h-[48px]">
          {course.description}
        </p>

        {/* Specifications: Duration & Class size */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 text-foreground border border-border/60">
            <span>⏱</span>
            <span>{course.durationLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 text-foreground border border-border/60">
            <span>👥</span>
            <span>{course.classSize}</span>
          </span>
        </div>

        {/* Pricing Block */}
        <div
          className={cn(
            "mt-4 p-4 rounded-2xl border transition-colors space-y-2.5",
            theme.badgeBg,
            theme.badgeBorder
          )}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {course.tuition}
            </span>
            <span className="text-xs sm:text-sm font-bold text-muted-foreground">
              / trọn khóa
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-border/50 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold text-foreground/90">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>100% GV IELTS 8.0+ trực tiếp dạy</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-foreground/90">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Học thử 02 buổi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-6 mt-4 space-y-2 border-t border-border/50">
        <Button
          onClick={() => onTrialClick(course.slug)}
          className="w-full h-11 font-extrabold text-sm rounded-xl bg-brand-red hover:bg-brand-red-hover text-brand-red-foreground shadow-sm transition-all"
        >
          Nhận lịch học thử
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDetailClick(course.slug)}
          className={cn(
            "w-full justify-between px-3 text-sm font-bold text-foreground rounded-xl group/btn h-10 transition-colors",
            theme.buttonHover
          )}
        >
          <span>Xem chi tiết khóa học</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
