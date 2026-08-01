import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, ClassSession, SessionStatus } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  MoreVertical,
  Loader2,
  CalendarDays,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const RESCHEDULE_REASONS = [
  { value: "HOLIDAY", label: "🗓️ Nghỉ lễ" },
  { value: "TEACHER_BUSY", label: "👨‍🏫 Giáo viên bận" },
  { value: "MAKEUP", label: "📚 Học bù" },
  { value: "FACILITY", label: "🏢 Cơ sở vật chất" },
  { value: "OTHER", label: "✏️ Khác" },
];

function SessionStatusBadge({ status }: { status: SessionStatus }) {
  switch (status) {
    case "PLANNED":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 gap-1.5">
          <Clock className="h-3 w-3" />
          Sắp diễn ra
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-emerald-600 text-white gap-1.5">
          <CheckCircle2 className="h-3 w-3" />
          Đã học
        </Badge>
      );
    case "RESCHEDULED":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1.5">
          <RotateCcw className="h-3 w-3" />
          Đã dời
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50 gap-1.5">
          <XCircle className="h-3 w-3" />
          Đã hủy
        </Badge>
      );
  }
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function getDayName(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const names = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return names[dow];
}

interface RescheduleDialogProps {
  session: ClassSession | null;
  onClose: () => void;
  onConfirm: (newDate: string, reason: string, note: string) => void;
  isSaving: boolean;
}

function RescheduleDialog({ session, onClose, onConfirm, isSaving }: RescheduleDialogProps) {
  const [newDate, setNewDate] = useState(session?.plannedDate || "");
  const [reason, setReason] = useState("HOLIDAY");
  const [note, setNote] = useState("");

  React.useEffect(() => {
    if (session) {
      setNewDate(session.plannedDate);
      setReason("HOLIDAY");
      setNote("");
    }
  }, [session?.id]);

  if (!session) return null;

  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-500" />
            Dời lịch Buổi {session.sessionNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ngày hiện tại:</span>
              <span className="font-semibold">{getDayName(session.plannedDate)}, {fmtDate(session.plannedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giờ học:</span>
              <span className="font-semibold">{session.startTime} – {session.endTime}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Ngày học mới *
            </Label>
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lý do dời lịch *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RESCHEDULE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Ghi chú thêm (tùy chọn)</Label>
            <Textarea
              placeholder="VD: Trường nghỉ lễ 30/4, dời sang thứ 7..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button
            onClick={() => onConfirm(newDate, reason, note)}
            disabled={!newDate || !reason || isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận dời lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const SessionsTab: React.FC = () => {
  const { classId } = useWorkspace();
  const queryClient = useQueryClient();
  const [reschedulingSession, setReschedulingSession] = useState<ClassSession | null>(null);

  const {
    data: sessions = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["class-sessions", classId],
    queryFn: () => sessionsApi.list(classId),
    enabled: !!classId,
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ sessionId, newDate, reason }: { sessionId: string; newDate: string; reason: string }) =>
      sessionsApi.reschedule(sessionId, newDate, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions", classId] });
      toast.success("Đã dời lịch buổi học thành công");
      setReschedulingSession(null);
    },
    onError: (err: any) => { toast.error("Lỗi dời lịch: " + (err.message || "Không xác định")); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: SessionStatus }) =>
      sessionsApi.updateStatus(sessionId, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions", classId] });
      const msg = status === "COMPLETED" ? "Đánh dấu đã học" : status === "CANCELLED" ? "Đã hủy buổi" : "Đã cập nhật";
      toast.success(msg);
    },
    onError: (err: any) => { toast.error("Lỗi: " + (err.message || "Không xác định")); },
  });

  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const rescheduledCount = sessions.filter((s) => s.status === "RESCHEDULED").length;
  const upcomingCount = sessions.filter((s) => s.status === "PLANNED").length;
  const cancelledCount = sessions.filter((s) => s.status === "CANCELLED").length;

  const stats = [
    { label: "Đã học", value: completedCount, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Sắp tới", value: upcomingCount, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Đã dời", value: rescheduledCount, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Đã hủy", value: cancelledCount, color: "text-red-500", bg: "bg-red-50" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        Đang tải lịch học...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <p>Không thể tải lịch học.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <CalendarDays className="h-10 w-10 text-slate-300" />
        <p className="font-medium">Lớp này chưa có lịch học.</p>
        <p className="text-sm text-center max-w-sm">
          Hãy tạo lại lớp với Lịch học hàng tuần, hoặc liên hệ Admin để sinh lịch tự động.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-center justify-between border`}>
            <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-16 text-center">Buổi</TableHead>
              <TableHead>Ngày học</TableHead>
              <TableHead>Giờ học</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const isToday = session.plannedDate === new Date().toISOString().split("T")[0];
              return (
                <TableRow key={session.id} className={`transition-colors ${isToday ? "bg-emerald-50/60" : ""}`}>
                  <TableCell className="text-center">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      session.status === "COMPLETED" ? "bg-emerald-600 text-white" :
                      session.status === "CANCELLED" ? "bg-red-100 text-red-500" :
                      session.status === "RESCHEDULED" ? "bg-amber-100 text-amber-600" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {session.sessionNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-800">
                      {getDayName(session.plannedDate)}, {fmtDate(session.plannedDate)}
                    </div>
                    {isToday && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                        <Zap className="h-3 w-3" /> Hôm nay
                      </span>
                    )}
                    {session.rescheduleReason && (
                      <div className="text-xs text-amber-600 mt-0.5">
                        ↺ {RESCHEDULE_REASONS.find((r) => r.value === session.rescheduleReason)?.label || session.rescheduleReason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {session.startTime} – {session.endTime}
                  </TableCell>
                  <TableCell><SessionStatusBadge status={session.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                    {session.note || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {session.status !== "COMPLETED" && (
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status: "COMPLETED" })}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                            Đánh dấu Đã học
                          </DropdownMenuItem>
                        )}
                        {session.status !== "CANCELLED" && (
                          <DropdownMenuItem onClick={() => setReschedulingSession(session)}>
                            <RotateCcw className="mr-2 h-4 w-4 text-amber-500" />
                            Dời lịch buổi này
                          </DropdownMenuItem>
                        )}
                        {session.status !== "PLANNED" && session.status !== "COMPLETED" && (
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status: "PLANNED" })}>
                            <Clock className="mr-2 h-4 w-4 text-blue-500" />
                            Khôi phục Sắp tới
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {session.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status: "CANCELLED" })}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Hủy buổi học
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <RescheduleDialog
        session={reschedulingSession}
        onClose={() => setReschedulingSession(null)}
        onConfirm={(newDate, reason, _note) =>
          rescheduleMutation.mutate({ sessionId: reschedulingSession!.id, newDate, reason })
        }
        isSaving={rescheduleMutation.isPending}
      />
    </div>
  );
};
