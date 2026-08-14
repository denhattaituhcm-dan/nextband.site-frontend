import React from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { NotificationBar } from "../components/NotificationBar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Clock, TrendingUp, ArrowRight, CheckCircle2 } from "lucide-react";

export const OverviewTab: React.FC = () => {
  const {
    classData,
    totalHomeworks,
    progressPercent,
    pendingReviewsCount,
    setActiveTab,
  } = useWorkspace();

  const activeStudents = classData?.activeStudents || [];
  const studentsCount = activeStudents.length || classData?.studentCount || 0;
  const submissions = classData?.submissions || [];
  
  const submittedCount = submissions.filter((s: any) => s.status === "submitted" || s.status === "SUBMITTED" || s.status === "graded" || s.status === "GRADED").length;
  const gradedCount = submissions.filter((s: any) => s.status === "graded" || s.status === "GRADED").length;
  const pendingCount = pendingReviewsCount || submissions.filter((s: any) => s.status === "submitted" || s.status === "SUBMITTED").length;
  const totalAssignedSlots = studentsCount * totalHomeworks;
  const unsubmittedCount = Math.max(0, totalAssignedSlots - submittedCount);

  return (
    <div className="space-y-6 pt-2">
      {/* 4 Clean Operational KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              Sĩ số lớp học
            </p>
            <h4 className="text-2xl font-bold text-foreground">{studentsCount} học viên</h4>
            <p className="text-[11px] text-muted-foreground">
              {studentsCount > 0 ? "Đang trong lộ trình học" : "Chưa có học viên"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-purple-600" />
              Tổng số bài tập
            </p>
            <h4 className="text-2xl font-bold text-foreground">{totalHomeworks} bài tập</h4>
            <p className="text-[11px] text-muted-foreground">
              Được giao cho lớp học
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-card border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-colors"
          onClick={() => setActiveTab("grading")}
        >
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Bài chờ chấm
            </p>
            <h4 className="text-2xl font-bold text-amber-600">{pendingCount} bài</h4>
            <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
              {pendingCount > 0 ? "Xem danh sách chờ chấm" : "Tất cả đã xử lý"} <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-slate-200 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Tiến độ lớp
            </p>
            <h4 className="text-2xl font-bold text-emerald-600">{progressPercent}%</h4>
            <p className="text-[11px] text-muted-foreground">
              Tỷ lệ bài nộp hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Homework Completion Progress */}
      <Card className="p-4 space-y-2 border-slate-200 shadow-2xs bg-card">
        <div className="flex justify-between text-xs font-bold text-foreground">
          <span>Tiến độ hoàn thành bài tập lớp</span>
          <span className="font-mono text-emerald-600">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </Card>

      {/* Operational Breakdown Table */}
      <Card className="p-4 space-y-3 border-slate-200 shadow-2xs bg-card">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Tình trạng bài tập lớp
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-center">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[11px] text-muted-foreground font-medium">Bài đã nộp</p>
            <p className="text-lg font-bold text-foreground">{submittedCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <p className="text-[11px] text-emerald-700 font-medium">Bài đã chấm</p>
            <p className="text-lg font-bold text-emerald-700">{gradedCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
            <p className="text-[11px] text-amber-700 font-medium">Bài chờ chấm</p>
            <p className="text-lg font-bold text-amber-700">{pendingCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <p className="text-[11px] text-muted-foreground font-medium">Chưa nộp</p>
            <p className="text-lg font-bold text-muted-foreground">{unsubmittedCount}</p>
          </div>
        </div>
      </Card>

      {/* Daily Notification Events */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Thông báo vận hành hôm nay
        </h3>
        <NotificationBar classId={classData?.id} />
      </div>
    </div>
  );
};
