import React, { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Lock,
  Save,
  CheckCheck,
  Loader2,
  Zap,
  RotateCcw,
  Unlock,
  CalendarPlus,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  attendanceApi,
  sessionsApi,
  CanonicalSessionDTO,
  invalidateClassWorkspace,
  AttendanceStatus,
} from "@/lib/api";
import { useWorkspace } from "../../WorkspaceProvider";

interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  status: AttendanceStatus;
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
  const { classData, refetchClass } = useWorkspace();

  // Active students from class workspace
  const activeStudents = useMemo(() => {
    return classData?.activeStudents || classData?.students || [];
  }, [classData]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [completing, setCompleting] = useState<boolean>(false);
  const [generatingSessions, setGeneratingSessions] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [items, setItems] = useState<StudentAttendanceItem[]>([]);

  // Synchronize selectedSessionId when sessions prop changes
  useEffect(() => {
    if (sessions.length > 0) {
      const exists = sessions.some((s) => s.id === selectedSessionId);
      if (!exists || !selectedSessionId) {
        setSelectedSessionId(sessions[0].id);
      }
    } else {
      setSelectedSessionId("");
    }
  }, [sessions, selectedSessionId]);

  // Load session attendance
  useEffect(() => {
    if (!selectedSessionId) {
      setItems([]);
      setSessionData(null);
      return;
    }
    fetchSessionAttendance(selectedSessionId);
  }, [selectedSessionId, activeStudents]);

  const fetchSessionAttendance = async (sessionId: string) => {
    setLoading(true);
    try {
      const res = await attendanceApi.getSessionAttendance(classId, sessionId);
      const data = res?.data;

      if (data) {
        setSessionData(data as SessionData);

        // Map and merge with active students to ensure all class students are listed
        const existingRecords = data.students || [];
        const mergedItems: StudentAttendanceItem[] = activeStudents.map((st: any) => {
          const stId = st.studentId || st.id || st.user_id;
          const found = existingRecords.find((r: any) => r.studentId === stId);

          return {
            studentId: stId,
            studentName: st.fullName || st.full_name || st.email || "Học viên",
            avatarUrl: st.avatarUrl || st.avatar_url,
            status: found ? found.status : "UNMARKED",
            note: found ? (found.notes || found.note || "") : "",
          };
        });

        // If no activeStudents in context yet, use what the API returned
        setItems(mergedItems.length > 0 ? mergedItems : existingRecords);
      } else {
        // Fallback default list from activeStudents
        setItems(
          activeStudents.map((st: any) => ({
            studentId: st.studentId || st.id || st.user_id,
            studentName: st.fullName || st.full_name || st.email || "Học viên",
            avatarUrl: st.avatarUrl || st.avatar_url,
            status: "UNMARKED",
            note: "",
          }))
        );
      }
    } catch (err: any) {
      console.warn("[AttendanceSheet] Fetch attendance error:", err);
      // Populate with active students as fallback so UI remains functional
      setItems(
        activeStudents.map((st: any) => ({
          studentId: st.studentId || st.id || st.user_id,
          studentName: st.fullName || st.full_name || st.email || "Học viên",
          avatarUrl: st.avatarUrl || st.avatar_url,
          status: "UNMARKED",
          note: "",
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status: newStatus } : item))
    );
  };

  const handleNoteChange = (studentId: string, newNote: string) => {
    setItems((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, note: newNote } : item))
    );
  };

  // 1-Click: Tất cả có mặt
  const handleMarkAllPresent = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "PRESENT",
      }))
    );
    toast({
      title: "Đã chọn Có mặt",
      description: "Đã đánh dấu tất cả học viên có mặt trong buổi học này.",
    });
  };

  // Đặt lại điểm danh
  const handleResetAttendance = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "UNMARKED",
        note: "",
      }))
    );
    toast({
      title: "Đã đặt lại",
      description: "Trạng thái điểm danh đã được đặt lại.",
    });
  };

  // Lưu nháp điểm danh
  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    setSaving(true);
    try {
      const payload = items.map((it) => ({
        studentId: it.studentId,
        status: it.status,
        note: it.note || null,
      }));

      await attendanceApi.markAttendance(classId, selectedSessionId, payload);
      toast({ title: "Thành công", description: "Đã lưu bảng điểm danh thành công." });
      invalidateClassWorkspace(queryClient, classId);
      if (onRefreshMatrix) onRefreshMatrix();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể lưu điểm danh", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Chốt hoàn tất buổi học (COMPLETED)
  const handleCompleteSession = async () => {
    if (!selectedSessionId) return;

    const unmarked = items.filter((it) => it.status === "UNMARKED");
    if (unmarked.length > 0) {
      toast({
        title: "Chưa thể chốt buổi học",
        description: `Còn ${unmarked.length} học viên chưa được điểm danh. Vui lòng chọn trạng thái cho tất cả học viên trước khi chốt.`,
        variant: "destructive",
      });
      return;
    }

    setCompleting(true);
    try {
      const payload = items.map((it) => ({
        studentId: it.studentId,
        status: it.status,
        note: it.note || null,
      }));
      await attendanceApi.markAttendance(classId, selectedSessionId, payload);
      await attendanceApi.completeSession(classId, selectedSessionId);

      setSessionData((prev) => (prev ? { ...prev, status: "COMPLETED" } : null));
      toast({ title: "Thành công", description: "Buổi học đã được chốt và khóa điểm danh." });
      invalidateClassWorkspace(queryClient, classId);
      refetchClass();
      if (onRefreshMatrix) onRefreshMatrix();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể chốt buổi học", variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  // Mở lại điểm danh cho buổi đã chốt
  const handleUnlockSession = async () => {
    if (!selectedSessionId) return;
    try {
      await attendanceApi.unlockSession(classId, selectedSessionId);
      setSessionData((prev) => (prev ? { ...prev, status: "SCHEDULED" } : null));
      toast({ title: "Đã mở lại", description: "Buổi học đã được mở lại để chỉnh sửa điểm danh." });
      invalidateClassWorkspace(queryClient, classId);
      refetchClass();
      if (onRefreshMatrix) onRefreshMatrix();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể mở lại buổi học", variant: "destructive" });
    }
  };

  // Tự động khởi tạo danh sách buổi học nếu lớp chưa có buổi nào
  const handleGenerateSessions = async () => {
    setGeneratingSessions(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const totalToGenerate = classData?.lessons?.length || 24;

      await sessionsApi.generateForClass(classId, {
        startDate: today,
        weekdays: [1, 3, 5], // Thứ 2, 4, 6
        totalSessions: totalToGenerate,
        startTime: "18:00",
        endTime: "20:00",
      });

      toast({
        title: "Khởi tạo thành công",
        description: `Đã tự động tạo ${totalToGenerate} buổi học cho lớp.`,
      });
      invalidateClassWorkspace(queryClient, classId);
      refetchClass();
    } catch (err: any) {
      toast({
        title: "Lỗi khởi tạo",
        description: err.message || "Không thể tạo buổi học",
        variant: "destructive",
      });
    } finally {
      setGeneratingSessions(false);
    }
  };

  const isCompleted = sessionData?.status === "COMPLETED";

  // Summary counts
  const presentCount = items.filter((it) => it.status === "PRESENT").length;
  const lateCount = items.filter((it) => it.status === "LATE").length;
  const absentCount = items.filter((it) => it.status === "ABSENT").length;
  const excusedCount = items.filter((it) => it.status === "EXCUSED").length;
  const unmarkedCount = items.filter((it) => it.status === "UNMARKED").length;

  // Render empty state if no sessions exist
  if (sessions.length === 0) {
    return (
      <div className="p-8 border rounded-2xl bg-card text-center space-y-4 shadow-xs">
        <CalendarPlus className="h-12 w-12 text-emerald-600 mx-auto" />
        <div className="space-y-1">
          <h4 className="text-base font-bold text-foreground">Lớp học chưa có danh sách buổi học</h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Lớp học hiện chưa có buổi học nào trong lịch trình. Vui lòng bấm nút bên dưới để tự động tạo danh sách các buổi học và bắt đầu điểm danh.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm"
          disabled={generatingSessions}
          onClick={handleGenerateSessions}
        >
          {generatingSessions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Khởi tạo danh sách buổi học ngay
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Top Session Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isCompleted ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={handleMarkAllPresent}
                disabled={saving || loading || items.length === 0}
              >
                <Zap className="h-3.5 w-3.5 fill-current text-emerald-600" />
                Tất cả có mặt
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={handleResetAttendance}
                disabled={saving || loading || items.length === 0}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Đặt lại
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleSaveAttendance}
                disabled={saving || loading || items.length === 0}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Lưu nháp
              </Button>

              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleCompleteSession}
                disabled={completing || saving || loading || items.length === 0}
              >
                {completing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Chốt điểm danh buổi học
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              onClick={handleUnlockSession}
            >
              <Unlock className="h-3.5 w-3.5 text-amber-600" />
              Mở lại điểm danh
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stat Pills */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-semibold">
            Tổng: {items.length} học viên
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Có mặt: {presentCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" /> Đi muộn: {lateCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold flex items-center gap-1">
            <XCircle className="h-3 w-3 text-rose-600" /> Vắng mặt: {absentCount}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-purple-600" /> Có phép: {excusedCount}
          </span>
          {unmarkedCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border font-semibold animate-pulse">
              Chưa điểm danh: {unmarkedCount}
            </span>
          )}
        </div>
      )}

      {/* Main Attendance Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          Đang tải dữ liệu điểm danh...
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 border rounded-xl bg-card text-center space-y-2">
          <Users className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Chưa có học viên nào trong lớp để điểm danh.</p>
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[280px]">Học viên</TableHead>
                <TableHead>Trạng thái điểm danh</TableHead>
                <TableHead className="w-[280px]">Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((student) => (
                <TableRow key={student.studentId} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                          {(student.studentName || "HV").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm text-foreground">{student.studentName}</div>
                        {student.status === "UNMARKED" && (
                          <span className="text-[11px] text-amber-600 font-medium">Chưa chọn trạng thái</span>
                        )}
                      </div>
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
