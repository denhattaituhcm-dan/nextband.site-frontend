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
import { CheckCircle2, MessageSquare, Clock } from "lucide-react";

interface StudentDrawerProps {
  student: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  student,
  open,
  onOpenChange,
}) => {
  if (!student) return null;

  // Mock feedback history
  const feedbackHistory = [
    { hw: "Homework 12", date: "Hôm qua", status: "✓ Đã phản hồi", note: "Phần Speaking phát âm trọng âm từ rất tốt." },
    { hw: "Homework 11", date: "3 ngày trước", status: "✓ Đã phản hồi", note: "Listening còn mất tập trung ở Section 4." },
    { hw: "Homework 10", date: "1 tuần trước", status: "✓ Đã phản hồi", note: "Bài nộp đầy đủ, từ vựng đa dạng." },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-6 overflow-y-auto space-y-6">
        <SheetHeader className="px-0 pt-0 border-b pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatarUrl} />
              <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">
                {student.fullName?.slice(0, 2).toUpperCase() || "HV"}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl font-bold">{student.fullName}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{student.email}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs text-emerald-600 bg-emerald-50">
                  Active Student
                </Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* 27 Homework Progress Strip */}
        <HomeworkProgressStrip
          totalHomeworks={27}
          completedCount={12}
          onSelectHomework={(hwNum) => alert(`Mở chi tiết Homework ${hwNum}`)}
        />

        {/* Teacher Feedback History Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            Lịch sử nhận xét của giáo viên
          </h4>
          <div className="space-y-3 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
            {feedbackHistory.map((item, idx) => (
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
