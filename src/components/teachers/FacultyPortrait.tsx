import React from "react";
import { Teacher } from "@/data/teachers";
import { cn } from "@/lib/utils";

interface FacultyPortraitProps {
  teacher: Teacher;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FacultyPortrait({
  teacher,
  className,
  size = "lg",
}: FacultyPortraitProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden border border-border/90 bg-gradient-to-b from-muted/50 to-muted/20 flex flex-col items-center justify-between p-3.5 shadow-2xs group",
        size === "lg" ? "w-full max-w-[280px] aspect-[3/4]" : "w-full aspect-[3/4]",
        className
      )}
    >
      {/* Subtle Studio Backdrop Accent */}
      <div className="absolute inset-0 bg-radial from-brand-blue/5 via-transparent to-transparent pointer-events-none" />

      {/* Teacher Name Tag (Top) */}
      <div className="relative z-10 w-full text-center pt-1 pb-2">
        <span className="text-xs font-mono font-black uppercase tracking-wider text-muted-foreground">
          ARIS Academic Faculty
        </span>
      </div>

      {/* Avatar Container */}
      <div className="relative z-10 flex-1 w-full flex items-center justify-center overflow-hidden my-1">
        <img
          src={teacher.avatar}
          alt={teacher.name}
          loading="lazy"
          className="w-full h-full object-contain object-bottom drop-shadow-sm transition-transform duration-300 group-hover:scale-102"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>

      {/* Primary Credential Pill (Bottom) */}
      <div className="relative z-10 w-full pt-2">
        <div className="w-full py-1.5 px-3 rounded-xl bg-card border border-brand-red/30 text-center shadow-xs">
          <p className="text-xs font-mono font-black text-brand-red tracking-wider">
            IELTS {teacher.scores.overall.toFixed(1)} {teacher.scores.testType.toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
