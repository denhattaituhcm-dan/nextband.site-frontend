import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { deriveSubmissionTiming } from '@/lib/homeworkStatusHelper';

interface SubmissionHeaderProps {
  student: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  exam: {
    title: string;
    exam_type: string;
  } | null;
  status: string | null;
  submittedAt: string | null;
  deadline?: string | null;
}

export function SubmissionHeader({ student, exam, status, submittedAt, deadline }: SubmissionHeaderProps) {
  const timing = deriveSubmissionTiming(submittedAt, deadline);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-emerald-600 text-white font-bold">Đã chấm</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">Đã nộp</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Đang làm</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student?.avatar_url || undefined} />
          <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold">{student?.full_name || 'Chưa đặt tên'}</h1>
          <p className="text-sm text-muted-foreground">{student?.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{exam?.title}</span>
          <Badge variant="secondary" className="ml-1">{exam?.exam_type?.toUpperCase()}</Badge>
        </div>
        {submittedAt && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(submittedAt).toLocaleString('vi-VN')}</span>
          </div>
        )}
        {submittedAt && (
          timing.isLate ? (
            <Badge variant="destructive" className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-300 font-bold gap-1">
              <AlertCircle className="h-3 w-3" />
              Nộp trễ {timing.lateDays} ngày
            </Badge>
          ) : (
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Nộp đúng hạn
            </Badge>
          )
        )}
        {getStatusBadge(status)}
      </div>
    </div>
  );
}

