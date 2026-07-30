import { StudentWorkspaceTask } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HomeworkContinueCardProps {
  task: StudentWorkspaceTask;
}

export function HomeworkContinueCard({ task }: HomeworkContinueCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-blue-500 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 overflow-hidden relative border-0">
      <CardContent className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
              Buổi {task.title.match(/Buổi \d+/i)?.[0] || "12"}
            </span>
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
              {task.className || "STARTER01 • 04.2026"}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {task.title}
          </h2>

          <div className="flex items-center gap-4 text-xs text-blue-100 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Hạn nộp: {task.deadline ? new Date(task.deadline).toLocaleDateString("vi-VN") : "Hôm nay"}
            </span>
            <span>•</span>
            <span>Trạng thái: <strong className="text-white font-bold">Chưa nộp bài</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button
            onClick={() => navigate(task.actionUrl)}
            className="bg-white hover:bg-blue-50 text-blue-600 font-extrabold px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all text-base flex items-center gap-2 border-0"
          >
            Tiếp tục học
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
