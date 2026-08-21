/**
 * Canonical Homework Status & Domain Helper
 * Separates Assignment representation from individual Student Submission progress.
 */

export type HomeworkStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADING"
  | "GRADED"
  | "REVISION_REQUIRED";

export interface CanonicalSubmission {
  id?: string;
  examId?: string;
  exam_id?: string;
  studentId?: string;
  student_id?: string;
  status?: string;
  gradeStatus?: string;
  grade_status?: string;
  totalScore?: number | null;
  total_score?: number | null;
  bandScore?: number | null;
  band_score?: number | null;
  revisionRequired?: boolean;
  revision_required?: boolean;
  submittedAt?: string;
  submitted_at?: string;
  answers?: any[];
  feedback?: string;
}

/**
 * Pure domain function to derive canonical homework status from student submission
 */
export function deriveHomeworkStatus(submission?: CanonicalSubmission | null): HomeworkStatus {
  if (!submission) return "NOT_STARTED";

  const rawStatus = (submission.status || "").toLowerCase().trim();
  const rawGradeStatus = (submission.gradeStatus || submission.grade_status || "").toLowerCase().trim();
  const isRevision = !!(submission.revisionRequired || submission.revision_required);

  if (rawStatus === "graded" || rawGradeStatus === "graded") {
    return isRevision ? "REVISION_REQUIRED" : "GRADED";
  }

  if (rawStatus === "grading") {
    return "GRADING";
  }

  if (rawStatus === "submitted") {
    return "SUBMITTED";
  }

  if (rawStatus === "in_progress") {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
}
