import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { attendanceApi } from "@/lib/api";

interface MatrixSessionInfo {
  id: string;
  sessionNumber: number;
  sessionDate: string;
  lessonTitle: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

interface StudentMatrixRow {
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  email: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  eligibleSessions: number;
  attendanceRate: number;
  sessions: Array<{
    sessionId: string;
    sessionNumber: number;
    sessionDate: string;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    attendanceStatus: "UNMARKED" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    isFuture?: boolean;
    isOverdueUnmarked?: boolean;
    note?: string | null;
  }>;
}

interface MatrixData {
  classId: string;
  className: string;
  totalSessions: number;
  completedSessions: number;
  sessionCoverage: number;
  recordCoverage: number;
  attendanceCoverage: number;
  sessions: MatrixSessionInfo[];
  students: StudentMatrixRow[];
}

interface AttendanceMatrixProps {
  classId: string;
  refreshTrigger?: number;
}

export const AttendanceMatrix: React.FC<AttendanceMatrixProps> = ({ classId, refreshTrigger }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<MatrixData | null>(null);

  useEffect(() => {
    fetchMatrix();
  }, [classId, refreshTrigger]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getAttendanceMatrix(classId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast({ title: "Lỗi", description: res.error || "Không thể tải ma trận chuyên cần", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lỗi kết nối", description: err.message || "Không thể tải dữ liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (
    status: "UNMARKED" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
    isCompleted: boolean,
    isOverdueUnmarked?: boolean
  ) => {
    switch (status) {
      case "PRESENT":
        return <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">P</span>;
      case "LATE":
        return <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-amber-100 text-amber-800 font-bold text-xs">L</span>;
      case "ABSENT":
        return <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-rose-100 text-rose-800 font-bold text-xs">A</span>;
      case "EXCUSED":
        return <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-purple-100 text-purple-800 font-bold text-xs">E</span>;
      case "UNMARKED":
      default:
        if (isOverdueUnmarked) {
          return (
            <span
              title="Buổi học đã qua nhưng chưa chốt điểm danh"
              className="inline-flex items-center justify-center gap-0.5 px-1 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200 cursor-help"
            >
              <AlertTriangle className="h-3 w-3 text-amber-500" />-
            </span>
          );
        }
        return <span title="Buổi học chưa diễn ra" className="text-muted-foreground/50 text-xs font-mono">-</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        Đang tải ma trận chuyên cần...
      </div>
    );
  }

  if (!data || data.students.length === 0) {
    return (
      <div className="p-8 border rounded-xl bg-card text-center text-xs text-muted-foreground">
        Chưa có dữ liệu ma trận chuyên cần.
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header KPI summary */}
      <div className="flex flex-wrap items-center justify-between p-4 rounded-xl border bg-card shadow-xs gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Ma trận Chuyên cần Lớp học</h4>
          <p className="text-xs text-muted-foreground">
            Hiển thị tổng quan điểm danh tất cả các buổi học và tỷ lệ % chuyên cần do Backend tính toán.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Buổi đã chốt: {data.completedSessions} / {data.totalSessions} buổi ({data.sessionCoverage ?? data.attendanceCoverage}%)
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border font-semibold">
            <AlertCircle className="h-4 w-4 text-slate-500" />
            Độ phủ điểm danh (Record Coverage): {data.recordCoverage ?? 100}%
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="border rounded-xl bg-card overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[180px] sticky left-0 bg-muted/40 z-10">Học viên</TableHead>
              <TableHead className="w-[90px] text-center">Tỷ lệ %</TableHead>
              {data.sessions.map((s) => (
                <TableHead key={s.id} className="text-center w-[40px] px-1 text-xs font-semibold">
                  <div title={`Buổi ${s.sessionNumber}: ${s.lessonTitle} (${s.sessionDate?.slice(0, 10)})`}>
                    S{s.sessionNumber}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.students.map((student) => (
              <TableRow key={student.studentId} className="hover:bg-muted/50 transition-colors">
                <TableCell className="sticky left-0 bg-card z-10 border-r">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-800">
                        {(student.studentName || "HV").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-xs truncate max-w-[130px]">{student.studentName}</span>
                  </div>
                </TableCell>

                <TableCell className="text-center font-bold text-xs text-emerald-600">
                  {student.attendanceRate}%
                </TableCell>

                {student.sessions.map((s) => (
                  <TableCell key={s.sessionId} className="text-center px-1 py-2">
                    {getStatusBadge(s.attendanceStatus, s.status === "COMPLETED", s.isOverdueUnmarked)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend Note */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-2">
        <span className="font-semibold text-slate-700">Chú thích:</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 bg-emerald-100 text-emerald-800 font-bold text-[10px] text-center rounded">P</span> Có mặt</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 bg-amber-100 text-amber-800 font-bold text-[10px] text-center rounded">L</span> Đi muộn</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 bg-rose-100 text-rose-800 font-bold text-[10px] text-center rounded">A</span> Vắng mặt</span>
        <span className="flex items-center gap-1"><span className="inline-block h-4 w-4 bg-purple-100 text-purple-800 font-bold text-[10px] text-center rounded">E</span> Có phép</span>
        <span className="flex items-center gap-1"><span className="font-mono font-bold text-slate-400">-</span> Chưa diễn ra</span>
        <span className="flex items-center gap-1 text-amber-700 font-medium"><AlertTriangle className="h-3 w-3 text-amber-500" /> Quá hạn chưa chốt</span>
      </div>
    </div>
  );
};
