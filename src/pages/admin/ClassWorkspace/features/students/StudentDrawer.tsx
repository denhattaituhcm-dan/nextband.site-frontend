import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HomeworkProgressStrip } from "./HomeworkProgressStrip";
import { CheckCircle2, MessageSquare, Clock, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentDrawerProps {
  student: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveStudent?: (student: any) => void;
}

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  student,
  open,
  onOpenChange,
  onRemoveStudent,
}) => {
  if (!student) return null;

  // Feedback history from real submissions
  const feedbackHistory: any[] = student?.feedbackHistory || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-6 overflow-y-auto space-y-6">
        <SheetHeader className="px-0 pt-0 border-b pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatarUrl || student.avatar_url} />
              <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">
                {(student.fullName || student.full_name || student.email || "HV")?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl font-bold">{student.fullName || student.full_name || student.email}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{student.email}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs text-emerald-600 bg-emerald-50">
                  {student.is_active === false ? "Tạm nghỉ" : "Active Student"}
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Homework Progress Strip */}
        <HomeworkProgressStrip
          totalHomeworks={student.totalHomeworks || 0}
          completedCount={student.completedHw || 0}
          onSelectHomework={(hwNum) => alert(`Chi tiết Homework ${hwNum}`)}
        />

        {/* Teacher Feedback History Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            Lịch sử nhận xét của giáo viên
          </h4>
          {feedbackHistory.length === 0 ? (
            <div className="p-6 border rounded-lg bg-muted/20 text-center text-xs text-muted-foreground">
              Chưa có nhận xét nào cho học viên này.
            </div>
          ) : (
            <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
              {feedbackHistory.map((item: any, idx: number) => (
                <div key={idx} className="relative pl-4 space-y-1">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.hw}</span>
                    <span className="text-muted-foreground">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-muted/40 p-2.5 rounded-md">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Membership Action */}
        {onRemoveStudent && (
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <div>
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <UserMinus className="h-3.5 w-3.5 text-rose-600" />
                  Rút học viên khỏi lớp
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Gỡ học viên khỏi lớp này. Hồ sơ và bài làm tổng thể vẫn được bảo lưu.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 text-xs shrink-0"
                onClick={() => onRemoveStudent(student)}
              >
                Đưa ra khỏi lớp
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
