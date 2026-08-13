import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentDrawer } from "../features/students/StudentDrawer";
import { AddStudentModal } from "../features/students/AddStudentModal";
import { AttendanceSheet } from "../features/attendance/AttendanceSheet";
import { AttendanceMatrix } from "../features/attendance/AttendanceMatrix";
import { Users, Eye, UserPlus, CalendarCheck, Grid, List } from "lucide-react";

export const StudentsTab: React.FC = () => {
  const { classData, isAddStudentModalOpen, setIsAddStudentModalOpen } = useWorkspace();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subTab, setSubTab] = useState<string>("list");
  const [refreshMatrixTrigger, setRefreshMatrixTrigger] = useState<number>(0);

  const students = classData?.students || [];
  const lessons = classData?.lessons || [];
  const sessions = classData?.sessions || [];
  const totalHomeworks = lessons.length;
  const classId = classData?.id || "";

  const handleOpenProfile = (student: any) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  const handleRefreshMatrix = () => {
    setRefreshMatrixTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={subTab} onValueChange={setSubTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 p-1 h-9 rounded-lg">
            <TabsTrigger value="list" className="text-xs font-semibold px-3 py-1 gap-1.5">
              <List className="h-3.5 w-3.5" />
              Danh sách học viên ({students.length})
            </TabsTrigger>
            <TabsTrigger value="sheet" className="text-xs font-semibold px-3 py-1 gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
              Điểm danh theo buổi
            </TabsTrigger>
            <TabsTrigger value="matrix" className="text-xs font-semibold px-3 py-1 gap-1.5">
              <Grid className="h-3.5 w-3.5 text-indigo-600" />
              Ma trận chuyên cần
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {subTab === "list" && (
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            onClick={() => setIsAddStudentModalOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Thêm học viên vào lớp
          </Button>
        )}
      </div>

      {/* SUB TAB 1: STUDENT LIST */}
      {subTab === "list" && (
        students.length === 0 ? (
          <div className="p-12 border rounded-xl bg-card text-center space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="text-base font-bold">Chưa có học viên nào</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Lớp học này hiện tại chưa có học viên. Nhấn nút "Thêm học viên vào lớp" bên trên để bắt đầu thêm học viên.
            </p>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => setIsAddStudentModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Thêm học viên ngay
            </Button>
          </div>
        ) : (
          <div className="border rounded-xl bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Homework hiện tại</TableHead>
                  <TableHead>Chuyên cần (%)</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => {
                  const completedHw = student.completedHw || 0;
                  const attendanceRate = student.attendanceRate !== undefined ? student.attendanceRate : 100;

                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOpenProfile(student)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={student.avatar_url || student.avatarUrl} />
                            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                              {(student.full_name || student.fullName || student.email || "HV")?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{student.full_name || student.fullName || student.email}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {totalHomeworks > 0 ? `HW ${completedHw} / ${totalHomeworks}` : "Chưa có HW"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-emerald-600">
                          {attendanceRate}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {student.is_active === false || student.status === "suspended" ? (
                          <Badge variant="outline" className="text-xs text-rose-600 bg-rose-50 border-rose-200">
                            Tạm nghỉ
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-emerald-600 bg-emerald-50 border-emerald-200">
                            Đang học
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleOpenProfile(student)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Timeline Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      )}

      {/* SUB TAB 2: ATTENDANCE SHEET */}
      {subTab === "sheet" && (
        <AttendanceSheet
          classId={classId}
          sessions={sessions}
          onRefreshMatrix={handleRefreshMatrix}
        />
      )}

      {/* SUB TAB 3: ATTENDANCE MATRIX */}
      {subTab === "matrix" && (
        <AttendanceMatrix
          classId={classId}
          refreshTrigger={refreshMatrixTrigger}
        />
      )}

      <StudentDrawer
        student={selectedStudent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <AddStudentModal
        open={isAddStudentModalOpen}
        onOpenChange={setIsAddStudentModalOpen}
      />
    </div>
  );
};
