import { StudentWorkspaceTask } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface HomeworkContinueCardProps {
  task: StudentWorkspaceTask;
}

export function HomeworkContinueCard({ task }: HomeworkContinueCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const normalizedStatus = task.status?.toUpperCase() || "UNSUBMITTED";

  // Dynamic CTA label based on business status
  const getCtaLabel = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "Xem bài đã nộp";
      case "GRADED":
        return "Xem nhận xét";
      case "REVISION_REQUIRED":
        return "Sửa và nộp lại";
      case "UNSUBMITTED":
      default:
        return "Bắt đầu làm bài ngay";
    }
  };

  const ctaLabel = getCtaLabel(normalizedStatus);
  const sessionMatch = task.title?.match(/(?:Buổi|Day|Week)\s*\d+/i)?.[0];

  const getStatusText = (status: string) => {
    switch (status) {
      case "GRADED":
        return "Đã chấm điểm";
      case "SUBMITTED":
        return "Đang chờ chấm";
      case "REVISION_REQUIRED":
        return "Cần sửa lại";
      default:
        return "Chưa hoàn thành";
    }
  };

  return (
    <Card className="bg-gradient-to-r from-primary via-primary/95 to-teal-700 text-primary-foreground rounded-2xl shadow-lg overflow-hidden relative border-0">
      <CardContent className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {sessionMatch && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                {sessionMatch}
              </span>
            )}
            {task.className && (
              <span className="text-xs font-semibold text-primary-foreground/90 uppercase tracking-wider">
                {task.className}
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {task.title}
          </h2>

          <div className="flex items-center gap-4 text-xs text-primary-foreground/80 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Hạn nộp: {task.deadline ? new Date(task.deadline).toLocaleDateString("vi-VN") : "Trong tuần này"}
            </span>
            <span>•</span>
            <span>Trạng thái: <strong className="text-white font-bold">{getStatusText(normalizedStatus)}</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0">
          <Button
            onClick={() => {
              const currentPath = location.pathname;
              const url = task.actionUrl || "";
              const separator = url.includes("?") ? "&" : "?";
              const targetUrl = url.startsWith("/exam")
                ? `${url}${separator}returnUrl=${encodeURIComponent(currentPath)}`
                : url;
              navigate(targetUrl, {
                state: {
                  exitContext: {
                    destination: currentPath,
                    source: "homework_continue_card",
                    classId: task.classId,
                  },
                  returnUrl: currentPath,
                },
              });
            }}
            className="bg-white hover:bg-white/90 text-primary font-extrabold px-6 py-5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm md:text-base flex items-center gap-2 border-0 active:scale-95"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
