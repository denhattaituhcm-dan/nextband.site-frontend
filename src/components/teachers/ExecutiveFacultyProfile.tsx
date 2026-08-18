import React from "react";
import { Teacher } from "@/data/teachers";
import { FacultyPortrait } from "./FacultyPortrait";
import { FacultyScoresBreakdown } from "./FacultyScoresBreakdown";
import { FacultyCredentialsMatrix } from "./FacultyCredentialsMatrix";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveFacultyProfileProps {
  teacher: Teacher;
  className?: string;
}

export function ExecutiveFacultyProfile({
  teacher,
  className,
}: ExecutiveFacultyProfileProps) {
  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 space-y-8 sm:space-y-10 shadow-xs",
        className
      )}
    >
      {/* ========================================================================= */}
      {/* LAYER 1: WHO IS THIS PERSON? (Identity & Academic Leadership)            */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 pb-8 border-b border-border/60">
        {/* Left: Studio Portrait System */}
        <div className="shrink-0 flex justify-center w-full md:w-auto">
          <FacultyPortrait teacher={teacher} size="lg" />
        </div>

        {/* Right: Academic Identity & Responsibilities */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ARIS Academic Directorate</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
              {teacher.name}
            </h2>

            <p className="text-sm sm:text-base font-bold text-brand-blue">
              {teacher.role}
            </p>
          </div>

          {/* Objective Statement of Academic Responsibility */}
          {teacher.roleSummary && (
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-2xl">
              {teacher.roleSummary}
            </p>
          )}

          {/* Specialization Areas */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono font-black text-muted-foreground uppercase tracking-wider block">
              Trọng tâm Chuyên môn
            </span>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {teacher.specialties.map((spec) => (
                <span
                  key={spec}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-muted/60 text-foreground/90 border border-border/70 shadow-2xs"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: VERIFIED RESULTS (Subscore Breakdown)                           */}
      {/* ========================================================================= */}
      <div className="pb-8 border-b border-border/60">
        <FacultyScoresBreakdown scores={teacher.scores} />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: CREDENTIALS & EXPERIENCE (4-Column Academic Matrix)             */}
      {/* ========================================================================= */}
      <div>
        <FacultyCredentialsMatrix credentials={teacher.credentials} />
      </div>
    </div>
  );
}
