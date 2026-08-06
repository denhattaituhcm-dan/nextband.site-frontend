import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit3 } from "lucide-react";

export interface PendingSubmission {
  id: string;
  studentName: string;
  submittedAt: string;
}

interface PendingSubmissionsListProps {
  homeworkTitle: string;
  pendingSubmissions: PendingSubmission[];
  onGradeClick: () => void;
}

export const PendingSubmissionsList: React.FC<PendingSubmissionsListProps> = ({
  homeworkTitle,
  pendingSubmissions,
  onGradeClick,
}) => {
  return (
    <div className="pt-4 border-t space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-emerald-600" />
          Bài nộp thuộc {homeworkTitle} ({pendingSubmissions.length} bài chờ chấm)
        </h4>
        {pendingSubmissions.length > 0 && (
          <Badge className="bg-amber-500 text-white text-[10px]">
            {pendingSubmissions.length} bài chờ phản hồi
          </Badge>
        )}
      </div>

      {pendingSubmissions.length === 0 ? (
        <div className="p-3.5 rounded-xl border bg-muted/20 text-center text-xs text-muted-foreground">
          🎉 Không có bài nộp nào đang chờ chấm ở bài học này.
        </div>
      ) : (
        <div className="space-y-2">
          {pendingSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="p-3 rounded-xl border bg-card flex items-center justify-between hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-emerald-100 text-emerald-800 font-bold">
                    {sub.studentName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {sub.studentName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Nộp lúc: {sub.submittedAt}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onGradeClick}
              >
                <Edit3 className="h-3.5 w-3.5" />
                ✍️ Chấm ngay
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
