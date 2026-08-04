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

  const studentsCount = classData?.students?.length || 0;
  const activeStudents = classData?.students?.filter((s: any) => s.is_active !== false).length || studentsCount;
  const pausedStudents = studentsCount - activeStudents;

  return (
    <div className="space-y-6 pt-2">
      {/* 5 Quick Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-card hover:border-emerald-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sĩ số lớp học</p>
            <h4 className="text-xl font-bold">{studentsCount} học viên</h4>
            <p className="text-xs text-emerald-600 font-medium">
              {studentsCount > 0 ? `${activeStudents} đang học ${pausedStudents > 0 ? `• ${pausedStudents} tạm nghỉ` : ""}` : "Chưa có học viên"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-blue-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Homework hiện tại</p>
            <h4 className="text-xl font-bold text-blue-600">
              {totalHomeworks > 0 ? `HW ${currentHomework} / ${totalHomeworks}` : "0 / 0"}
            </h4>
            <p className="text-xs text-muted-foreground">Tiến độ lớp: {progressPercent}%</p>
          </CardContent>
        </Card>

        <Card
          className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 cursor-pointer hover:bg-amber-100/60 transition-colors"
          onClick={() => setActiveTab("grading")}
        >
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Bài cần chấm</p>
            <h4 className="text-xl font-bold text-amber-600">
              {pendingReviewsCount > 0 ? `🔴 ${pendingReviewsCount} bài` : "0 bài"}
            </h4>
            <p className="text-xs text-amber-700 flex items-center gap-1 font-medium">
              {pendingReviewsCount > 0 ? "Mở Inbox chấm bài" : "Tất cả đã xong"} <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 cursor-pointer hover:bg-rose-100/60 transition-colors"
          onClick={() => setActiveTab("students")}
        >
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-300">Học viên quá hạn</p>
            <h4 className="text-xl font-bold text-rose-600">
              {overdueCount > 0 ? `⚠️ ${overdueCount} HV` : "0 HV"}
            </h4>
            <p className="text-xs text-rose-700 flex items-center gap-1 font-medium">
              Xem danh sách <ArrowRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card hover:border-purple-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Buổi học</p>
            <h4 className="text-xl font-bold text-purple-600">
              {totalHomeworks > 0 ? `Buổi ${currentHomework}` : "Chưa lên lịch"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {totalHomeworks > 0 ? `Tổng số ${totalHomeworks} buổi` : "Lớp mới khởi tạo"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Notification Events */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          Thông báo vận hành hôm nay
        </h3>
        <NotificationBar classId={classData?.id} />
      </div>

      {/* Main Focus Banner */}
      {pendingReviewsCount > 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold">Bạn có {pendingReviewsCount} bài nộp chưa phản hồi!</h3>
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
      ) : (
        <Card className="border-dashed bg-emerald-50/30 border-emerald-200">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-800">Không có bài tập nào đang chờ chấm</h3>
              <p className="text-xs text-muted-foreground">
                Lớp học đang ở trạng thái tốt. Tất cả các bài nộp đã được xử lý hoặc chưa có bài mới.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 shrink-0"
              onClick={() => setActiveTab("students")}
            >
              <Users className="mr-2 h-4 w-4" />
              Quản lý học viên
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
