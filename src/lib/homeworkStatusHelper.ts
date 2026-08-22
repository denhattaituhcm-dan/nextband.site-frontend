/**
 * Canonical Homework Status & Visual Priority Helper
 * Implements strict precedence order:
 * GRADED (Revision?) > SUBMITTED > OVERDUE (if not submitted & past deadline) > IN_PROGRESS > UPCOMING
 */

export type CanonicalVisualStatus =
  | "GRADED"            // Đã chấm điểm hoàn tất
  | "REVISION_REQUIRED" // Đã chấm nhưng cần làm bài sửa (Attempt 2)
  | "SUBMITTED"         // Đã nộp bài chờ chấm (Dù nộp sau deadline vẫn tính là SUBMITTED)
  | "OVERDUE"           // Quá hạn chưa nộp (now > deadline && chưa nộp)
  | "IN_PROGRESS"       // Đang làm trong hạn
  | "UPCOMING";         // Chưa làm và còn trong hạn

export interface VisualStatusParams {
  submissionStatus?: string | null;
  revisionRequired?: boolean;
  deadline?: string | Date | null;
  now?: number;
}

/**
 * Pure domain function to derive canonical visual status with strict precedence.
 */
export function deriveCanonicalVisualStatus(params: VisualStatusParams): CanonicalVisualStatus {
  const { submissionStatus, revisionRequired, deadline, now = Date.now() } = params;
  const rawStatus = (submissionStatus || "").toUpperCase().trim();

  // 1. GRADED & REVISION (Highest priority)
  if (rawStatus === "GRADED") {
    return revisionRequired ? "REVISION_REQUIRED" : "GRADED";
  }

  // 2. SUBMITTED / GRADING (If submitted, NEVER marked as overdue)
  if (rawStatus === "SUBMITTED" || rawStatus === "GRADING") {
    return "SUBMITTED";
  }

  // 3. OVERDUE (Only when NOT submitted and deadline has passed)
  if (deadline) {
    const deadlineMs = new Date(deadline).getTime();
    if (!isNaN(deadlineMs) && now > deadlineMs) {
      return "OVERDUE";
    }
  }

  // 4. IN_PROGRESS (Currently drafting within deadline)
  if (rawStatus === "IN_PROGRESS") {
    return "IN_PROGRESS";
  }

  // 5. UPCOMING / NOT_STARTED (Default)
  return "UPCOMING";
}

/**
 * Formats a deadline countdown or overdue duration into human-readable Vietnamese.
 */
export function formatDeadlineCountdown(
  deadline: string | Date | null | undefined,
  now = Date.now()
): { text: string; isOverdue: boolean } | null {
  if (!deadline) return null;
  const targetMs = new Date(deadline).getTime();
  if (isNaN(targetMs)) return null;

  const diffMs = targetMs - now;
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const diffMinutes = Math.floor(absDiff / (1000 * 60));
  const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
  const diffDays = Math.floor(absDiff / (1000 * 60 * 60 * 24));

  if (isOverdue) {
    if (diffDays >= 1) {
      return { text: `Quá hạn ${diffDays} ngày`, isOverdue: true };
    }
    if (diffHours >= 1) {
      return { text: `Quá hạn ${diffHours} giờ`, isOverdue: true };
    }
    return { text: `Quá hạn ${Math.max(1, diffMinutes)} phút`, isOverdue: true };
  }

  // Remaining time
  if (diffDays >= 1) {
    return { text: `Còn ${diffDays} ngày`, isOverdue: false };
  }
  if (diffHours >= 1) {
    return { text: `Còn ${diffHours} giờ`, isOverdue: false };
  }
  return { text: `Còn ${Math.max(1, diffMinutes)} phút`, isOverdue: false };
}

/**
 * Pure helper for calculating automatic deadline on client (matches backend invariant)
 */
export function calculateAutomaticDeadline(params: {
  classStartDate: Date | string | null | undefined;
  lessonOrder: number;
}): Date {
  const baseDate = params.classStartDate ? new Date(params.classStartDate) : new Date();
  const order = Math.max(1, Math.floor(Number(params.lessonOrder) || 1));
  const targetMs = baseDate.getTime() + order * 7 * 24 * 60 * 60 * 1000;
  const deadline = new Date(targetMs);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}
