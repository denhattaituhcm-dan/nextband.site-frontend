import React from "react";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, XCircle } from "lucide-react";

interface AttendanceHeaderProps {
  lessonTitle?: string;
  date?: string;
  totalStudents?: number;
  presentCount?: number;
  absentCount?: number;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  lessonTitle = "Lesson 12",
  date = "02/08/2026",
  totalStudents = 20,
  presentCount = 17,
  absentCount = 3,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between p-4 rounded-xl border bg-card gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{lessonTitle}</h4>
          <Badge variant="outline" className="text-xs">{date}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Thống kê điểm danh buổi học trong ngày</p>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="h-4 w-4 text-slate-500" />
          <span>Tổng: {totalStudents} HV</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>Có mặt: {presentCount}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-rose-600">
          <XCircle className="h-4 w-4" />
          <span>Vắng mặt: {absentCount}</span>
        </div>
      </div>
    </div>
  );
};
