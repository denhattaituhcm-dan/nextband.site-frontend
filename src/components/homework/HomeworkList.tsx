import { StudentWorkspaceTask } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface HomeworkListProps {
  title: string;
  tasks: StudentWorkspaceTask[];
  variant?: "default" | "completed";
}

export function HomeworkList({ title, tasks, variant = "default" }: HomeworkListProps) {
  const navigate = useNavigate();
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        {variant === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-blue-600" />}
        {title} ({tasks.length})
      </h3>

      <div className="grid gap-3">
        {tasks.map((task) => (
          <Card key={task.id} className="rounded-xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900">{task.title}</h4>
                  <Badge variant="outline" className="text-xs">{task.className}</Badge>
                </div>

                {/* Render Markdown Feedback chuẩn với remarkGfm */}
                {task.feedback && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 prose prose-sm max-w-none">
                    <div className="font-semibold text-emerald-700 mb-1">Nhận xét của Giáo viên:</div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.feedback}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                {task.score !== null && task.score !== undefined && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Score</div>
                    <div className="text-lg font-extrabold text-emerald-600">{task.score}</div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant={variant === "completed" ? "outline" : "default"}
                  onClick={() => navigate(task.actionUrl)}
                >
                  {variant === "completed" ? "Xem lại bài" : "Làm bài"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
