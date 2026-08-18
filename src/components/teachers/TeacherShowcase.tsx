import React, { useState } from "react";
import { teachers, Teacher } from "@/data/teachers";
import { ExecutiveFacultyProfile } from "./ExecutiveFacultyProfile";
import { TeacherCard } from "./TeacherCard";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeacherShowcase() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id ?? ""
  );
  const [activeSpecialty, setActiveSpecialty] = useState<string>("Tất cả");
  const [modalTeacher, setModalTeacher] = useState<Teacher | null>(null);

  const selectedTeacher =
    teachers.find((t) => t.id === selectedTeacherId) ?? teachers[0];

  const count = teachers.length;

  // Extract all unique specialties for filtering (when 6+ teachers)
  const allSpecialties = [
    "Tất cả",
    ...Array.from(new Set(teachers.flatMap((t) => t.specialties || []))),
  ];

  const filteredTeachers =
    activeSpecialty === "Tất cả"
      ? teachers
      : teachers.filter((t) => t.specialties?.includes(activeSpecialty));

  return (
    <SectionContainer
      id="academic-team"
      badge="Ban Học Thuật ARIS"
      title="Đội ngũ Học thuật & Bảng điểm Thực tế"
      description="100% giảng viên tại ARIS công khai minh bạch bằng cấp và bảng điểm IELTS Test Report Form chính thức."
      background="default"
    >
      {/* ========================================================================= */}
      {/* MODE 1: EXECUTIVE FACULTY PROFILE (1 - 2 Teachers)                        */}
      {/* ========================================================================= */}
      {count <= 2 && (
        <div className="space-y-6">
          {/* If exactly 2 teachers, provide clean faculty selector tabs */}
          {count === 2 && (
            <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
              {teachers.map((t) => {
                const isActive = t.id === selectedTeacher?.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold border transition-all text-center",
                      isActive
                        ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}

          {selectedTeacher && (
            <ExecutiveFacultyProfile teacher={selectedTeacher} />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FACULTY SHOWCASE (3 - 5 Teachers)                                 */}
      {/* ========================================================================= */}
      {count >= 3 && count <= 5 && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {/* Top Horizontal Faculty Selector Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {teachers.map((t) => {
              const isActive = t.id === selectedTeacher?.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeacherId(t.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 pr-4 rounded-2xl border transition-all text-left",
                    isActive
                      ? "bg-card border-brand-blue ring-2 ring-brand-blue/20 shadow-sm"
                      : "bg-card/70 border-border hover:border-brand-blue/40 text-muted-foreground"
                  )}
                >
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-xl object-cover bg-muted"
                  />
                  <div>
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-black line-clamp-1",
                        isActive ? "text-brand-blue" : "text-foreground"
                      )}
                    >
                      {t.name}
                    </p>
                    <span className="text-[11px] font-mono font-bold text-brand-red">
                      IELTS {t.scores?.overall ?? t.ielts.overall}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Profile Rendered Full Width */}
          {selectedTeacher && (
            <ExecutiveFacultyProfile teacher={selectedTeacher} />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: FACULTY GRID & ROSTER (6+ Teachers)                               */}
      {/* ========================================================================= */}
      {count >= 6 && (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Specialty Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-mono font-bold text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" />
              Lọc theo:
            </span>
            {allSpecialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setActiveSpecialty(spec)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                  activeSpecialty === spec
                    ? "bg-brand-blue text-white border-brand-blue shadow-2xs"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Grid of Teachers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredTeachers.map((t) => (
              <TeacherCard
                key={t.id}
                teacher={t}
                selected={false}
                onSelect={() => setModalTeacher(t)}
              />
            ))}
          </div>

          {/* Modal to view full Executive Profile when clicked in 6+ mode */}
          <Dialog
            open={!!modalTeacher}
            onOpenChange={(open) => !open && setModalTeacher(null)}
          >
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-background border-border/80 rounded-3xl">
              {modalTeacher && (
                <ExecutiveFacultyProfile teacher={modalTeacher} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </SectionContainer>
  );
}

