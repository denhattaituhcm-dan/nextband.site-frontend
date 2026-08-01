import React, { useState } from "react";
import { useWorkspace } from "../WorkspaceProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StudentDrawer } from "../features/students/StudentDrawer";
import { Users, Eye, CheckCircle2 } from "lucide-react";

export const StudentsTab: React.FC = () => {
  const { classData } = useWorkspace();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const students = classData?.students || [
    { id: "1", fullName: "Nguyễn Văn An", email: "an@gmail.com", status: "active", completedHw: 12 },
    { id: "2", fullName: "Trần Thị Bình", email: "binh@gmail.com", status: "active", completedHw: 10 },
    { id: "3", fullName: "Lê Văn Cường", email: "cuong@gmail.com", status: "suspended", completedHw: 8 },
  ];

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
      </div>

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
            {students.map((student: any) => (
              <TableRow
                key={student.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleOpenProfile(student)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800">
                        {student.fullName?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{student.fullName}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium">
                    HW {student.completedHw || 12} / 27
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-emerald-600">
                    {Math.round(((student.completedHw || 12) / 27) * 100)}%
                  </span>
                </TableCell>
                <TableCell>
                  {student.status === "suspended" ? (
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
            ))}
          </TableBody>
        </Table>
      </div>

      <StudentDrawer
        student={selectedStudent}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
};
