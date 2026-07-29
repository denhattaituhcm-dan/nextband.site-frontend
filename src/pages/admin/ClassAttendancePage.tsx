import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { attendanceApi, AttendanceStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Save, FileCheck, HelpCircle } from "lucide-react";

export default function ClassAttendancePage() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ["session-attendance", classId, sessionId],
    queryFn: () => attendanceApi.getSessionAttendance(classId!, sessionId!),
    enabled: !!classId && !!sessionId,
  });

  const sessionInfo = sessionData?.data;
  const students = sessionInfo?.students || [];
  const summary = sessionInfo?.summary;

  useEffect(() => {
    if (students.length > 0) {
      const initialState: Record<string, AttendanceStatus> = {};
      students.forEach((s) => {
        initialState[s.studentId] = s.status as AttendanceStatus;
      });
      setAttendanceState(initialState);
    }
  }, [students]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(attendanceState).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      return attendanceApi.markAttendance(classId!, sessionId!, items);
    },
    onSuccess: () => {
      setLastSavedTime(new Date().toLocaleTimeString("vi-VN"));
      toast({ title: "Điểm danh thành công!", description: "Dữ liệu điểm danh đã được lưu an toàn." });
    },
    onError: (err: any) => {
      toast({ title: "Lỗi điểm danh", description: err.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
  };

  const hasUnmarked = Object.values(attendanceState).some((st) => st === "UNMARKED");

  if (isLoading) return <div className="p-8 text-center">Đang tải danh sách điểm danh...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Điểm danh: {sessionInfo?.sessionTitle}</h1>
            <p className="text-xs text-slate-500">Lớp: {sessionInfo?.className}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSavedTime && (
            <span className="text-xs text-slate-400">Đã lưu lúc: {lastSavedTime}</span>
          )}
          <Button
            onClick={() => {
              if (hasUnmarked && !window.confirm("Vẫn còn học viên chưa được điểm danh. Bạn có chắc muốn lưu?")) {
                return;
              }
              saveMutation.mutate();
            }}
            disabled={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Đang lưu..." : "Lưu điểm danh"}
          </Button>
        </div>
      </div>

      {/* SUMMARY STATS BAR */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="p-3 text-center bg-slate-50">
            <div className="text-xs text-slate-500">Tổng số</div>
            <div className="text-lg font-bold text-slate-900">{summary.total}</div>
          </Card>
          <Card className="p-3 text-center bg-emerald-50 border-emerald-200">
            <div className="text-xs text-emerald-700 font-semibold">Có mặt</div>
            <div className="text-lg font-bold text-emerald-600">{summary.present}</div>
          </Card>
          <Card className="p-3 text-center bg-red-50 border-red-200">
            <div className="text-xs text-red-700 font-semibold">Vắng</div>
            <div className="text-lg font-bold text-red-600">{summary.absent}</div>
          </Card>
          <Card className="p-3 text-center bg-amber-50 border-amber-200">
            <div className="text-xs text-amber-700 font-semibold">Đi muộn</div>
            <div className="text-lg font-bold text-amber-600">{summary.late}</div>
          </Card>
          <Card className="p-3 text-center bg-blue-50 border-blue-200">
            <div className="text-xs text-blue-700 font-semibold">Có phép</div>
            <div className="text-lg font-bold text-blue-600">{summary.excused}</div>
          </Card>
          <Card className="p-3 text-center bg-slate-100">
            <div className="text-xs text-slate-500">Chưa điểm danh</div>
            <div className="text-lg font-bold text-slate-700">{summary.unmarked}</div>
          </Card>
        </div>
      )}

      {/* STUDENT LIST TABLE */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Danh sách Học viên ({students.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {students.map((student) => {
            const currentStatus = attendanceState[student.studentId] || "UNMARKED";

            return (
              <div key={student.studentId} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl bg-card gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={student.avatarUrl || undefined} />
                    <AvatarFallback className="font-bold">{student.studentName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{student.studentName}</h4>
                    {currentStatus === "UNMARKED" && (
                      <Badge variant="outline" className="text-xs text-slate-400">Chưa điểm danh</Badge>
                    )}
                  </div>
                </div>

                {/* 4 STATUS BUTTONS: PRESENT, ABSENT, LATE, EXCUSED */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant={currentStatus === "PRESENT" ? "default" : "outline"}
                    className={currentStatus === "PRESENT" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}
                    onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Có mặt
                  </Button>
                  <Button
                    size="sm"
                    variant={currentStatus === "ABSENT" ? "default" : "outline"}
                    className={currentStatus === "ABSENT" ? "bg-red-600 hover:bg-red-500 text-white" : ""}
                    onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Vắng
                  </Button>
                  <Button
                    size="sm"
                    variant={currentStatus === "LATE" ? "default" : "outline"}
                    className={currentStatus === "LATE" ? "bg-amber-600 hover:bg-amber-500 text-white" : ""}
                    onClick={() => handleStatusChange(student.studentId, "LATE")}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Đi muộn
                  </Button>
                  <Button
                    size="sm"
                    variant={currentStatus === "EXCUSED" ? "default" : "outline"}
                    className={currentStatus === "EXCUSED" ? "bg-blue-600 hover:bg-blue-500 text-white" : ""}
                    onClick={() => handleStatusChange(student.studentId, "EXCUSED")}
                  >
                    <FileCheck className="w-3.5 h-3.5 mr-1" />
                    Có phép
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
