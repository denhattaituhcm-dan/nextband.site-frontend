import React from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FixedHeader: React.FC = () => {
  const {
    classData,
    openAddStudentModal,
  } = useWorkspace();
  const navigate = useNavigate();

  const activeStudents = classData?.activeStudents || [];
  const studentsCount = activeStudents.length || classData?.studentCount || 0;
  const teacherName = classData?.teacher?.fullName || "Chưa phân công";
  const courseTitle = classData?.course?.title || (classData?.target_band ? `Target Band ${classData.target_band}` : null);

  return (
    <div className="bg-background border-b pb-3 pt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/classes")}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {classData?.name || "Lớp học"}
              </h1>
              {classData?.status && (
                <Badge variant="outline" className="text-[10px] font-normal uppercase">
                  {classData.status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-medium">
              <span>{teacherName}</span>
              <span>·</span>
              <span>{studentsCount} học viên</span>
              {courseTitle && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <GraduationCap className="h-3 w-3 text-primary" />
                    {courseTitle}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Action: Single Primary Action (+ Thêm học viên) */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => openAddStudentModal()}
            className="h-8 text-xs gap-1.5 bg-primary font-semibold shadow-2xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            + Thêm học viên
          </Button>
        </div>
      </div>
    </div>
  );
};
