import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StudentDrawer } from "../features/students/StudentDrawer";
import { AddStudentModal } from "../features/students/AddStudentModal";
import { Users, Eye, UserPlus } from "lucide-react";

export const StudentsTab: React.FC = () => {
  const { classData, isAddStudentModalOpen, setIsAddStudentModalOpen } = useWorkspace();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const students = classData?.students || [];
  const lessons = classData?.lessons || [];
  const totalHomeworks = lessons.length;

  const handleOpenProfile = (student: any) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          Danh sách học viên lớp ({students.length})
        </h3>
        <Button
          size="sm"
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          onClick={() => setIsAddStudentModalOpen(true)}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Thêm học viên vào lớp
        </Button>
      </div>

      {students.length === 0 ? (
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
                <TableHead>Tiến độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student: any) => {
                const completedHw = student.completedHw || 0;
                const progressPct = totalHomeworks > 0 ? Math.round((completedHw / totalHomeworks) * 100) : 0;

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
                        {progressPct}%
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
