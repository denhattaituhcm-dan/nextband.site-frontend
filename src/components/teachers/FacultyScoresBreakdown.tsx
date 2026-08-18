import React from "react";
import { TeacherScores } from "@/data/teachers";
import { cn } from "@/lib/utils";

interface FacultyScoresBreakdownProps {
  scores: TeacherScores;
  className?: string;
}

export function FacultyScoresBreakdown({
  scores,
  className,
}: FacultyScoresBreakdownProps) {
  const skillItems = [
    { label: "LISTENING", value: scores.listening },
    { label: "READING", value: scores.reading },
    { label: "WRITING", value: scores.writing ?? "—" },
    { label: "SPEAKING", value: scores.speaking ?? "—" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-mono font-black text-muted-foreground uppercase tracking-wider">
          Verified IELTS Results
        </h4>
        <span className="text-xs font-mono font-bold text-brand-blue uppercase tracking-wider">
          {scores.testType} Module
        </span>
      </div>

      {/* 4-Skill Boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {skillItems.map((skill) => (
          <div
            key={skill.label}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/80 shadow-2xs text-center"
          >
            <span className="text-[11px] sm:text-xs font-mono font-bold text-muted-foreground tracking-wider">
              {skill.label}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-foreground mt-0.5 tracking-tight">
              {typeof skill.value === "number" ? skill.value.toFixed(1) : skill.value}
            </span>
          </div>
        ))}
      </div>

      {/* Overall Band Banner */}
      <div className="flex items-center justify-center py-2.5 px-4 rounded-xl bg-brand-blue/5 border border-brand-blue/20 text-center">
        <p className="text-xs sm:text-sm font-extrabold text-foreground tracking-wide">
          OVERALL{" "}
          <span className="text-brand-blue font-black text-sm sm:text-base">
            {scores.overall.toFixed(1)}
          </span>{" "}
          — IELTS {scores.testType.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
