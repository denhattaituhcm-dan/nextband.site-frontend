import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, XCircle, AlertCircle, Lock, Save, CheckCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, CanonicalSessionDTO, invalidateClassWorkspace, getAuthToken } from "@/lib/api";

interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  status: "UNMARKED" | "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  note?: string | null;
}

interface SessionData {
  sessionId: string;
  sessionNumber: number;
  sessionTitle: string;
  sessionDate: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  completedAt?: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unmarked: number;
  };
  students: StudentAttendanceItem[];
}

interface AttendanceSheetProps {
  classId: string;
  sessions: CanonicalSessionDTO[];
  onRefreshMatrix?: () => void;
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ classId, sessions, onRefreshMatrix }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [items, setItems] = useState<StudentAttendanceItem[]>([]);

  useEffect(() => {
    if (sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    fetchSessionAttendance(selectedSessionId);
  }, [selectedSessionId]);

  const fetchSessionAttendance = async (sessionId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${sessionId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSessionData(data.data);
        setItems(data.data.students || []);
      } else {
        toast({ title: "Lỗi", description: data.error || "Không thể tải dữ liệu điểm danh buổi học", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lỗi kết nối", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, newStatus: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    setItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status: newStatus } : item))
    );
  };

  const handleNoteChange = (studentId: string, newNote: string) => {
    setItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, note: newNote } : item))
    );
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    setSaving(true);
    try {
      const payload = {
        items: items.map((it) => ({
          studentId: it.studentId,
          status: it.status,
          note: it.note || null,
        })),
      };

      const token = (await getAuthToken()) || localStorage.getItem("token") || "";

      const res = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${selectedSessionId}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Thành công", description: "Đã lưu bảng điểm danh" });
        fetchSessionAttendance(selectedSessionId);
        invalidateClassWorkspace(queryClient, classId);
        if (onRefreshMatrix) onRefreshMatrix();
      } else {
        toast({ title: "Lỗi", description: data.error || "Không thể lưu điểm danh", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lỗi kết nối", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSessionId) return;

    // Check frontend validation first
    const unmarked = items.filter((it) => it.status === "UNMARKED");
    if (unmarked.length > 0) {
      toast({
        title: "Chưa thể chốt buổi học",
        description: `Còn ${unmarked.length} học viên chưa được điểm danh. Vui lòng điểm danh đầy đủ 100% học viên trước khi chốt.`,
        variant: "destructive",
      });
      return;
    }

    setCompleting(true);
    try {
      // Save items first to be safe
      await handleSaveAttendance();

      const token = (await getAuthToken()) || localStorage.getItem("token") || "";

      const res = await fetch(`${API_BASE_URL}/classes/${classId}/sessions/${selectedSessionId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Thành công", description: "Buổi học đã được chốt hoàn tất (COMPLETED)" });
        fetchSessionAttendance(selectedSessionId);
        invalidateClassWorkspace(queryClient, classId);
        if (onRefreshMatrix) onRefreshMatrix();
      } else {
        toast({ title: "Không thể chốt buổi", description: data.error || "Lỗi khi chốt buổi học", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Lỗi kết nối", description: err.message, variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  const isCompleted = sessionData?.status === "COMPLETED";

  return (
    <div className="space-y-4 pt-2">
      {/* Top Session Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Chọn Buổi học:</label>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-[380px] h-9 text-xs font-medium">
              <SelectValue placeholder="Chọn buổi học" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => {
                const dateStr = s.scheduledDate || "";
                const formattedDate = dateStr ? dateStr.slice(0, 10).split("-").reverse().join("/") : "—";
                const lessonLabel = s.lessonTitle || `Lesson ${s.sessionNumber}`;
                const statusTag =
                  s.status === "COMPLETED"
                    ? "✓ Đã chốt"
                    : s.status === "CANCELLED"
                    ? "🚫 Đã hủy"
                    : "⏳ Chưa chốt";

                return (
                  <SelectItem key={s.id} value={s.id} className="text-xs font-medium">
                    Buổi {s.sessionNumber} • {formattedDate} • {lessonLabel} • {statusTag}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {isCompleted ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1">
              <Lock className="h-3 w-3 text-emerald-600" />
              Buổi học đã chốt (Khóa điểm danh)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
              Buổi học chưa chốt
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleSaveAttendance}
                disabled={saving || loading}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Lưu nháp
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleCompleteSession}
                disabled={completing || saving || loading}
              >
                {completing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Chốt điểm danh buổi học
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Attendance Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          Đang tải dữ liệu điểm danh...
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 border rounded-xl bg-card text-center text-xs text-muted-foreground">
          Chưa có học viên nào trong lớp để điểm danh.
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Trạng thái điểm danh</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((student) => (
                <TableRow key={student.studentId} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                          {(student.studentName || "HV").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-sm">{student.studentName}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant={student.status === "PRESENT" ? "default" : "outline"}
                        disabled={isCompleted}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1 ${
                          student.status === "PRESENT" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                        }`}
                        onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Có mặt
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={student.status === "LATE" ? "default" : "outline"}
                        disabled={isCompleted}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1 ${
                          student.status === "LATE" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                        }`}
                        onClick={() => handleStatusChange(student.studentId, "LATE")}
                      >
                        <Clock className="h-3.5 w-3.5" /> Đi muộn
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={student.status === "ABSENT" ? "default" : "outline"}
                        disabled={isCompleted}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1 ${
                          student.status === "ABSENT" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                        }`}
                        onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Vắng mặt
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={student.status === "EXCUSED" ? "default" : "outline"}
                        disabled={isCompleted}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1 ${
                          student.status === "EXCUSED" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                        }`}
                        onClick={() => handleStatusChange(student.studentId, "EXCUSED")}
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> Có phép
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Input
                      disabled={isCompleted}
                      placeholder="Nhập ghi chú (nếu có)"
                      className="h-8 text-xs max-w-xs"
                      value={student.note || ""}
                      onChange={(e) => handleNoteChange(student.studentId, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
