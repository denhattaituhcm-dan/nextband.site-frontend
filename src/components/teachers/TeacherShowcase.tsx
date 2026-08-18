import React, { useState, useRef } from "react";
import { teachers } from "@/data/teachers";
import { TeacherCard } from "./TeacherCard";
import { TeacherDetail } from "./TeacherDetail";
import { SectionContainer } from "@/components/public/SectionContainer";

export function TeacherShowcase() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id ?? ""
  );

  const detailRef = useRef<HTMLDivElement>(null);

  const selectedTeacher =
    teachers.find((t) => t.id === selectedTeacherId) ?? teachers[0];

  const handleSelectTeacher = (id: string) => {
    setSelectedTeacherId(id);

    // On mobile / tablet, scroll smoothly to the detail panel
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  };

  return (
    <SectionContainer
      id="academic-team"
      badge="Bảng Điểm Đội Ngũ"
      title="Đội ngũ Học thuật & Bảng điểm thực tế"
      description="100% giảng viên tại ARIS công khai minh bạch bằng cấp và bảng điểm IELTS Test Report Form chính thức."
      background="default"
    >
      <div className="bg-[#EBF4FE] dark:bg-muted/30 rounded-3xl p-4 sm:p-6 lg:p-8 border border-brand-blue/15 shadow-xs">
        <div className="text-center mb-6">
          <p className="text-xs sm:text-sm font-bold text-muted-foreground">
            (Bấm vào từng thẻ giáo viên để xem chi tiết năng lực và bảng điểm thi)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Master: Teacher Cards Grid (Columns 1 to 7 on desktop ~ 60%) */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  selected={selectedTeacher?.id === teacher.id}
                  onSelect={() => handleSelectTeacher(teacher.id)}
                />
              ))}
            </div>
          </div>

          {/* Detail: Teacher Detail Panel (Columns 8 to 12 on desktop ~ 40%) */}
          <div
            ref={detailRef}
            className="lg:col-span-5 xl:col-span-5 scroll-mt-24"
          >
            {selectedTeacher && <TeacherDetail teacher={selectedTeacher} />}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
