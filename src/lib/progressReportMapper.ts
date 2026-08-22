import { ProgressReportData } from "@/types/progressReport";

export interface ProgressReportInput {
  studentName: string;
  className: string;
  teacherName?: string | null;
  homeworks?: any[];
  attendanceRecords?: any[];
  teacherNote?: string;
  periodFrom?: Date | string | null;
  periodTo?: Date | string | null;
}

/**
 * Pure Mapper: Transforms verified student workbook state into a clean ProgressReportData object.
 * Guarantee: Zero phantom fields, null-safe across all metrics.
 */
export function mapToProgressReportData(input: ProgressReportInput): ProgressReportData {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const formatDateStr = (d?: Date | string | null) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const periodFrom = formatDateStr(input.periodFrom || defaultFrom);
  const periodTo = formatDateStr(input.periodTo || now);
  const generatedAt = formatDateStr(now);

  // 1. Chuyên cần (Chỉ tính nếu có bản ghi điểm danh thật)
  let attendance: ProgressReportData["attendance"] = null;
  if (input.attendanceRecords && input.attendanceRecords.length > 0) {
    const presentCount = input.attendanceRecords.filter(
      (a: any) => a.status === "PRESENT" || a.status === "present"
    ).length;
    const absentCount = input.attendanceRecords.filter(
      (a: any) => a.status === "ABSENT" || a.status === "absent"
    ).length;

    attendance = {
      present: presentCount,
      absent: absentCount,
      total: input.attendanceRecords.length,
    };
  }

  // 2. Bài tập về nhà
  const hwList = input.homeworks || [];
  let submittedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  const overdueTitles: string[] = [];

  hwList.forEach((hw: any) => {
    const isGraded = hw.status === "graded" || hw.status === "GRADED";
    const isSubmitted = hw.status === "submitted" || hw.status === "SUBMITTED" || isGraded;
    const isOverdue = !!hw.isOverdue || hw.status === "OVERDUE";

    if (isSubmitted) {
      submittedCount++;
    } else if (isOverdue) {
      overdueCount++;
      if (overdueTitles.length < 2) {
        overdueTitles.push(hw.title || "Bài tập");
      }
    } else {
      pendingCount++;
    }
  });

  // 3. Kết quả các bài gần nhất (Tối đa 3 bài đã chấm)
  const gradedHws = hwList.filter(
    (hw: any) => hw.status === "graded" || hw.status === "GRADED" || hw.bandScore != null || hw.score != null
  );

  const recentResults = gradedHws.slice(0, 3).map((hw: any) => {
    let scoreDisplay: string | number | null = null;
    if (hw.bandScore != null) {
      scoreDisplay = `Band ${hw.bandScore}`;
    } else if (hw.score != null) {
      scoreDisplay = String(hw.score);
    }

    return {
      title: hw.title || "Bài tập",
      score: scoreDisplay,
    };
  });

  return {
    student: {
      name: input.studentName || "Học viên",
      className: input.className || "Lớp học",
      teacherName: input.teacherName || "Giảng viên phụ trách",
    },
    period: {
      from: periodFrom,
      to: periodTo,
    },
    attendance,
    homework: {
      submitted: submittedCount,
      pending: pendingCount,
      overdue: overdueCount,
      overdueTitles,
    },
    recentResults,
    teacherNote: input.teacherNote || "",
    generatedAt,
  };
}
