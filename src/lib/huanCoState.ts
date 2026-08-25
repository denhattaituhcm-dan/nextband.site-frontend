import { ActionQueueItem } from "./homeworkStatusHelper";

export type HuanCoUrgency = "RED" | "ORANGE" | "YELLOW" | "BLUE" | "GREEN" | "GRAY";

export interface HuanCoState {
  urgency: HuanCoUrgency;
  badgeText: string;
  quote: string;
  advice: string;
  ctaLabel?: string;
  ctaPath?: string;
  dotColorClass: string;
  ringColorClass: string;
  targetItem?: ActionQueueItem;
}

export interface HuanCoInput {
  actionQueue: ActionQueueItem[];
  submittedCount?: number;
  gradedCount?: number;
  pendingCount?: number;
  enrolledClassName?: string;
  courseTitle?: string;
}

/**
 * Pure deterministic rule engine for Huyền Cơ Lão Nhân.
 * Prioritizes student learning action:
 * 1. OVERDUE (RED) -> Oldest overdue homework first
 * 2. REVISION_REQUIRED (ORANGE) -> Attempt 2 needs revision
 * 3. DUE_SOON (YELLOW) -> Due within 48 hours
 * 4. PENDING (BLUE) -> Active assignments awaiting student
 * 5. POSITIVE (GREEN) -> All pending done, review progress/graded
 * 6. IDLE (GRAY) -> No active homework assigned yet
 */
export function getHuanCoState(input: HuanCoInput): HuanCoState {
  const {
    actionQueue = [],
    submittedCount = 0,
    gradedCount = 0,
  } = input;

  // Priority 1: OVERDUE items
  const overdueItems = actionQueue.filter(
    (item) => item.status === "OVERDUE" || (item.countdown?.isOverdue && item.status !== "SUBMITTED" && item.status !== "GRADED")
  );

  if (overdueItems.length > 0) {
    const target = overdueItems[0];
    const targetPath = `/exam/${target.examId || target.id}`;
    const count = overdueItems.length;

    return {
      urgency: "RED",
      badgeText: "Cần Xử Lý Gấp",
      quote:
        count > 1
          ? `Ta đang nghỉ cũng được, nhưng ngươi thì đang nợ ${count} bài đấy.`
          : `Đừng nhìn ta nữa. Ngươi đang nợ một bài tập quá hạn kìa.`,
      advice: `Trước tiên hãy xử lý dứt điểm bài "${target.title}" này đã.`,
      ctaLabel: `Làm bù bài: ${target.title}`,
      ctaPath: targetPath,
      dotColorClass: "bg-rose-500",
      ringColorClass: "ring-rose-500/30 border-rose-500",
      targetItem: target,
    };
  }

  // Priority 2: REVISION_REQUIRED items (Attempt 2)
  const revisionItems = actionQueue.filter((item) => item.status === "REVISION_REQUIRED");

  if (revisionItems.length > 0) {
    const target = revisionItems[0];
    const targetPath = target.submission?.id
      ? `/submission/${target.submission.id}`
      : `/exam/${target.examId || target.id}`;

    return {
      urgency: "ORANGE",
      badgeText: "Cần Sửa Bài",
      quote: `Ta đã xem qua rồi. Bài này chưa đạt yêu cầu, cần mài giũa lại.`,
      advice: `Xem nhận xét của giáo viên và sửa bài "${target.title}" (Attempt 2).`,
      ctaLabel: `Sửa bài: ${target.title}`,
      ctaPath: targetPath,
      dotColorClass: "bg-amber-500",
      ringColorClass: "ring-amber-500/30 border-amber-500",
      targetItem: target,
    };
  }

  // Priority 3: DUE_SOON items (priority === 3 or countdown active within 48h)
  const dueSoonItems = actionQueue.filter(
    (item) => item.priority === 3 || (item.countdown && !item.countdown.isOverdue && item.priority === 3)
  );

  if (dueSoonItems.length > 0) {
    const target = dueSoonItems[0];
    const targetPath = `/exam/${target.examId || target.id}`;
    const countdownText = target.countdown?.text ? ` (${target.countdown.text})` : "";

    return {
      urgency: "YELLOW",
      badgeText: "Sắp Hết Hạn",
      quote: `Thời gian không đợi ai. Bài tập sắp đến hạn chót rồi đấy.`,
      advice: `Bài "${target.title}"${countdownText} cần hoàn thành sớm kẻo dồn việc.`,
      ctaLabel: `Làm bài: ${target.title}`,
      ctaPath: targetPath,
      dotColorClass: "bg-amber-400",
      ringColorClass: "ring-amber-400/30 border-amber-400",
      targetItem: target,
    };
  }

  // Priority 4: PENDING items (normal upcoming tasks)
  if (actionQueue.length > 0) {
    const target = actionQueue[0];
    const targetPath = `/exam/${target.examId || target.id}`;
    const totalPending = actionQueue.length;

    return {
      urgency: "BLUE",
      badgeText: "Nhiệm Vụ Mới",
      quote:
        totalPending > 1
          ? `Hành trình phía trước còn ${totalPending} bài tập đang đợi ngươi khai phá.`
          : `Có nhiệm vụ mới đang chờ ngươi rèn luyện.`,
      advice: `Hãy bắt đầu ngay với bài "${target.title}".`,
      ctaLabel: `Làm bài: ${target.title}`,
      ctaPath: targetPath,
      dotColorClass: "bg-primary",
      ringColorClass: "ring-primary/30 border-primary",
      targetItem: target,
    };
  }

  // Priority 5: POSITIVE (All homework submitted, no pending tasks)
  if (submittedCount > 0) {
    return {
      urgency: "GREEN",
      badgeText: "Tiến Triển Tốt",
      quote: `Khá lắm! Ngươi đã giải quyết xong hết các bài tập được giao đợt này.`,
      advice:
        gradedCount > 0
          ? `Đã có ${gradedCount} bài được chấm nhận xét. Xem lại để rút kinh nghiệm.`
          : `Bài nộp đang trong hàng đợi chấm, tranh thủ xem lại bài cũ.`,
      ctaLabel: "Xem lịch sử nộp bài",
      ctaPath: "/app/my-submissions",
      dotColorClass: "bg-emerald-500",
      ringColorClass: "ring-emerald-500/30 border-emerald-500",
    };
  }

  // Priority 6: IDLE (No assignments in class)
  return {
    urgency: "GRAY",
    badgeText: "Đang Thảnh Thơi",
    quote: `Kinh các để sau đi, ta đang nghỉ ngơi... Ngươi cũng chưa có bài tập nào.`,
    advice: `Khi giáo viên giao bài tập mới, ta sẽ lập tức chỉ dẫn cho ngươi.`,
    dotColorClass: "bg-muted-foreground",
    ringColorClass: "ring-border border-border",
  };
}
