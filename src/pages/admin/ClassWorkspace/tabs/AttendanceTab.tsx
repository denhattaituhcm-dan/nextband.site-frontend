import React, { useState, useMemo } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { AttendanceHeader } from "../features/attendance/AttendanceHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Save,
  Zap,
  Send,
  RotateCcw,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

// Enum AttendanceStatus chuẩn sản phẩm
export type AttendanceStatus = "PRESENT" | "LATE" | "EXCUSED" | "ABSENT";

// Enum EnrollmentStatus chuẩn Vòng đời Học viên trong lớp
export type EnrollmentStatus = "PENDING" | "ACTIVE" | "PAUSED" | "SUSPENDED" | "COMPLETED" | "REMOVED";

// Enum PauseReason chi tiết cho Báo cáo Quản trị
export type PauseReason = "MEDICAL" | "ACADEMIC" | "PERSONAL" | "FINANCIAL" | "OTHER";

interface StudentAttendanceState {
  status: AttendanceStatus;
  note: string;
  auditTrail?: string[];
  isManualOverridden?: boolean;
}

export const AttendanceTab: React.FC = () => {
  const { classData } = useWorkspace();

  // Selected session state (Mock buổi 1..27, mặc định buổi 12)
  const [currentSession, setCurrentSession] = useState(12);
  const totalSessions = 27;

  // Session locked status (DRAFT vs FINALIZED)
  const [sessionStatus, setSessionStatus] = useState<"DRAFT" | "FINALIZED">("DRAFT");
  const [classNote, setClassNote] = useState<string>("Hôm nay học Speaking Part 2 & chữa Listening Section 4");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>("08:30");
  const [isSaving, setIsSaving] = useState(false);

  // Student list from workspace or mock (bao gồm enrollmentStatus & pauseUntil)
  const students = useMemo(() => {
    return (
      classData?.students || [
        {
          id: "1",
          fullName: "Nguyễn Văn An",
          email: "an@gmail.com",
          enrollmentStatus: "ACTIVE",
          attendancePct: 95,
          consecutiveAbsences: 0,
          hwStatus: "HW 12: 🟢 Đã nộp",
        },
        {
          id: "2",
          fullName: "Trần Thị Bình",
          email: "binh@gmail.com",
          enrollmentStatus: "ACTIVE",
          attendancePct: 83,
          consecutiveAbsences: 2,
          hwStatus: "HW 12: 🟠 Chưa nộp",
        },
        {
          id: "3",
          fullName: "Lê Văn Cường",
          email: "cuong@gmail.com",
          enrollmentStatus: "PAUSED",
          pauseReason: "MEDICAL",
          pauseUntil: "28/08/2026",
          attendancePct: 70,
          consecutiveAbsences: 0,
          hwStatus: "Đã tạm dừng",
        },
        {
          id: "4",
          fullName: "Phạm Hoàng Dung",
          email: "dung@gmail.com",
          enrollmentStatus: "SUSPENDED",
          attendancePct: 60,
          consecutiveAbsences: 0,
          hwStatus: "Tạm ngưng học phí",
        },
      ]
    );
  }, [classData]);

  // Initial attendance state map
  const [attendanceMap, setAttendanceMap] = useState<Record<string, StudentAttendanceState>>({
    "1": { status: "PRESENT", note: "" },
    "2": { status: "PRESENT", note: "" },
    "3": { status: "EXCUSED", note: "Ốm dài hạn (Đang bảo lưu)", isManualOverridden: false },
    "4": { status: "ABSENT", note: "Tạm ngưng bởi Trung tâm", isManualOverridden: false },
  });

  // Manual Override Map cho giáo viên điểm danh học viên PAUSED / SUSPENDED
  const [overrideMap, setOverrideMap] = useState<Record<string, boolean>>({});

  // Track modified count for Notion-style status
  const [unsavedChangesCount, setUnsavedChangesCount] = useState<number>(0);

  // 1-CLICK: Tất cả có mặt (Chỉ áp dụng cho học viên ACTIVE hoặc đã Override)
  const handleMarkAllPresent = () => {
    if (sessionStatus === "FINALIZED") return;

    setAttendanceMap((prev) => {
      const next: Record<string, StudentAttendanceState> = {};
      students.forEach((st: any) => {
        const isPausedOrSuspended = (st.enrollmentStatus === "PAUSED" || st.enrollmentStatus === "SUSPENDED") && !overrideMap[st.id];
        if (isPausedOrSuspended) {
          next[st.id] = prev[st.id] || { status: "EXCUSED", note: "" };
        } else {
          next[st.id] = {
            status: "PRESENT",
            note: prev[st.id]?.note || "",
          };
        }
      });
      return next;
    });

    setUnsavedChangesCount((prev) => prev + 1);
    toast.success("Đã đánh dấu TẤT CẢ học viên Đang học (ACTIVE) Có mặt!");
  };

  // RESET ATTENDANCE
  const handleResetAttendance = () => {
    if (sessionStatus === "FINALIZED") return;

    setAttendanceMap((prev) => {
      const next: Record<string, StudentAttendanceState> = {};
      students.forEach((st: any) => {
        next[st.id] = { status: "PRESENT", note: "" };
      });
      return next;
    });
    setOverrideMap({});
    setUnsavedChangesCount((prev) => prev + 1);
    toast.info("Đã đặt lại điểm danh về trạng thái mặc định");
  };

  // TOGGLE OVERRIDE FOR PAUSED/SUSPENDED STUDENT
  const handleToggleOverride = (studentId: string) => {
    setOverrideMap((prev) => {
      const isCurrentlyOverridden = !!prev[studentId];
      const nextVal = !isCurrentlyOverridden;
      if (nextVal) {
        toast.info("Đã mở quyền Điểm danh thủ công (Override) cho học viên này!");
      }
      return { ...prev, [studentId]: nextVal };
    });
  };

  // CHANGE INDIVIDUAL STATUS
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    if (sessionStatus === "FINALIZED") return;

    setAttendanceMap((prev) => {
      const current = prev[studentId] || { status: "PRESENT", note: "" };
      if (current.status === newStatus) return prev;

      const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      const auditMsg = `${now}: Changed status ${current.status} → ${newStatus}`;

      return {
        ...prev,
        [studentId]: {
          ...current,
          status: newStatus,
          auditTrail: [...(current.auditTrail || []), auditMsg],
        },
      };
    });

    setUnsavedChangesCount((prev) => prev + 1);
  };

  // CHANGE INDIVIDUAL NOTE / REASON
  const handleNoteChange = (studentId: string, note: string) => {
    if (sessionStatus === "FINALIZED") return;

    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: "PRESENT", note: "" }),
        note,
      },
    }));

    setUnsavedChangesCount((prev) => prev + 1);
  };

  // BATCH SAVE ATTENDANCE (1 HTTP Request + Audit Trail)
  const handleSaveAttendance = async () => {
    setIsSaving(true);
    // Simulate batch payload request
    await new Promise((res) => setTimeout(res, 600));

    setIsSaving(false);
    setSessionStatus("FINALIZED");
    setUnsavedChangesCount(0);
    const nowTime = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    setLastSavedAt(nowTime);

    toast.success(`Đã khóa & chốt điểm danh Buổi ${currentSession} thành công!`);
  };

  // UNLOCK SESSION FOR EDITING
  const handleUnlockSession = () => {
    setSessionStatus("DRAFT");
    toast.info(`Đã mở lại điểm danh Buổi ${currentSession} để chỉnh sửa`);
  };

  // STATS CALCULATIONS (Loại trừ học viên PAUSED / SUSPENDED chưa override khỏi tổng số active)
  const activeStudentsList = students.filter((s: any) => s.enrollmentStatus === "ACTIVE" || overrideMap[s.id]);
  const presentCount = activeStudentsList.filter((s: any) => (attendanceMap[s.id]?.status || "PRESENT") === "PRESENT").length;
  const lateCount = activeStudentsList.filter((s: any) => attendanceMap[s.id]?.status === "LATE").length;
  const excusedCount = activeStudentsList.filter((s: any) => attendanceMap[s.id]?.status === "EXCUSED").length;
  const absentCount = activeStudentsList.filter((s: any) => attendanceMap[s.id]?.status === "ABSENT").length;

  return (
    <div className="space-y-4 pt-2">
      {/* 1. STICKY HEADER & LESSON TIMELINE */}
      <AttendanceHeader
        currentSession={currentSession}
        totalSessions={totalSessions}
        sessionDate={new Date().toLocaleDateString("vi-VN")}
        sessionStatus={sessionStatus}
        totalStudents={activeStudentsList.length}
        presentCount={presentCount}
        lateCount={lateCount}
        excusedCount={excusedCount}
        absentCount={absentCount}
        classNote={classNote}
        onSaveClassNote={(note) => {
          setClassNote(note);
          toast.success("Đã cập nhật Ghi chú chung buổi học!");
        }}
        onToggleSessionStatus={() => {
          if (sessionStatus === "FINALIZED") handleUnlockSession();
          else handleSaveAttendance();
        }}
        onSelectSession={(num) => setCurrentSession(num)}
      />

      {/* 2. ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border bg-muted/20">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={sessionStatus === "FINALIZED"}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
            onClick={handleMarkAllPresent}
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            ⚡ Tất cả có mặt
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-card hover:bg-muted"
            onClick={() => toast.info("Đã gửi thông báo nhắc nhở chuyên cần đến học viên vắng mặt!")}
          >
            <Send className="h-3.5 w-3.5 text-blue-600" />
            📤 Gửi nhắc nhở
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={sessionStatus === "FINALIZED"}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
            onClick={handleResetAttendance}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại
          </Button>
        </div>

        {/* NOTION-STYLE SAVE INDICATOR */}
        <div className="flex items-center gap-3 text-xs">
          {unsavedChangesCount > 0 ? (
            <span className="text-amber-600 font-medium flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Có {unsavedChangesCount} thay đổi chưa lưu
            </span>
          ) : lastSavedAt ? (
            <span className="text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              Đã lưu lúc {lastSavedAt}
            </span>
          ) : null}

          {sessionStatus === "FINALIZED" ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
              onClick={handleUnlockSession}
            >
              <Unlock className="h-3.5 w-3.5 text-amber-600" />
              Mở lại điểm danh
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isSaving}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
              onClick={handleSaveAttendance}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {unsavedChangesCount > 0 ? "Lưu kết quả điểm danh" : "Khóa & Chốt điểm danh"}
            </Button>
          )}
        </div>
      </div>

      {/* 3. STUDENT ATTENDANCE TABLE */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[200px]">Học viên</TableHead>
              <TableHead className="w-[120px]">Chuyên cần %</TableHead>
              <TableHead className="w-[110px]">Nghỉ liên tiếp</TableHead>
              <TableHead className="w-[160px]">Homework hiện tại</TableHead>
              <TableHead className="w-[180px]">Trạng thái điểm danh</TableHead>
              <TableHead className="text-right">Lý do & Thao tác 📝</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student: any) => {
              const currentData = attendanceMap[student.id] || { status: "PRESENT", note: "" };
              const isLocked = sessionStatus === "FINALIZED";
              const isPaused = student.enrollmentStatus === "PAUSED";
              const isSuspended = student.enrollmentStatus === "SUSPENDED";
              const isOverridden = !!overrideMap[student.id];

              // Color badge for Attendance %
              const pct = student.attendancePct || 90;
              const pctBadgeClass =
                pct >= 90
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : pct >= 80
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200";

              // Consecutive absences indicator
              const consec = student.consecutiveAbsences || 0;

              return (
                <TableRow
                  key={student.id}
                  className={
                    isLocked
                      ? "opacity-90 bg-muted/10"
                      : (isPaused || isSuspended) && !isOverridden
                      ? "bg-muted/30 opacity-75"
                      : ""
                  }
                >
                  {/* Học viên */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatarUrl} />
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800 font-semibold">
                          {student.fullName?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          {student.fullName}
                          {isPaused && (
                            <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1 py-0 font-normal">
                              ⏸️ PAUSED
                            </Badge>
                          )}
                          {isSuspended && (
                            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 border-slate-300 px-1 py-0 font-normal">
                              🚫 SUSPENDED
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Attendance % */}
                  <TableCell>
                    {isPaused || isSuspended ? (
                      <span className="text-xs font-medium text-muted-foreground">--</span>
                    ) : (
                      <Badge variant="outline" className={`text-xs font-semibold ${pctBadgeClass}`}>
                        {pct}%
                      </Badge>
                    )}
                  </TableCell>

                  {/* Nghỉ liên tiếp */}
                  <TableCell>
                    {isPaused || isSuspended ? (
                      <span className="text-xs text-muted-foreground">--</span>
                    ) : consec > 0 ? (
                      <Badge
                        variant="secondary"
                        className={`text-xs font-bold ${
                          consec >= 3
                            ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {consec >= 3 ? `🔥🔥 ${consec}` : `🔥 ${consec}`}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">0</span>
                    )}
                  </TableCell>

                  {/* Homework status */}
                  <TableCell>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {student.hwStatus || "HW 12: 🟢 Đã nộp"}
                    </span>
                  </TableCell>

                  {/* Status Dropdown (Enum / Blocked unless Overridden) */}
                  <TableCell>
                    {(isPaused || isSuspended) && !isOverridden ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200 py-1 font-medium">
                          {isPaused ? `⏸️ Tạm nghỉ đến ${student.pauseUntil || "28/08"}` : "🚫 Tạm ngưng học phí"}
                        </Badge>
                      </div>
                    ) : (
                      <Select
                        disabled={isLocked}
                        value={currentData.status}
                        onValueChange={(val: AttendanceStatus) => handleStatusChange(student.id, val)}
                      >
                        <SelectTrigger className="h-8 text-xs font-medium w-[150px] border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT" className="text-xs font-semibold text-emerald-700">
                            🟢 Có mặt
                          </SelectItem>
                          <SelectItem value="LATE" className="text-xs font-semibold text-amber-700">
                            🟡 Đi muộn
                          </SelectItem>
                          <SelectItem value="EXCUSED" className="text-xs font-semibold text-blue-700">
                            🔵 Vắng có phép
                          </SelectItem>
                          <SelectItem value="ABSENT" className="text-xs font-semibold text-rose-700">
                            🔴 Vắng không phép
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  {/* Lý do nghỉ, Manual Override & Ghi chú cá nhân */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {(isPaused || isSuspended) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isLocked}
                          className={`h-7 text-[11px] px-2 ${
                            isOverridden
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-card text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => handleToggleOverride(student.id)}
                        >
                          {isOverridden ? "⚡ Đã Override" : "⚡ Override điểm danh"}
                        </Button>
                      )}

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 text-xs gap-1 ${
                              currentData.note
                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {currentData.note ? currentData.note : "Ghi chú"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3 space-y-2.5" align="end">
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span>Ghi chú & Lý do ({student.fullName})</span>
                          </div>

                          {/* Quick Reason presets for EXCUSED / ABSENT */}
                          {(currentData.status === "EXCUSED" || currentData.status === "ABSENT") && (
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-muted-foreground">Lý do phổ biến:</label>
                              <div className="flex flex-wrap gap-1">
                                {["Ốm dài hạn", "Thi ở trường", "Công việc", "Gia đình", "Tài chính"].map((reason) => (
                                  <Button
                                    key={reason}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] px-1.5 py-0"
                                    onClick={() => handleNoteChange(student.id, reason)}
                                  >
                                    + {reason}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          <Textarea
                            disabled={isLocked}
                            placeholder="Nhập chi tiết lý do nghỉ hoặc ghi chú cá nhân..."
                            value={currentData.note}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            className="text-xs min-h-[60px]"
                          />

                          {currentData.auditTrail && currentData.auditTrail.length > 0 && (
                            <div className="pt-1 border-t text-[10px] text-muted-foreground space-y-0.5">
                              <span className="font-semibold text-slate-600">Audit Trail:</span>
                              {currentData.auditTrail.map((log, idx) => (
                                <div key={idx} className="font-mono">
                                  • {log}
                                </div>
                              ))}
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


