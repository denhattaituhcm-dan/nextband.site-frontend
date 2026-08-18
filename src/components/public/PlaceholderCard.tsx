import React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, BookOpen, User, Award, Briefcase, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PlaceholderCardVariant =
  | "feature"
  | "course"
  | "teacher"
  | "result"
  | "job"
  | "article";

export interface PlaceholderCardTheme {
  badgeBg?: string;
  badgeText?: string;
  badgeBorder?: string;
  iconBg?: string;
  iconText?: string;
  borderHover?: string;
  titleHover?: string;
  shadowHover?: string;
  buttonHover?: string;
}

interface PlaceholderCardProps {
  variant?: PlaceholderCardVariant;
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: string[];
  ctaLabel?: string;
  onCtaClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  theme?: PlaceholderCardTheme;
  badgeClassName?: string;
  iconClassName?: string;
  subtitleClassName?: string;
}

export function PlaceholderCard({
  variant = "feature",
  badge,
  title,
  subtitle,
  description,
  metadata = [],
  ctaLabel,
  onCtaClick,
  icon,
  className,
  theme,
  badgeClassName,
  iconClassName,
  subtitleClassName,
}: PlaceholderCardProps) {
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
        {/* Top bar: Badge & Icon */}
        <div className="flex items-center justify-between gap-3">
          {badge ? (
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border",
                theme
                  ? cn(theme.badgeBg, theme.badgeText, theme.badgeBorder)
                  : "bg-primary-soft text-primary border-primary/20",
                badgeClassName
              )}
            >
              {badge}
            </span>
          ) : (
            <span />
          )}

          {icon ? (
            <div
              className={cn(
                "p-2.5 rounded-2xl",
                theme
                  ? cn(theme.iconBg, theme.iconText)
                  : "bg-primary-soft text-primary",
                iconClassName
              )}
            >
              {icon}
            </div>
          ) : variant === "course" ? (
            <div
              className={cn(
                "p-2.5 rounded-2xl",
                theme
                  ? cn(theme.iconBg, theme.iconText)
                  : "bg-primary-soft text-primary",
                iconClassName
              )}
            >
              <BookOpen className="h-5 w-5" />
            </div>
          ) : variant === "teacher" ? (
            <div className="p-2.5 rounded-2xl bg-primary-soft text-primary">
              <User className="h-5 w-5" />
            </div>
          ) : variant === "result" ? (
            <div className="p-2.5 rounded-2xl bg-accent-soft text-accent">
              <Award className="h-5 w-5" />
            </div>
          ) : variant === "job" ? (
            <div className="p-2.5 rounded-2xl bg-info/10 text-info">
              <Briefcase className="h-5 w-5" />
            </div>
          ) : variant === "article" ? (
            <div className="p-2.5 rounded-2xl bg-muted text-muted-foreground">
              <FileText className="h-5 w-5" />
            </div>
          ) : null}
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          {subtitle && (
            <p
              className={cn(
                "text-xs sm:text-sm font-bold uppercase tracking-wider",
                theme?.badgeText || "text-primary",
                subtitleClassName
              )}
            >
              {subtitle}
            </p>
          )}
          <h3
            className={cn(
              "text-xl sm:text-2xl font-black text-foreground tracking-tight transition-colors",
              theme?.titleHover || "group-hover:text-primary"
            )}
          >
            {title}
          </h3>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm sm:text-base text-foreground/75 leading-relaxed">
            {description}
          </p>
        )}

        {/* Metadata items */}
        {metadata.length > 0 && (
          <div className="pt-3 flex flex-wrap gap-2.5 border-t border-border/60">
            {metadata.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground/80 font-bold"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button / Link */}
      {ctaLabel && (
        <div className="pt-6 mt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCtaClick}
            className={cn(
              "w-full justify-between px-3 text-sm font-bold text-foreground rounded-xl group/btn h-10 transition-colors",
              theme?.buttonHover || "hover:text-primary hover:bg-primary-soft/50"
            )}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
