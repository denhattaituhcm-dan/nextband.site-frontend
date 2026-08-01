import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { AttendanceHeader } from "../features/attendance/AttendanceHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Save, ClipboardCheck } from "lucide-react";

export const AttendanceTab: React.FC = () => {
  const { classData } = useWorkspace();
  const { toast } = useToast();

  const students = classData?.students || [
    { id: "1", fullName: "Nguyễn Văn An", email: "an@gmail.com" },
    { id: "2", fullName: "Trần Thị Bình", email: "binh@gmail.com" },
    { id: "3", fullName: "Lê Văn Cường", email: "cuong@gmail.com" },
  ];

  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({
    "1": "present",
    "2": "present",
    "3": "absent",
  });

  const toggleStatus = (id: string, status: "present" | "absent") => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleSaveAttendance = () => {
    toast({ title: "Điểm danh thành công!", description: "Dữ liệu điểm danh đã được cập nhật." });
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;

  return (
    <div className="space-y-4 pt-2">
      {/* Attendance Summary Header */}
      <AttendanceHeader
        lessonTitle="Lesson 12 / Homework 12"
        date={new Date().toLocaleDateString("vi-VN")}
        totalStudents={students.length}
        presentCount={presentCount}
        absentCount={absentCount}
      />

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Học viên</TableHead>
              <TableHead className="text-center">Trạng thái điểm danh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student: any) => {
              const currentStatus = attendance[student.id] || "present";
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                          {student.fullName?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{student.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant={currentStatus === "present" ? "default" : "outline"}
                        className={currentStatus === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-xs h-7" : "text-xs h-7"}
                        onClick={() => toggleStatus(student.id, "present")}
                      >
                        ✓ Có mặt
                      </Button>
                      <Button
                        size="sm"
                        variant={currentStatus === "absent" ? "destructive" : "outline"}
                        className="text-xs h-7"
                        onClick={() => toggleStatus(student.id, "absent")}
                      >
                        ❌ Vắng mặt
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5" onClick={handleSaveAttendance}>
          <Save className="h-3.5 w-3.5" />
          Lưu kết quả điểm danh
        </Button>
      </div>
    </div>
  );
};
