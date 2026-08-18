import React, { useState } from "react";
import { teachers, Teacher } from "@/data/teachers";
import { TeacherCard } from "./TeacherCard";
import { TeacherDetail } from "./TeacherDetail";
import { SectionContainer } from "@/components/public/SectionContainer";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export function TeacherShowcase() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id ?? ""
  );
  const [activeSpecialty, setActiveSpecialty] = useState<string>("Tất cả");

  const selectedTeacher =
    teachers.find((t) => t.id === selectedTeacherId) ?? teachers[0];

  // Extract all unique specialties for filtering (when > 1 unique specialty)
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grid of Teachers + Filter (Click to inspect) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Specialty Filter Pills */}
          {allSpecialties.length > 2 && (
            <div className="flex flex-wrap items-center gap-2">
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
          )}

          {/* Grid of Teacher Avatar Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredTeachers.map((t) => (
              <TeacherCard
                key={t.id}
                teacher={t}
                selected={t.id === selectedTeacher?.id}
                onSelect={() => setSelectedTeacherId(t.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Active Teacher Credentials & Full TRF (Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          {selectedTeacher ? (
            <TeacherDetail teacher={selectedTeacher} />
          ) : (
            <div className="p-8 rounded-3xl bg-card border border-border/80 text-center text-muted-foreground">
              Chọn giảng viên bên trái để xem bảng điểm và thông tin chi tiết.
            </div>
          )}
        </div>
      </div>
    </SectionContainer>
  );
}


