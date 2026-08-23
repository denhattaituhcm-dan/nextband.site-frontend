import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { classesApi, examsApi, submissionsApi, formatStorageUrl } from "@/lib/api";
import { deriveHomeworkStatus, HomeworkStatus } from "@/types/homework";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  School,
  User,
  BookOpen,
  Calendar,
  Send,
  Loader2,
  RefreshCw,
  GraduationCap,
  Award,
  ChevronRight,
  FolderOpen,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { ProgressReportModal } from "@/components/admin/ProgressReportModal";
import { mapToProgressReportData } from "@/lib/progressReportMapper";
import { deriveSubmissionTiming } from "@/lib/homeworkStatusHelper";
import { SentenceLevelGrader } from "@/components/grading/SentenceLevelGrader";
import {
  SentenceFeedbackItem,
  parseStructuredFeedback,
} from "@/lib/sentenceFeedback";

// Model Workbook Homework Item (Gắn với Buổi học / Lesson)
interface WorkbookItem {
  id: string;
  submissionId?: string;
  answerId?: string;
  lessonNumber: number;
  lessonTitle: string;
  orderIndex: number;
  title: string;
  type: "writing" | "speaking" | "homework";
  dueDate?: string;
  status: "unsubmitted" | "in_progress" | "submitted" | "graded" | "needs_revision";
  isOverdue: boolean;
  submissionTiming?: {
    isLate: boolean;
    lateDays: number;
  };
  score?: number;
  feedback?: string;
  primaryErrorCategory?: "CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR" | null;
  revisionRequired?: boolean;
  sentenceFeedbacks?: SentenceFeedbackItem[];
  submittedAt?: string;
  answerText?: string;
  audioUrl?: string;
  objectiveScore?: number;
  bandScore?: number;
  criteriaScores?: any;
}

export default function TeacherWorkspace() {
  const { toast } = useToast();

  // State quản lý lựa chọn
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string>("");
  const [studentFilter, setStudentFilter] = useState<"all" | "pending">("all");

  // State Quản lý popup Gia hạn từng bài
  const [reopenTargetId, setReopenTargetId] = useState<string | null>(null);
  const [reopenDate, setReopenDate] = useState<string>("");

  // Form Chấm Điểm
  const [taskResponse, setTaskResponse] = useState<string>("");
  const [coherence, setCoherence] = useState<string>("");
  const [lexical, setLexical] = useState<string>("");
  const [grammar, setGrammar] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [primaryErrorCategory, setPrimaryErrorCategory] = useState<"CONCEPT" | "STRUCTURE" | "EXPRESSION" | "GRAMMAR">("STRUCTURE");
  const [revisionRequired, setRevisionRequired] = useState<boolean>(false);
  const [sentenceFeedbacks, setSentenceFeedbacks] = useState<SentenceFeedbackItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // 1. Fetch danh sách Lớp học phụ trách
  const { data: classesData, isLoading: isClassesLoading } = useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => {
      const res = await classesApi.list();
      return res.data || [];
    },
  });

  const classes = classesData || [];

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [selectedClassId, classes]);

  const currentClass = useMemo(() => {
    return classes.find((c: any) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  // 2. Fetch View Model dữ liệu thật từ Canonical APIs (Classes + Exams + Submissions)
  const { data: workspaceData, isLoading: isWorkspaceLoading, refetch: refetchWorkspace } = useQuery({
    queryKey: ["teacher-workspace-data", selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return null;
      const cls = await classesApi.getById(selectedClassId);
      if (!cls) return null;

      const courseId = cls.courseId || cls.course_id;
      let exams: any[] = [];
      if (courseId) {
        try {
          const examRes = await examsApi.list({ courseId, limit: 100 });
          exams = examRes.data || [];
        } catch (e) {
          console.warn("[TeacherWorkspace] Could not load exams:", e);
        }
      }

      let submissions: any[] = [];
      try {
        const subRes = await submissionsApi.list({ classId: selectedClassId, limit: 200 });
        submissions = subRes.data || [];
      } catch (e) {
        console.warn("[TeacherWorkspace] Could not load submissions:", e);
      }

      const rawStudents = cls.students || cls.class_students || [];
      const canonicalStudents = rawStudents.map((st: any) => {
        const studentId = st.studentId || st.student_id || st.id;
        const studentName = st.fullName || st.full_name || st.name || st.email || "Học viên";
        const avatarUrl = st.avatarUrl || st.avatar_url;

        const studentSubs = submissions.filter(
          (sub: any) => sub.studentId === studentId || sub.student_id === studentId,
        );

        const homeworks = exams.map((ex: any, idx: number) => {
          const sub = studentSubs.find(
            (s: any) => s.examId === ex.id || s.exam_id === ex.id,
          );
          const firstAnswer = sub?.answers?.[0];
          const rawFeedback = firstAnswer?.feedback || sub?.feedback || "";
          const structured = parseStructuredFeedback(rawFeedback);

          const isRevision = !!(structured.revisionRequired ?? firstAnswer?.revisionRequired ?? sub?.revisionRequired ?? sub?.revision_required);
          const canonicalStatus = deriveHomeworkStatus(
            sub ? { ...sub, revisionRequired: isRevision } : null,
          );
          const normalizedStatus =
            canonicalStatus === "REVISION_REQUIRED"
              ? "needs_revision"
              : canonicalStatus === "GRADED"
                ? "graded"
                : canonicalStatus === "SUBMITTED" || canonicalStatus === "GRADING"
                  ? "submitted"
                  : canonicalStatus === "IN_PROGRESS"
                    ? "in_progress"
                    : "unsubmitted";

          return {
            id: ex.id,
            submissionId: sub?.id,
            answerId: firstAnswer?.id || undefined,
            lessonNumber: ex.week || Math.ceil((idx + 1) / 2),
            lessonTitle: `Buổi ${ex.week || Math.ceil((idx + 1) / 2)}`,
            orderIndex: idx + 1,
            title: ex.title || `Bài tập ${String(idx + 1).padStart(2, "0")}`,
            type: ex.examType === "writing" ? "writing" : ex.examType === "speaking" ? "speaking" : "homework",
            status: normalizedStatus,
            isOverdue: false,
            score: sub?.totalScore ?? sub?.total_score ?? sub?.bandScore ?? null,
            bandScore: sub?.bandScore ?? sub?.band_score ?? null,
            objectiveScore: sub?.objectiveScore ?? sub?.objective_score ?? null,
            criteriaScores: structured.criteriaScores || firstAnswer?.criteriaScores || sub?.criteriaScores || null,
            feedback: structured.text || rawFeedback,
            primaryErrorCategory: structured.primaryErrorCategory || firstAnswer?.primaryErrorCategory || sub?.primaryErrorCategory || null,
            revisionRequired: isRevision,
            sentenceFeedbacks: structured.sentenceFeedbacks || [],
            submittedAt: sub?.submittedAt || sub?.submitted_at,
            answerText: firstAnswer?.answerText || firstAnswer?.studentAnswer || "",
            audioUrl: firstAnswer?.audioUrl || "",
          };
        });

        const submittedCount = homeworks.filter((h: any) => h.status === "submitted" || h.status === "graded").length;
        const gradedCount = homeworks.filter((h: any) => h.status === "graded").length;
        const pendingCount = homeworks.filter((h: any) => h.status === "submitted").length;
        const unsubmittedCount = homeworks.filter((h: any) => h.status === "unsubmitted").length;

        return {
          id: studentId,
          fullName: studentName,
          email: st.email || "",
          avatarUrl,
          totalAssignedCount: exams.length,
          submittedCount,
          gradedCount,
          pendingCount,
          unsubmittedCount,
          hasPending: pendingCount > 0,
          homeworks,
        };
      });

      return {
        students: canonicalStudents,
      };
    },
    enabled: !!selectedClassId,
  });

  // Normalize Danh sách Học viên thật từ CSDL
  const students = useMemo(() => {
    if (!workspaceData?.students) return [];
    return workspaceData.students.map((s: any) => ({
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      avatarUrl: s.avatarUrl,
      totalAssignedCount: s.totalAssignedCount || 0,
      submittedCount: s.submittedCount || 0,
      gradedCount: s.gradedCount || 0,
      pendingCount: s.pendingCount || 0,
      unsubmittedCount: s.unsubmittedCount || 0,
      hasPending: (s.pendingCount || 0) > 0,
      homeworks: s.homeworks || [],
    }));
  }, [workspaceData]);

  useEffect(() => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [selectedStudentId, students]);

  const filteredStudents = useMemo(() => {
    if (studentFilter === "pending") {
      return students.filter((s: any) => s.hasPending);
    }
    return students;
  }, [students, studentFilter]);

  const currentStudent = useMemo(() => {
    return students.find((s: any) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // 3. SỔ WORKBOOK DỮ LIỆU THẬT NHÓM THEO BUỔI HỌC (REAL WORKBOOK ITEMS)
  const workbookItems: WorkbookItem[] = useMemo(() => {
    if (!currentStudent || !currentStudent.homeworks) return [];
    return currentStudent.homeworks.map((hw: any, idx: number) => {
      const deadline = hw.dueDate || hw.deadline;
      const timing = deriveSubmissionTiming(hw.submittedAt, deadline);

      return {
        id: hw.id,
        lessonNumber: hw.lessonNumber || Math.ceil((idx + 1) / 2),
        lessonTitle: hw.lessonTitle || `Buổi ${Math.ceil((idx + 1) / 2)}`,
        orderIndex: idx + 1,
        title: hw.title,
        type: (hw.type || "writing") as "writing" | "speaking" | "homework",
        dueDate: deadline,
        status: (hw.status || "unsubmitted") as any,
        isOverdue: false,
        submissionTiming: timing,
        submissionId: hw.submissionId,
        answerId: hw.answerId,
        submittedAt: hw.submittedAt,
        answerText: hw.answerText,
        audioUrl: hw.audioUrl,
        objectiveScore: hw.objectiveScore,
        bandScore: hw.bandScore,
        criteriaScores: hw.criteriaScores,
        feedback: hw.feedback,
        primaryErrorCategory: hw.primaryErrorCategory,
        revisionRequired: hw.revisionRequired,
        sentenceFeedbacks: hw.sentenceFeedbacks || [],
        score: hw.bandScore != null ? hw.bandScore : hw.objectiveScore,
      };
    });
  }, [currentStudent]);

  // Gom nhóm Workbook theo Buổi học (Lesson)
  const groupedWorkbook = useMemo(() => {
    const map = new Map<number, { lessonTitle: string; items: WorkbookItem[] }>();
    workbookItems.forEach((item) => {
      if (!map.has(item.lessonNumber)) {
        map.set(item.lessonNumber, { lessonTitle: item.lessonTitle, items: [] });
      }
      map.get(item.lessonNumber)!.items.push(item);
    });
    return Array.from(map.entries()).map(([lessonNumber, data]) => ({
      lessonNumber,
      lessonTitle: data.lessonTitle,
      items: data.items,
    }));
  }, [workbookItems]);

  useEffect(() => {
    if (!selectedHomeworkId && workbookItems.length > 0) {
      const pendingHw = workbookItems.find((h) => h.status === "submitted") || workbookItems[0];
      setSelectedHomeworkId(pendingHw.id);
    }
  }, [selectedHomeworkId, workbookItems]);

  const currentHomework = useMemo(() => {
    return workbookItems.find((h) => h.id === selectedHomeworkId) || workbookItems[0];
  }, [workbookItems, selectedHomeworkId]);

  // Population Form Chấm điểm từ CSDL Thật
  useEffect(() => {
    if (currentHomework) {
      if (currentHomework.criteriaScores) {
        setTaskResponse(currentHomework.criteriaScores.taskResponse != null ? String(currentHomework.criteriaScores.taskResponse) : "");
        setCoherence(currentHomework.criteriaScores.coherence != null ? String(currentHomework.criteriaScores.coherence) : "");
        setLexical(currentHomework.criteriaScores.lexical != null ? String(currentHomework.criteriaScores.lexical) : "");
        setGrammar(currentHomework.criteriaScores.grammar != null ? String(currentHomework.criteriaScores.grammar) : "");
      } else {
        setTaskResponse("");
        setCoherence("");
        setLexical("");
        setGrammar("");
      }
      if (currentHomework.primaryErrorCategory) {
        setPrimaryErrorCategory(currentHomework.primaryErrorCategory);
      }
      setRevisionRequired(!!currentHomework.revisionRequired);
      setFeedback(currentHomework.feedback || "");
      setSentenceFeedbacks(currentHomework.sentenceFeedbacks || []);
    } else {
      setTaskResponse("");
      setCoherence("");
      setLexical("");
      setGrammar("");
      setFeedback("");
      setRevisionRequired(false);
      setSentenceFeedbacks([]);
    }
  }, [currentHomework]);

  // Overall Band Calculation (Trả về "—" nếu chưa nhập)
  const calculatedOverall = useMemo(() => {
    const tr = parseFloat(taskResponse);
    const cc = parseFloat(coherence);
    const lr = parseFloat(lexical);
    const gr = parseFloat(grammar);
    const validScores = [tr, cc, lr, gr].filter((s) => !isNaN(s));

    if (validScores.length === 0) return "—";

    const sum = (isNaN(tr) ? 0 : tr) + (isNaN(cc) ? 0 : cc) + (isNaN(lr) ? 0 : lr) + (isNaN(gr) ? 0 : gr);
    const avg = sum / (validScores.length || 1);
    return (Math.round(avg * 2) / 2).toFixed(1);
  }, [taskResponse, coherence, lexical, grammar]);

  // Thống kê nhanh Sổ bài tập Cột 2 từ CSDL Thật
  const workbookSummary = useMemo(() => {
    if (!currentStudent) return { graded: 0, pending: 0, inProgress: 0, overdue: 0 };
    return {
      graded: currentStudent.gradedCount || 0,
      pending: currentStudent.pendingCount || 0,
      inProgress: currentStudent.unsubmittedCount || 0,
      overdue: 0,
    };
  }, [currentStudent]);

  // Data Map cho Báo Cáo Tiến Độ Phụ Huynh
  const reportData = useMemo(() => {
    return mapToProgressReportData({
      studentName: currentStudent?.fullName || "Học viên",
      className: currentClass?.name || "Lớp học",
      teacherName: currentClass?.teacher?.fullName || null,
      homeworks: currentStudent?.homeworks || [],
    });
  }, [currentStudent, currentClass]);

  // THAO TÁC TRẢ BÀI & TỰ ĐỘNG CHUYỂN BÀI THEO QUEUE CHỜ CHẤM
  const handleGradeSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (currentHomework && currentStudent && currentHomework.submissionId) {
        const trNum = parseFloat(taskResponse);
        const ccNum = parseFloat(coherence);
        const lrNum = parseFloat(lexical);
        const grNum = parseFloat(grammar);
        const criteriaScores = {
          taskResponse: !isNaN(trNum) ? trNum : null,
          coherence: !isNaN(ccNum) ? ccNum : null,
          lexical: !isNaN(lrNum) ? lrNum : null,
          grammar: !isNaN(grNum) ? grNum : null,
        };

        const targetAnswerId = currentHomework.answerId || "";

        await submissionsApi.grade(
          currentHomework.submissionId,
          [{ answerId: targetAnswerId, score: parseFloat(calculatedOverall) || 0, feedback }],
          parseFloat(calculatedOverall) || 0,
          {
            feedback,
            primaryErrorCategory: revisionRequired ? primaryErrorCategory : null,
            revisionRequired,
            criteriaScores,
            sentenceFeedbacks,
          }
        );

        toast({
          title: "Đã trả bài thành công 🎉",
          description: `Đã lưu điểm Band ${calculatedOverall} cho học viên ${currentStudent.fullName}.${revisionRequired ? " (Đã gửi yêu cầu sửa bài Attempt 2)" : ""}`,
        });

        refetchWorkspace();

        // 🟢 LOGIC TỰ ĐỘNG CHUYỂN BÀI CHỜ CHẤM THEO QUEUE (Cột 2 / Cột 1)
        const nextPendingInWorkbook = workbookItems.find(
          (h) => h.status === "submitted" && h.id !== currentHomework.id
        );

        if (nextPendingInWorkbook) {
          setSelectedHomeworkId(nextPendingInWorkbook.id);
        } else {
          // Nếu học viên hiện tại đã hết bài chờ chấm, nhảy sang học viên có bài chờ chấm tiếp theo trong Queue Cột 1
          const nextStudentWithPending = students.find(
            (s: any) => s.hasPending && s.id !== currentStudent.id
          );
          if (nextStudentWithPending) {
            setSelectedStudentId(nextStudentWithPending.id);
            setSelectedHomeworkId("");
          }
        }
      }
    } catch (err: any) {
      toast({
        title: "Không thể lưu điểm",
        description: err.message || "Đã xảy ra lỗi khi lưu kết quả.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thao tác Gia hạn ngày cho Lớp học
  const handleConfirmReopen = async (item: WorkbookItem) => {
    if (!reopenDate) {
      toast({
        title: "Vui lòng chọn ngày gia hạn",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedClassId && item.id) {
        await classesApi.setHomeworkDeadline(selectedClassId, item.id, new Date(reopenDate).toISOString());
        toast({
          title: "Đã cập nhật hạn nộp bài tập 📅",
          description: `Bài ${item.title} đã gia hạn đến ngày ${reopenDate} cho lớp học.`,
        });
        refetchWorkspace();
        setReopenTargetId(null);
      }
    } catch (err: any) {
      toast({
        title: "Không thể lưu hạn nộp",
        description: err.message || "Đã xảy ra lỗi khi lưu gia hạn.",
        variant: "destructive",
      });
    }
  };

  // Render Status Badge
  const renderStatusBadge = (item: WorkbookItem) => {
    if (item.isOverdue && item.status !== "graded" && item.status !== "submitted") {
      return (
        <Badge variant="outline" className="bg-slate-900 text-white border-slate-900 text-[10px]">
          ⚫ Quá hạn
        </Badge>
      );
    }

    switch (item.status) {
      case "graded":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
            🟢 Band {item.score ?? "6.5"} {item.submissionTiming?.isLate ? `(Trễ ${item.submissionTiming.lateDays}d)` : ""}
          </Badge>
        );
      case "submitted":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] animate-pulse">
            🔵 Chờ chấm {item.submissionTiming?.isLate ? `(Trễ ${item.submissionTiming.lateDays}d)` : ""}
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            🟡 Đang làm
          </Badge>
        );
      case "needs_revision":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
            🔴 Cần sửa
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px]">
            ⚪ Chưa làm
          </Badge>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* 🟢 HEADER TIÊU CHUẨN */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Teacher Workspace</h1>
              <p className="text-[11px] text-slate-500">Sổ bài tập Lật mở & Chấm bài Học viên</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 mx-1" />

          {/* Bộ chọn Lớp học */}
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-slate-400" />
            <Select value={selectedClassId} onValueChange={(val) => {
              setSelectedClassId(val);
              setSelectedStudentId("");
              setSelectedHomeworkId("");
            }}>
              <SelectTrigger className="w-[260px] h-9 text-xs font-semibold bg-slate-50 border-slate-200">
                <SelectValue placeholder="Chọn Lớp học phụ trách..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name} {c.target_band ? `(Target Band ${c.target_band})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium px-3 py-1">
            📖 Workbook: {currentClass?.name || "Lớp IELTS"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => refetchWorkspace()} className="h-8 text-xs text-slate-500 hover:text-slate-900">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Làm mới
          </Button>
        </div>
      </header>

      {/* 📐 BỐ CỤC 3 CỘT SINGLE-SCREEN WORKBOOK VIEWER */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ========================================================================= */}
        {/* CỘT 1: DANH SÁCH HỌC VIÊN TRONG LỚP (KÈM CHỈ SỐ TIẾN ĐỘ 12/27)            */}
        {/* ========================================================================= */}
        <div className="w-1/4 min-w-[260px] max-w-[320px] bg-white border-r border-slate-200 flex flex-col justify-between overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 space-y-2.5 shrink-0 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                Học viên ({filteredStudents.length})
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setStudentFilter("all")}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                    studentFilter === "all"
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStudentFilter("pending")}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                    studentFilter === "pending"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  Bài chờ 🔴
                </button>
              </div>
            </div>
          </div>

          {/* List Học viên */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Không có học viên phù hợp</div>
            ) : (
              filteredStudents.map((st: any) => {
                const isSelected = st.id === selectedStudentId;
                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      setSelectedStudentId(st.id);
                      setSelectedHomeworkId("");
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-300 shadow-2xs"
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0 border border-slate-200">
                        <AvatarImage src={st.avatarUrl} />
                        <AvatarFallback className="text-xs bg-slate-100 font-bold text-slate-600">
                          {st.fullName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{st.fullName}</div>
                        {/* 1. HIỂN THỊ CON SỐ TIẾN ĐỘ HỌC VIÊN (12 / 27) */}
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>HW {st.submittedCount} / {st.totalAssignedCount}</span>
                          {st.hasPending && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded">
                              🔵 {st.pendingCount} chờ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {st.hasPending && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT 2: SỔ WORKBOOK NHÓM THEO BUỔI HỌC (LESSON GROUPING)                   */}
        {/* ========================================================================= */}
        <div className="w-[35%] bg-slate-50/50 border-r border-slate-200 flex flex-col justify-between overflow-hidden">
          {/* Header Sổ Bài Tập & Thống kê Tóm Tắt Badges */}
          <div className="p-3.5 bg-white border-b border-slate-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Sổ Bài Tập: <span className="text-blue-600">{currentStudent?.fullName || "Chưa chọn học viên"}</span>
                </h3>
                <p className="text-[10px] text-slate-400">Workbook lớp {currentClass?.name || "IELTS"}</p>
              </div>

              {/* THỐNG KÊ NHANH BADGES & BÁO CÁO TIẾN ĐỘ */}
              {currentStudent && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0.2">
                      🟢 {workbookSummary.graded}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.2">
                      🔵 {workbookSummary.pending}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0.2">
                      ⚪ {workbookSummary.inProgress}
                    </Badge>
                    {workbookSummary.overdue > 0 && (
                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0.2">
                        ⚫ {workbookSummary.overdue}
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsReportModalOpen(true)}
                    className="h-7 text-[11px] font-bold gap-1 rounded-lg border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 shrink-0"
                    title="Tạo báo cáo tiến độ gửi Zalo cho phụ huynh"
                  >
                    <FileText className="h-3 w-3" />
                    Báo Cáo
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Danh sách 27 Bài Tập gom theo Buổi học */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {!currentStudent ? (
              <div className="h-full flex items-center justify-center p-6 text-center text-xs text-slate-400">
                Chưa có học viên nào trong lớp
              </div>
            ) : (
              groupedWorkbook.map((group) => (
                <div key={group.lessonNumber} className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md">
                    📖 BUỔI {group.lessonNumber}: KỸ NĂNG {group.items[0]?.type.toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isSelected = item.id === selectedHomeworkId;
                      const isReopenOpen = reopenTargetId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedHomeworkId(item.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                            isSelected
                              ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20"
                              : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                              {item.title}
                            </span>
                            {renderStatusBadge(item)}
                          </div>

                          {/* Dòng Quá hạn -> nút Gia hạn mở Inline */}
                          {item.isOverdue && item.status !== "graded" && item.status !== "submitted" && (
                            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                              <span>Hạn: {item.dueDate}</span>
                              {!isReopenOpen ? (
                                <button
                                  onClick={() => setReopenTargetId(item.id)}
                                  className="text-blue-600 font-bold hover:underline"
                                >
                                  [Gia hạn]
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200">
                                  <Input
                                    type="date"
                                    value={reopenDate}
                                    onChange={(e) => setReopenDate(e.target.value)}
                                    className="h-6 text-[9px] w-24 bg-white"
                                  />
                                  <Button size="sm" onClick={() => handleConfirmReopen(item)} className="h-6 text-[9px] px-2 bg-slate-900 text-white">
                                    Lưu
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT 3: KHAY CHẤM BÀI VỚI ĐỦ THÔNG TIN ĐỊNH DANH HỌC VIÊN                  */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-white flex flex-col justify-between overflow-hidden">
          {!currentStudent ? (
            <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400">
              Chọn một học viên từ danh sách để xem bài làm và chấm điểm.
            </div>
          ) : (
            <>
              {/* 3. HEADER THÊM ĐỦ THÔNG TIN NHẬN DIỆN HỌC VIÊN & LỚP */}
              <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{currentHomework?.title || "Chưa chọn bài"}</span>
                    {currentHomework && renderStatusBadge(currentHomework)}
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium flex items-center gap-2 mt-1">
                    <span className="font-bold text-blue-700">{currentStudent?.fullName}</span>
                    <span>•</span>
                    <span className="text-slate-500">{currentClass?.name || "Lớp IELTS"}</span>
                    <span>•</span>
                    <span className="text-slate-500">{currentHomework?.type === "writing" ? "Writing Task 2" : "Speaking Part 2"}</span>
                  </div>
                </div>

                <Button
                  onClick={handleGradeSubmit}
                  disabled={isSubmitting || !currentHomework}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-8 text-xs px-3 shadow-xs"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Trả bài 🚀
                </Button>
              </div>

          {/* Body Nội dung & Form Chấm điểm */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Nội dung Bài làm */}
            <Card className="border border-slate-200/80 shadow-2xs rounded-xl p-3.5 bg-slate-50/30 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">📝 Nội dung Bài Làm Học Viên</span>
              {currentHomework?.type === "speaking" && currentHomework?.audioUrl ? (
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
                  <p className="text-xs text-slate-600 font-medium">Bản thu âm Speaking của học viên:</p>
                  <audio controls src={formatStorageUrl(currentHomework.audioUrl)} className="w-full h-8" />
                </div>
              ) : (
                <SentenceLevelGrader
                  essayText={currentHomework?.answerText || ""}
                  sentenceFeedbacks={sentenceFeedbacks}
                  onChange={setSentenceFeedbacks}
                />
              )}
            </Card>

            {/* BẢNG CHẤM ĐIỂM 4 TIÊU CHÍ IELTS */}
            <Card className="border border-slate-200/80 shadow-2xs rounded-xl p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-blue-600" />
                  Đánh giá Band Score (IELTS 4 Tiêu chí)
                </span>
                <div className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Overall Band: {calculatedOverall}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">Task Response / Achievement</Label>
                  <Select value={taskResponse} onValueChange={setTaskResponse}>
                    <SelectTrigger className="h-8 text-xs font-bold bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((v) => (
                        <SelectItem key={v} value={v} className="text-xs font-semibold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">Coherence & Cohesion</Label>
                  <Select value={coherence} onValueChange={setCoherence}>
                    <SelectTrigger className="h-8 text-xs font-bold bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((v) => (
                        <SelectItem key={v} value={v} className="text-xs font-semibold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">Lexical Resource</Label>
                  <Select value={lexical} onValueChange={setLexical}>
                    <SelectTrigger className="h-8 text-xs font-bold bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((v) => (
                        <SelectItem key={v} value={v} className="text-xs font-semibold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600">Grammar Range & Accuracy</Label>
                  <Select value={grammar} onValueChange={setGrammar}>
                    <SelectTrigger className="h-8 text-xs font-bold bg-slate-50 border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((v) => (
                        <SelectItem key={v} value={v} className="text-xs font-semibold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* KHUNG NHẬN XẾT TEXTAREA ĐƠN GIẢN */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-[11px] font-medium text-slate-600">Nhận xét chi tiết của Giáo viên</Label>
                <Textarea
                  value={feedback || currentHomework?.feedback || ""}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Gõ nhận xét cho học viên (Ví dụ: Bài làm tốt, cần chú ý cấu trúc đoạn thân bài 2...)"
                  className="min-h-[90px] text-xs font-sans border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-500/40"
                />
              </div>

              {/* P1 LEAN LEARNING LOOP CONTROLS */}
              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Yêu cầu học viên sửa bài (Attempt 2)
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Bật nếu học viên cần nộp bài sửa trước khi tính hoàn thành.
                    </p>
                  </div>
                  <Switch
                    checked={revisionRequired}
                    onCheckedChange={setRevisionRequired}
                  />
                </div>

                {revisionRequired && (
                  <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/60 border border-amber-200">
                    <Label className="text-[11px] font-bold text-amber-900">
                      Lỗi chính cần tập trung khắc phục (Primary Error)
                    </Label>
                    <Select
                      value={primaryErrorCategory}
                      onValueChange={(val: any) => setPrimaryErrorCategory(val)}
                    >
                      <SelectTrigger className="h-8 text-xs font-bold bg-white border-amber-300 text-amber-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONCEPT" className="text-xs font-semibold">
                          CONCEPT — Hiểu sai đề / Luận điểm chưa phù hợp
                        </SelectItem>
                        <SelectItem value="STRUCTURE" className="text-xs font-semibold">
                          STRUCTURE — Bố cục chưa chuẩn / Thiếu liên kết (Coherence & Cohesion)
                        </SelectItem>
                        <SelectItem value="EXPRESSION" className="text-xs font-semibold">
                          EXPRESSION — Dùng từ chưa chuẩn / Thiếu tự nhiên (Lexical Resource)
                        </SelectItem>
                        <SelectItem value="GRAMMAR" className="text-xs font-semibold">
                          GRAMMAR — Sai ngữ pháp / Thì / Dấu câu
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL BÁO CÁO TIẾN ĐỘ HỌC TẬP (PHỤ HUYNH) */}
      <ProgressReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        data={reportData}
      />
    </div>
  );
}

