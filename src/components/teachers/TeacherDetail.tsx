import React, { useState } from "react";
import { Teacher, TeacherAchievementType } from "@/data/teachers";
import { TeacherCertificateModal } from "./TeacherCertificateModal";
import { Button } from "@/components/ui/button";
import {
  Award,
  GraduationCap,
  Clock,
  BookOpen,
  ShieldCheck,
  Maximize2,
  ExternalLink,
} from "lucide-react";

interface TeacherDetailProps {
  teacher: Teacher;
}

const iconMap: Record<TeacherAchievementType, React.ComponentType<{ className?: string }>> = {
  achievement: Award,
  education: GraduationCap,
  experience: Clock,
  expertise: BookOpen,
  verification: ShieldCheck,
};

export function TeacherDetail({ teacher }: TeacherDetailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm flex flex-col justify-between">
      <div className="space-y-5">
        {/* Header: Teacher Name & Role */}
        <div className="space-y-2 border-b border-border/60 pb-4">
          <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {teacher.name}
          </h3>
          <p className="text-sm font-bold text-brand-blue">
            {teacher.role}
          </p>
        </div>

        {/* Credentials / Achievements List */}
        <div className="space-y-3">
          <ul className="space-y-3">
            {teacher.achievements.map((item, index) => {
              const IconComponent = iconMap[item.type] || ShieldCheck;
              return (
                <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-foreground/85">
                  <div className="p-1.5 rounded-lg bg-brand-blue-soft text-brand-blue mt-0.5 shrink-0">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="leading-relaxed font-medium">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Certificate Section: Full TRF Scan Frame */}
        {teacher.certificate && (
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                Bảng điểm thi IELTS
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-xs sm:text-sm font-bold text-brand-blue hover:text-brand-blue-hover gap-1.5 h-8 px-2.5 rounded-lg hover:bg-brand-blue-soft"
              >
                <span>Phóng to</span>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Full Vertical TRF Image Preview */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsModalOpen(true);
                }
              }}
              className="relative group rounded-2xl overflow-hidden border border-border/80 bg-white cursor-pointer shadow-2xs w-full flex items-center justify-center transition-all hover:border-brand-blue hover:shadow-md"
            >
              <img
                src={teacher.certificate.image}
                alt={teacher.certificate.alt}
                loading="lazy"
                className="w-full h-auto max-h-[520px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-bold backdrop-blur-[1px]">
                <Maximize2 className="h-4 w-4" />
                <span>Phóng to Bảng điểm TRF chính thức</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optional Review Link */}
      {teacher.reviewLink && (
        <div className="pt-4 border-t border-border/60">
          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl font-bold text-sm border-brand-blue/30 text-brand-blue hover:bg-brand-blue-soft gap-2"
          >
            <a href={teacher.reviewLink} target="_blank" rel="noopener noreferrer">
              <span>Xem đánh giá từ học viên</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      )}

      {/* Lightbox Modal */}
      <TeacherCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={teacher.certificate}
        teacherName={teacher.name}
      />
    </div>
  );
}
