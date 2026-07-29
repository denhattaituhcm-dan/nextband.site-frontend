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
    <Card className="border-emerald-100 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white rounded-2xl shadow-xl overflow-hidden relative">
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      <CardContent className="p-6 md:p-8 relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            TIẾP TỤC LUYỆN TẬP
          </span>
          {task.deadline && (
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Hạn nộp: {new Date(task.deadline).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            Task before Course • Continue Homework
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {task.title}
          </h2>
          <p className="text-sm text-slate-300">Lớp: {task.className}</p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <Button
            onClick={() => navigate(task.actionUrl)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            Tiếp tục làm bài
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
