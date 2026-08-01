import React from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { NotificationBar } from "../components/NotificationBar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Edit3, Users, ArrowRight, CheckCircle, Calendar } from "lucide-react";

export const OverviewTab: React.FC = () => {
  const {
    classData,
    currentHomework,
    totalHomeworks,
    progressPercent,
    pendingReviewsCount,
    overdueCount,
    setActiveTab,
  } = useWorkspace();

  const studentsCount = classData?.students?.length || classData?._count?.students || 0;
  const activeStudents = Math.max(0, studentsCount - 3);

  return (
    <div className="space-y-6 pt-2">
      {/* 5 Quick Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-card hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sĩ số lớp học</p>
            <h4 className="text-xl font-bold">{studentsCount} học viên</h4>
            <p className="text-xs text-emerald-600 font-medium">
              {activeStudents} đang học • 3 tạm nghỉ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-blue-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Homework hiện tại</p>
            <h4 className="text-xl font-bold text-blue-600">HW {currentHomework} / {totalHomeworks}</h4>
            <p className="text-xs text-muted-foreground">Tiến độ lớp: {progressPercent}%</p>
          </CardContent>
        </Card>

        <Card
          className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 cursor-pointer hover:bg-amber-100/60 transition-colors"
          onClick={() => setActiveTab("grading")}
        >
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Bài cần chấm</p>
            <h4 className="text-xl font-bold text-amber-600">🔴 {pendingReviewsCount} bài</h4>
            <p className="text-xs text-amber-700 flex items-center gap-1 font-medium">
              Mở Inbox chấm bài <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 cursor-pointer hover:bg-rose-100/60 transition-colors"
          onClick={() => setActiveTab("students")}
        >
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Học viên quá hạn</p>
            <h4 className="text-xl font-bold text-rose-600">⚠️ {overdueCount} HV</h4>
            <p className="text-xs text-rose-700 flex items-center gap-1 font-medium">
              Xem danh sách <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-purple-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Buổi tiếp theo</p>
            <h4 className="text-xl font-bold text-purple-600">Lesson 13</h4>
            <p className="text-xs text-muted-foreground">Dự kiến: Thứ 2 tới</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Notification Events */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          Thông báo vận hành hôm nay
        </h3>
        <NotificationBar />
      </div>

      {/* Main Focus Banner */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold">Bạn có 15 bài nộp Homework 12 chưa phản hồi!</h3>
            <p className="text-xs text-muted-foreground">
              Giải quyết hàng đợi chấm bài để giữ nhịp học tập và động lực cho học viên.
            </p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            onClick={() => setActiveTab("grading")}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Chấm bài ngay
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
