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
}: PlaceholderCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-card border border-border/70 hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="space-y-4">
        {/* Top bar: Badge & Icon */}
        <div className="flex items-center justify-between gap-3">
          {badge ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
              {badge}
            </span>
          ) : (
            <span />
          )}

          {icon ? (
            <div className="p-2 rounded-xl bg-primary-soft text-primary">
              {icon}
            </div>
          ) : variant === "course" ? (
            <div className="p-2 rounded-xl bg-primary-soft text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          ) : variant === "teacher" ? (
            <div className="p-2 rounded-xl bg-primary-soft text-primary">
              <User className="h-4 w-4" />
            </div>
          ) : variant === "result" ? (
            <div className="p-2 rounded-xl bg-accent-soft text-accent">
              <Award className="h-4 w-4" />
            </div>
          ) : variant === "job" ? (
            <div className="p-2 rounded-xl bg-info/10 text-info">
              <Briefcase className="h-4 w-4" />
            </div>
          ) : variant === "article" ? (
            <div className="p-2 rounded-xl bg-muted text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
          ) : null}
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          {subtitle && (
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              {subtitle}
            </p>
          )}
          <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}

        {/* Metadata items */}
        {metadata.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2 border-t border-border/50">
            {metadata.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium"
              >
                <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                <span>{item}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CTA Button / Link */}
      {ctaLabel && (
        <div className="pt-6 mt-4 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCtaClick}
            className="w-full justify-between px-3 text-xs font-bold text-foreground hover:text-primary hover:bg-primary-soft/50 rounded-xl group/btn"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
