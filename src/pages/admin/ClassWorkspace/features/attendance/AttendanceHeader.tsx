import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Users, CheckCircle2, Clock, XCircle, AlertCircle, Lock, Unlock, MessageSquare } from "lucide-react";

interface AttendanceHeaderProps {
  currentSession: number;
  totalSessions: number;
  sessionDate: string;
  sessionStatus: "DRAFT" | "FINALIZED";
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  classNote: string;
  onSaveClassNote: (note: string) => void;
  onToggleSessionStatus: () => void;
  onSelectSession: (sessionNum: number) => void;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  currentSession,
  totalSessions,
  sessionDate,
  sessionStatus,
  totalStudents,
  presentCount,
  lateCount,
  excusedCount,
  absentCount,
  classNote,
  onSaveClassNote,
  onToggleSessionStatus,
  onSelectSession,
}) => {
  const [tempNote, setTempNote] = useState(classNote);
  const [noteOpen, setNoteOpen] = useState(false);

  const presentPct = totalStudents ? Math.round((presentCount / totalStudents) * 100) : 0;
  const latePct = totalStudents ? Math.round((lateCount / totalStudents) * 100) : 0;
  const excusedPct = totalStudents ? Math.round((excusedCount / totalStudents) * 100) : 0;
  const absentPct = totalStudents ? Math.round((absentCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 1. LESSON TIMELINE STRIP */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b">
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap mr-1">Buổi học:</span>
        {Array.from({ length: totalSessions }, (_, i) => i + 1).map((num) => {
          const isCurrent = num === currentSession;
          return (
            <button
              key={num}
              onClick={() => onSelectSession(num)}
              className={`h-7 min-w-[32px] px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center ${
                isCurrent
                  ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* 2. MAIN SESSION HEADER & STATS */}
      <div className="flex flex-wrap items-center justify-between p-4 rounded-xl border bg-card gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Buổi {currentSession} / {totalSessions}
            </h4>
            <Badge variant="outline" className="text-xs">
              {sessionDate}
            </Badge>

            {sessionStatus === "FINALIZED" ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1 hover:bg-emerald-100">
                <Lock className="h-3 w-3 text-emerald-600" />
                Đã chốt điểm danh
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200">
                <Unlock className="h-3 w-3 text-amber-600" />
                Đang điểm danh (Draft)
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Thống kê chuyên cần của lớp trong buổi học</span>
            <span>•</span>
            <Popover open={noteOpen} onOpenChange={setNoteOpen}>
              <PopoverTrigger asChild>
                <button className="text-emerald-600 font-medium hover:underline flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {classNote ? "Ghi chú buổi học ✓" : "+ Thêm Ghi chú buổi học"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 space-y-2" align="start">
                <h5 className="text-xs font-semibold text-foreground">Ghi chú chung buổi học</h5>
                <Textarea
                  placeholder="Nhập ghi chú giảng dạy, dặn dò bài tập cho cả lớp..."
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  className="text-xs min-h-[80px]"
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNoteOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      onSaveClassNote(tempNote);
                      setNoteOpen(false);
                    }}
                  >
                    Lưu ghi chú
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* STATS SUMMARY BADGES */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium px-2.5 py-1 bg-muted/40 rounded-lg">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Tổng: {totalStudents} HV</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-emerald-600 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Có mặt: {presentCount} ({presentPct}%)</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-amber-600 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100">
            <Clock className="h-3.5 w-3.5" />
            <span>Muộn: {lateCount} ({latePct}%)</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-blue-600 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Có phép: {excusedCount} ({excusedPct}%)</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-rose-600 px-2.5 py-1 bg-rose-50 rounded-lg border border-rose-100">
            <XCircle className="h-3.5 w-3.5" />
            <span>Vắng: {absentCount} ({absentPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

