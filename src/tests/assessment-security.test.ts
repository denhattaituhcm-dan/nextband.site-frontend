import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AssessmentService,
  mapRawScoreToArisLevel,
} from "../../../server/services/assessment.service";
import { canonicalPlacementTestPayload } from "../../../server/data/placement-test/questions";

describe("Guest Assessment Security & Business Invariants", () => {
  let mockPrisma: any;
  let assessmentService: AssessmentService;

  beforeEach(() => {
    mockPrisma = {
      contactLead: {
        create: vi.fn().mockResolvedValue({ id: "lead-1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      assessmentSession: {
        create: vi.fn().mockResolvedValue({ id: "session-1" }),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ id: "session-1" }),
      },
    };

    assessmentService = new AssessmentService(mockPrisma);
  });

  // Test 1: Guest creates assessment session and loads clean test payload
  it("Test 1: Guest creates assessment session and loads clean test without answer keys", async () => {
    const session = await assessmentService.createAssessmentSession({
      fullName: "Nguyễn Văn Thí Sinh",
      phone: "0912345678",
      targetBand: "6.5",
      ipAddress: "192.168.1.1",
    });

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.status).toBe("ACTIVE");

    const payload = await assessmentService.getTestPayloadForSession(session.id);
    expect(payload.test).toBeDefined();
    expect(payload.session.candidateName).toBe("Nguyễn Văn Thí Sinh");

    // Zero secret leak verification
    payload.test.skills.listening.questions.forEach((q) => {
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).answerKey).toBeUndefined();
    });
  });

  // Test 2: Sanitized test payload contains no answer key properties
  it("Test 2: canonicalPlacementTestPayload has zero secret answer keys", () => {
    const payload = canonicalPlacementTestPayload;
    payload.skills.reading.questions.forEach((q) => {
      expect((q as any).correctAnswer).toBeUndefined();
      expect((q as any).answerKey).toBeUndefined();
    });
  });

  // Test 3: Reject double submission with 409 Conflict
  it("Test 3: Reject double submission with 409 Conflict", async () => {
    const session = await assessmentService.createAssessmentSession({
      fullName: "Phan Văn E",
      phone: "0912345679",
      targetBand: "6.0",
      ipAddress: "192.168.1.2",
    });

    const report = await assessmentService.submitAssessment(session.id, {
      L1: "Thứ Ba & Thứ Năm",
    });

    expect(report.sessionId).toBe(session.id);

    await expect(
      assessmentService.submitAssessment(session.id, { L1: "Thứ Ba & Thứ Năm" }),
    ).rejects.toThrow("Bài khảo thí này đã được nộp trước đó");
  });

  // Test 4: Reject autosave and submission when session is expired
  it("Test 4: Reject autosave and submission when session is expired", async () => {
    const session = await assessmentService.createAssessmentSession({
      fullName: "Lê Thị F",
      phone: "0912345680",
      targetBand: "5.5",
      ipAddress: "192.168.1.3",
    });

    session.expiresAt = new Date(Date.now() - 100000);

    await expect(
      assessmentService.autosaveAnswers(session.id, { L1: "A" }),
    ).rejects.toThrow("Phiên làm bài đã hết hạn");

    await expect(
      assessmentService.submitAssessment(session.id, { L1: "A" }),
    ).rejects.toThrow("Phiên làm bài đã hết hạn");
  });

  // Test 5: Rate limiting on same phone
  it("Test 5: Enforce rate limiting on excessive session creations for same phone", async () => {
    const phone = `0999${Date.now().toString().slice(-6)}`;

    // Create 5 sessions
    for (let i = 0; i < 5; i++) {
      await assessmentService.createAssessmentSession({
        fullName: `Candidate ${i}`,
        phone,
        targetBand: "6.0",
        ipAddress: `10.0.0.${i + 1}`,
      });
    }

    // 6th must fail with 429
    await expect(
      assessmentService.createAssessmentSession({
        fullName: "Excessive Candidate",
        phone,
        targetBand: "6.0",
        ipAddress: "10.0.0.100",
      }),
    ).rejects.toThrow("Số điện thoại này đã tạo quá nhiều lượt khảo thí");
  });

  // Test 6: ARIS-7 Framework Score Mapping
  it("Test 6: mapRawScoreToArisLevel maps raw score to ARIS diagnostic level", () => {
    expect(mapRawScoreToArisLevel(5, 35).levelNumber).toBe(1);
    expect(mapRawScoreToArisLevel(12, 35).levelNumber).toBe(2);
    expect(mapRawScoreToArisLevel(19, 35).levelNumber).toBe(3);
    expect(mapRawScoreToArisLevel(26, 35).levelNumber).toBe(4);
    expect(mapRawScoreToArisLevel(30, 35).levelNumber).toBe(5);
    expect(mapRawScoreToArisLevel(34, 35).levelNumber).toBe(6);
  });
});
