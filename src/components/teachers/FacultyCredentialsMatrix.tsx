import React from "react";
import { TeacherCredentials } from "@/data/teachers";
import { GraduationCap, Award, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FacultyCredentialsMatrixProps {
  credentials: TeacherCredentials;
  className?: string;
}

export function FacultyCredentialsMatrix({
  credentials,
  className,
}: FacultyCredentialsMatrixProps) {
  const sections = [
    {
      title: "Học vấn",
      icon: GraduationCap,
      items: credentials.education,
    },
    {
      title: "Chứng chỉ",
      icon: Award,
      items: credentials.certifications,
    },
    {
      title: "Kinh nghiệm",
      icon: Clock,
      items: credentials.experience,
    },
    {
      title: "Chuyên môn tại ARIS",
      icon: BookOpen,
      items: credentials.expertise,
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-xs font-mono font-black text-muted-foreground uppercase tracking-wider">
        Năng lực Học thuật &amp; Nền tảng Chuyên môn
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.title}
              className="p-4 rounded-2xl bg-card border border-border/80 space-y-3 flex flex-col justify-start shadow-2xs"
            >
              <div className="flex items-center gap-2 text-foreground font-black text-sm pb-2 border-b border-border/60">
                <Icon className="h-4 w-4 text-brand-blue shrink-0" />
                <span>{sec.title}</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-foreground/80 leading-relaxed">
                {sec.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-blue font-bold text-xs mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
