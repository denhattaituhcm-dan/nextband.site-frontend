import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { facultyService, INITIAL_FACULTY_SEED } from "@/lib/facultyService";
import { TeacherCard } from "./TeacherCard";
import { TeacherDetail } from "./TeacherDetail";
import { SectionContainer } from "@/components/public/SectionContainer";

export function TeacherShowcase() {
  const { data: facultyList = [INITIAL_FACULTY_SEED], isLoading } = useQuery({
    queryKey: ["public-faculty-profiles"],
    queryFn: () => facultyService.getPublicFaculty(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  useEffect(() => {
    if (facultyList.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(facultyList[0].id);
    } else if (facultyList.length > 0 && !facultyList.some((f) => f.id === selectedTeacherId)) {
      setSelectedTeacherId(facultyList[0].id);
    }
  }, [facultyList, selectedTeacherId]);

  const activeTeacher =
    facultyList.find((t) => t.id === selectedTeacherId) || facultyList[0] || INITIAL_FACULTY_SEED;

  return (
    <SectionContainer
      id="academic-team"
      badge="Ban Học Thuật ARIS"
      title="Đội ngũ Học thuật & Bảng điểm Thực tế"
      description="100% giảng viên tại ARIS công khai minh bạch bằng cấp và bảng điểm IELTS Test Report Form chính thức."
      background="default"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grid of Teachers (Click to inspect) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Grid of Teacher Avatar Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
            {facultyList.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                selected={teacher.id === activeTeacher?.id}
                onSelect={() => setSelectedTeacherId(teacher.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Active Teacher Credentials & Full TRF (Sticky) */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          {activeTeacher ? (
            <TeacherDetail teacher={activeTeacher} />
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
