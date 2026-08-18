import React, { useState } from "react";
import { Teacher } from "@/data/teachers";
import { FacultyPortrait } from "./FacultyPortrait";
import { FacultyCredentialsMatrix } from "./FacultyCredentialsMatrix";
import { TeacherCertificateModal } from "./TeacherCertificateModal";
import { Button } from "@/components/ui/button";
import { Maximize2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveFacultyProfileProps {
  teacher: Teacher;
  className?: string;
}

export function ExecutiveFacultyProfile({
  teacher,
  className,
}: ExecutiveFacultyProfileProps) {
  const [isTrfModalOpen, setIsTrfModalOpen] = useState(false);

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
      {/* LAYER 2: CREDENTIALS & EXPERIENCE (4-Column Academic Matrix)             */}
      {/* ========================================================================= */}
      <div className={teacher.certificate ? "pb-8 border-b border-border/60" : ""}>
        <FacultyCredentialsMatrix credentials={teacher.credentials} />
      </div>

      {/* ========================================================================= */}
      {/* LAYER 3: PROVE IT (Original TRF Document Verification Frame)              */}
      {/* ========================================================================= */}
      {teacher.certificate && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h4 className="text-xs font-mono font-black text-foreground uppercase tracking-wider">
                  Bảng điểm gốc IELTS Test Report Form (TRF)
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bản scan chính thức đối soát từ Hội đồng Khảo thí quốc tế
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTrfModalOpen(true)}
              className="font-bold text-xs gap-1.5 h-8 rounded-xl border-border hover:border-brand-blue text-foreground hover:text-brand-blue shadow-2xs self-start sm:self-auto"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Xem bản gốc đầy đủ (A4)</span>
            </Button>
          </div>

          {/* TRF Scan Frame Preview */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsTrfModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsTrfModalOpen(true);
              }
            }}
            className="group relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 cursor-pointer aspect-[16/10] sm:aspect-[21/9] flex items-center justify-center transition-all hover:border-brand-blue hover:shadow-xs"
          >
            <img
              src={teacher.certificate.image}
              alt={teacher.certificate.alt}
              loading="lazy"
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-101"
            />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-bold backdrop-blur-[1px]">
              <Maximize2 className="h-4 w-4" />
              <span>Phóng to Bảng điểm TRF chính thức</span>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <TeacherCertificateModal
        isOpen={isTrfModalOpen}
        onClose={() => setIsTrfModalOpen(false)}
        certificate={teacher.certificate}
        teacherName={teacher.name}
      />
    </div>
  );
}
