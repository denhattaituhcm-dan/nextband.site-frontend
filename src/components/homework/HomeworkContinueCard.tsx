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
    <Card className="border-emerald-100 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl shadow-xl overflow-hidden relative">
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <CardContent className="p-6 md:p-8 relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Clock className="w-3.5 h-3.5" />
            Bài tập hiện tại
          </span>
          {task.deadline && (
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Hạn nộp: {new Date(task.deadline).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            Lớp: {task.className || "STARTER01 • 04.2026"}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {task.title}
          </h2>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
          <div className="text-xs text-slate-400">
            Trạng thái: <span className="text-amber-300 font-semibold">Chưa nộp bài</span>
          </div>
          <Button
            onClick={() => navigate(task.actionUrl)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            Làm bài
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
