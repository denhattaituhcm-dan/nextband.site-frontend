import { useQuery } from "@tanstack/react-query";
import { homeworksApi, TeacherGradingItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { TeacherGradingModal } from "@/components/admin/TeacherGradingModal";
import { Award, Clock, CheckCircle2 } from "lucide-react";

export default function TeacherWorkspace() {
  const [gradingTask, setGradingTask] = useState<TeacherGradingItem | null>(null);

  const { data: workspaceData, refetch } = useQuery({
    queryKey: ["teacher-homework-workspace"],
    queryFn: () => homeworksApi.getTeacherWorkspace(),
  });

  const needGrading = workspaceData?.data?.needGrading || [];
  const recentGraded = workspaceData?.data?.recentGraded || [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Award className="w-6 h-6 text-primary" />
        Teacher Workspace • Danh sách Cần chấm điểm
      </h1>

      {/* Danh sách cần chấm (Need Grading) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Bài nộp chờ chấm ({needGrading.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {needGrading.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Không có bài nào chờ chấm 🎉</p>
          ) : (
            needGrading.map((item) => (
              <div key={`${item.homeworkId}-${item.studentId}`} className="flex items-center justify-between p-4 border rounded-xl bg-card">
                <div>
                  <h4 className="font-semibold">{item.studentName}</h4>
                  <p className="text-xs text-muted-foreground">{item.homeworkTitle} • {item.className}</p>
                </div>
                <Button size="sm" onClick={() => setGradingTask(item)}>
                  Chấm bài ngay
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Danh sách Đã chấm gần đây (Recent Graded) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Bài đã chấm gần đây ({recentGraded.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentGraded.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chưa có bài nào đã chấm</p>
          ) : (
            recentGraded.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50">
                <div>
                  <h5 className="font-medium text-sm">{item.studentName}</h5>
                  <p className="text-xs text-muted-foreground">{item.homeworkTitle}</p>
                </div>
                <Badge variant="secondary" className="font-bold text-emerald-700">
                  Score: {item.score ?? "—"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal chấm bài */}
      {gradingTask && (
        <TeacherGradingModal
          open={!!gradingTask}
          onOpenChange={(open) => !open && setGradingTask(null)}
          homeworkId={gradingTask.homeworkId}
          studentId={gradingTask.studentId}
          studentName={gradingTask.studentName}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
