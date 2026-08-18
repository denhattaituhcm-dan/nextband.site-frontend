import React from "react";
import { Teacher } from "@/data/teachers";
import { cn } from "@/lib/utils";

interface TeacherCardProps {
  teacher: Teacher;
  selected: boolean;
  onSelect: () => void;
}

export function TeacherCard({ teacher, selected, onSelect }: TeacherCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative aspect-[140/195] bg-card rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between border cursor-pointer transition-all duration-200 select-none group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-blue",
        selected
          ? "border-brand-red ring-2 ring-brand-red/30 shadow-md bg-card"
          : "border-border/80 hover:border-brand-blue/50 hover:shadow-xs bg-card/80"
      )}
    >
      {/* Teacher Name */}
      <p
        className={cn(
          "text-xs sm:text-sm font-black text-center line-clamp-1 duration-200",
          selected ? "text-brand-red" : "text-foreground group-hover:text-brand-blue"
        )}
      >
        {teacher.name}
      </p>

      {/* Avatar Container */}
      <div className="relative aspect-square w-full max-w-[130px] rounded-xl overflow-hidden bg-muted/40 border border-border/40 my-1">
        <img
          src={teacher.avatar}
          alt={teacher.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback placeholder if image missing
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>

      {/* IELTS Score Badge */}
      <div className="w-full transition-transform duration-200 group-hover:-translate-y-1">
        <div
          className={cn(
            "p-1 sm:p-1.5 rounded-xl border flex flex-col items-center justify-center text-center shadow-2xs",
            selected
              ? "bg-brand-red text-white border-brand-red"
              : teacher.ielts.overall >= 8.5
              ? "bg-brand-red text-white border-brand-red"
              : "bg-brand-blue text-white border-brand-blue"
          )}
        >
          <span className="text-xs sm:text-sm font-black tracking-tight leading-none">
            IELTS {teacher.ielts.overall.toFixed(1)}
          </span>
          {teacher.ielts.highlight && (
            <span className="text-[10px] sm:text-[11px] font-bold opacity-90 leading-tight mt-0.5">
              {teacher.ielts.highlight.label} {teacher.ielts.highlight.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
