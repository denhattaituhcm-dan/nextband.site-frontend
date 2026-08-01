import React from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Clock, AlertCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FixedHeader: React.FC = () => {
  const {
    classData,
    currentHomework,
    totalHomeworks,
    progressPercent,
    pendingReviewsCount,
    overdueCount,
  } = useWorkspace();
  const navigate = useNavigate();

  const studentsCount = classData?.students?.length || classData?._count?.students || 0;
  const teacherName = classData?.teacher?.fullName || "Chưa phân công";

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b pb-4 pt-2 space-y-3">
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
              <Badge variant="outline" className="text-xs font-normal">
                GV: {teacherName}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {studentsCount} học viên
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <BookOpen className="h-3.5 w-3.5" />
                Homework {currentHomework} / {totalHomeworks}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Badges */}
        <div className="flex items-center gap-2">
          {pendingReviewsCount > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 py-1 px-2.5">
              <Clock className="h-3.5 w-3.5" />
              🔴 {pendingReviewsCount} bài cần chấm
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1 py-1 px-2.5">
              <AlertCircle className="h-3.5 w-3.5" />
              ⚠️ {overdueCount} quá hạn
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>Tiến độ hoàn thành bài tập lớp</span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </div>
  );
};
