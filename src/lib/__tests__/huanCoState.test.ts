import { describe, it, expect } from "vitest";
import { getHuanCoState } from "../huanCoState";
import { ActionQueueItem } from "../homeworkStatusHelper";

describe("HUYEN CO LAO NHAN V1: Rule Engine Invariant Tests", () => {
  it("Rule 1: Priority OVERDUE (RED) when overdue items exist", () => {
    const actionQueue: ActionQueueItem[] = [
      {
        id: "hw-1",
        examId: "exam-reading-01",
        title: "Reading Unit 1",
        status: "OVERDUE",
        priority: 2,
      },
      {
        id: "hw-2",
        examId: "exam-writing-01",
        title: "Writing Task 2",
        status: "REVISION_REQUIRED",
        priority: 1,
      },
    ];

    const result = getHuanCoState({
      actionQueue,
      submittedCount: 2,
      gradedCount: 1,
    });

    expect(result.urgency).toBe("RED");
    expect(result.badgeText).toBe("Cần Xử Lý Gấp");
    expect(result.ctaPath).toBe("/exam/exam-reading-01");
    expect(result.ctaLabel).toContain("Reading Unit 1");
    expect(result.advice).toContain("Reading Unit 1");
  });

  it("Rule 2: Priority REVISION_REQUIRED (ORANGE) when no overdue but revision required", () => {
    const actionQueue: ActionQueueItem[] = [
      {
        id: "hw-2",
        examId: "exam-writing-01",
        title: "Writing Task 2",
        status: "REVISION_REQUIRED",
        priority: 1,
        submission: { id: "sub-999" },
      },
      {
        id: "hw-3",
        examId: "exam-listening-01",
        title: "Listening Unit 2",
        status: "UPCOMING",
        priority: 3,
        countdown: { text: "Còn 5 giờ", isOverdue: false },
      },
    ];

    const result = getHuanCoState({
      actionQueue,
      submittedCount: 1,
      gradedCount: 1,
    });

    expect(result.urgency).toBe("ORANGE");
    expect(result.badgeText).toBe("Cần Sửa Bài");
    expect(result.ctaPath).toBe("/submission/sub-999");
    expect(result.ctaLabel).toContain("Writing Task 2");
    expect(result.advice).toContain("Writing Task 2");
  });

  it("Rule 3: Priority DUE_SOON (YELLOW) when deadline <= 48 hours", () => {
    const actionQueue: ActionQueueItem[] = [
      {
        id: "hw-3",
        examId: "exam-listening-01",
        title: "Listening Unit 2",
        status: "UPCOMING",
        priority: 3,
        countdown: { text: "Còn 12 giờ", isOverdue: false },
      },
      {
        id: "hw-4",
        examId: "exam-vocab-01",
        title: "Vocab Unit 3",
        status: "UPCOMING",
        priority: 4,
      },
    ];

    const result = getHuanCoState({
      actionQueue,
      submittedCount: 5,
      gradedCount: 3,
    });

    expect(result.urgency).toBe("YELLOW");
    expect(result.badgeText).toBe("Sắp Hết Hạn");
    expect(result.ctaPath).toBe("/exam/exam-listening-01");
    expect(result.ctaLabel).toContain("Listening Unit 2");
    expect(result.advice).toContain("Còn 12 giờ");
  });

  it("Rule 4: Priority PENDING (BLUE) when upcoming assignments exist", () => {
    const actionQueue: ActionQueueItem[] = [
      {
        id: "hw-4",
        examId: "exam-vocab-01",
        title: "Vocab Unit 3",
        status: "UPCOMING",
        priority: 4,
      },
    ];

    const result = getHuanCoState({
      actionQueue,
      submittedCount: 1,
      gradedCount: 1,
    });

    expect(result.urgency).toBe("BLUE");
    expect(result.badgeText).toBe("Nhiệm Vụ Mới");
    expect(result.ctaPath).toBe("/exam/exam-vocab-01");
    expect(result.ctaLabel).toContain("Vocab Unit 3");
  });

  it("Rule 5: Priority POSITIVE (GREEN) when all homework submitted", () => {
    const result = getHuanCoState({
      actionQueue: [],
      submittedCount: 4,
      gradedCount: 2,
    });

    expect(result.urgency).toBe("GREEN");
    expect(result.badgeText).toBe("Tiến Triển Tốt");
    expect(result.ctaPath).toBe("/app/my-submissions");
    expect(result.ctaLabel).toBe("Xem lịch sử nộp bài");
  });

  it("Rule 6: Priority IDLE (GRAY) when class is empty with no homework assigned", () => {
    const result = getHuanCoState({
      actionQueue: [],
      submittedCount: 0,
      gradedCount: 0,
    });

    expect(result.urgency).toBe("GRAY");
    expect(result.badgeText).toBe("Đang Thảnh Thơi");
    expect(result.ctaPath).toBeUndefined();
    expect(result.ctaLabel).toBeUndefined();
  });
});
