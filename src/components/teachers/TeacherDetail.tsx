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
  Sparkles,
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
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-6">
        {/* Header Profile */}
        <div className="space-y-2 border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-brand-blue-soft text-brand-blue border border-brand-blue/20 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chuyên môn IELTS</span>
            </span>
            {teacher.specialties.map((spec) => (
              <span
                key={spec}
                className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/60"
              >
                {spec}
              </span>
            ))}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {teacher.name}
          </h3>
          <p className="text-sm sm:text-base font-bold text-brand-blue">
            {teacher.role}
          </p>
        </div>

        {/* Achievements / Credentials List */}
        <div className="space-y-3.5">
          <h4 className="text-xs font-mono font-black text-muted-foreground uppercase tracking-wider">
            Năng lực &amp; Thành tích học thuật
          </h4>
          <ul className="space-y-2.5">
            {teacher.achievements.map((item, index) => {
              const IconComponent = iconMap[item.type] || ShieldCheck;
              return (
                <li key={index} className="flex items-start gap-3 text-sm sm:text-base text-foreground/85">
                  <div className="p-1 rounded-lg bg-brand-blue-soft text-brand-blue mt-0.5 shrink-0">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <span className="leading-snug">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Certificate Section */}
        {teacher.certificate && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-black text-muted-foreground uppercase tracking-wider">
                Bảng điểm thi IELTS (TRF)
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover gap-1.5 h-7 px-2.5 rounded-lg hover:bg-brand-blue-soft"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Phóng to</span>
              </Button>
            </div>

            {/* Thumbnail Box */}
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
              className="relative group rounded-2xl overflow-hidden border border-border/80 bg-muted/20 cursor-pointer aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center transition-all hover:border-brand-blue hover:shadow-xs"
            >
              <img
                src={teacher.certificate.image}
                alt={teacher.certificate.alt}
                loading="lazy"
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs sm:text-sm font-bold backdrop-blur-[1px]">
                <Maximize2 className="h-4 w-4" />
                <span>Xem bảng điểm gốc</span>
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
