import React from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  id?: string;
  className?: string;
  badge?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  align?: "left" | "center";
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  background?: "default" | "muted" | "elevated";
}

export function SectionContainer({
  id,
  className,
  badge,
  title,
  description,
  children,
  align = "center",
  containerSize = "lg",
  background = "default",
}: SectionContainerProps) {
  const maxWClass = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-[1400px]",
    full: "max-w-full",
  }[containerSize];

  const bgClass = {
    default: "bg-background",
    muted: "bg-muted/30 border-y border-border/50",
    elevated: "bg-card border-y border-border/60 shadow-2xs",
  }[background];

  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-24", bgClass, className)}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", maxWClass)}>
        {(badge || title || description) && (
          <div
            className={cn(
              "space-y-4 mb-12 sm:mb-16",
              align === "center" ? "text-center mx-auto max-w-4xl" : "text-left max-w-4xl"
            )}
          >
            {badge && (
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider",
                  "bg-primary-soft text-primary border border-primary/20",
                  align === "center" ? "mx-auto" : ""
                )}
              >
                {badge}
              </div>
            )}
            {title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-base sm:text-lg lg:text-xl text-foreground/80 font-normal leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
