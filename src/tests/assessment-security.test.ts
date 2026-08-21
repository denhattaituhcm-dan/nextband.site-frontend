import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AssessmentService,
  cleanAssessmentQuestion,
  mapBandToArisRank,
} from "../../server/services/assessment.service";

describe("Guest Assessment Security & Business Invariants", () => {
  let mockPrisma: any;
  let assessmentService: AssessmentService;

  const mockPlacementExam = {
    id: "exam-placement-123",
    title: "IELTS Entrance Test (4 Skills)",
    durationMinutes: 45,
    isPublished: true,
    isActive: true,
    allowGuestAssessment: true,
    isOpen: true,
    sections: [
      {
        id: "sec-1",
        title: "Reading",
        sectionType: "reading",
        orderIndex: 0,
        audioUrl: null,
        audioScript: "SECRET_AUDIO_SCRIPT",
        questionGroups: [
          {
            id: "grp-1",
            title: "Passage 1",
            audioUrl: null,
            questions: [
              {
                id: "q-1",
                questionType: "multiple_choice",
                prompt: "What is the main topic?",
                correctAnswer: "A",
                audioScript: "SECRET SCRIPT",
                acceptedAnswers: ["A"],
                answerKey: "A",
              },
              {
                id: "q-2",
                questionType: "multiple_choice",
                prompt: "Choose two features",
                correctAnswer: "A | B",
                audioScript: null,
              },
            ],
          },
        ],
      },
    ],
  };

  const mockInternalExam = {
    id: "exam-internal-999",
    title: "Class 10A Internal Final Exam",
    durationMinutes: 60,
    isPublished: true,
    isActive: true,
    allowGuestAssessment: false,
    isOpen: false,
  };

  beforeEach(() => {
    mockPrisma = {
      exam: {
        findFirst: vi.fn().mockResolvedValue(mockPlacementExam),
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === mockPlacementExam.id) return Promise.resolve(mockPlacementExam);
          if (where.id === mockInternalExam.id) return Promise.resolve(mockInternalExam);
          return Promise.resolve(null);
        }),
      },
      contactLead: {
        create: vi.fn().mockResolvedValue({ id: "lead-1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };

    assessmentService = new AssessmentService(mockPrisma);
  });

  // Test Case 1: Positive Path - Guest can create assessment session & load stripped exam
  it("Test 1: Guest creates assessment session and loads clean exam without answer keys", async () => {
    const res = await assessmentService.createAssessmentSession({
      fullName: "Nguyễn Văn Thí Sinh",
      phone: "0912345678",
      targetBand: "6.5",
      assessmentCode: "PLACEMENT_TEST",
      ipAddress: "192.168.1.1",
    });

    expect(res.session).toBeDefined();
    expect(res.session.id).toBeDefined();
    expect(res.session.status).toBe("ACTIVE");
    expect(res.session.fullName).toBe("Nguyễn Văn Thí Sinh");
    expect(res.session.phone).toBe("0912345678");

    // Load exam for this session
    const loadedExam = await assessmentService.getExamForSession(
      res.session.id,
      res.session.examId,
    );

    expect(loadedExam.id).toBe(mockPlacementExam.id);
    const q1 = loadedExam.sections[0].questionGroups[0].questions[0];
    expect(q1.correctAnswer).toBeNull();
    expect(q1.audioScript).toBeNull();
    expect(q1.answerKey).toBeUndefined();
    expect(q1.acceptedAnswers).toBeUndefined();
  });

  // Test Case 2 & 3: Clean question sanitizer ensures no leaks
  it("Test 2 & 3: cleanAssessmentQuestion removes 100% of answer keys and secret scripts", () => {
    const dirtyQuestion = {
      id: "q-test",
      questionType: "multiple_choice",
      correctAnswer: "A",
      audioScript: "Confidential script",
      acceptedAnswers: ["A", "B"],
      answerKey: "A",
      options: ["A", "B", "C", "D"],
    };

    const clean = cleanAssessmentQuestion(dirtyQuestion);
    expect(clean.correctAnswer).toBeNull();
    expect(clean.audioScript).toBeNull();
    expect(clean.answerKey).toBeUndefined();
    expect(clean.acceptedAnswers).toBeUndefined();
  });

  // Test Case 4: Exam mismatch - Session of Exam A cannot load Exam B
  it("Test 4: Session of Exam A rejected when attempting to load Exam B (Session-Exam Lock)", async () => {
    const res = await assessmentService.createAssessmentSession({
      fullName: "Thí Sinh Mismatch",
      phone: "0988888888",
      ipAddress: "192.168.1.2",
    });

    await expect(
      assessmentService.getExamForSession(res.session.id, "different-exam-uuid"),
    ).rejects.toThrow("Từ chối truy cập: Phiên khảo thí này không thuộc về bài thi yêu cầu");
  });

  // Test Case 5: Reject double-submission
  it("Test 5: Reject double submission with 409 Conflict", async () => {
    const res = await assessmentService.createAssessmentSession({
      fullName: "Thí Sinh Double Submit",
      phone: "0977777777",
      ipAddress: "192.168.1.3",
    });

    // 1st submission -> Success
    const report = await assessmentService.submitAssessment(res.session.id, {
      "q-1": "A",
    });
    expect(report).toBeDefined();
    expect(report.id).toBe(res.session.id);

    // 2nd submission -> Reject
    await expect(
      assessmentService.submitAssessment(res.session.id, { "q-1": "B" }),
    ).rejects.toThrow("Bài khảo thí này đã được nộp trước đó");
  });

  // Test Case 6: Reject autosave / submit on expired session
  it("Test 6: Reject autosave and submission when session is expired", async () => {
    const res = await assessmentService.createAssessmentSession({
      fullName: "Thí Sinh Hết Hạn",
      phone: "0966666666",
      ipAddress: "192.168.1.4",
    });

    // Manually expire session
    const session = await assessmentService.getSessionById(res.session.id);
    if (session) {
      session.expiresAt = new Date(Date.now() - 100000);
    }

    await expect(
      assessmentService.autosaveAnswers(res.session.id, { "q-1": "A" }),
    ).rejects.toThrow("Phiên làm bài đã hết hạn");

    await expect(
      assessmentService.submitAssessment(res.session.id, { "q-1": "A" }),
    ).rejects.toThrow("Phiên làm bài đã hết hạn. Không thể nộp bài.");
  });

  // Test Case 7: Rate limiting on phone
  it("Test 7: Enforce rate limiting on excessive session creations for same phone", async () => {
    const testPhone = "0933999888";
    const ip = "192.168.1.5";

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      await assessmentService.createAssessmentSession({
        fullName: `Candidate ${i}`,
        phone: testPhone,
        ipAddress: `${ip}_${i}`,
      });
    }

    // 6th attempt rejected
    await expect(
      assessmentService.createAssessmentSession({
        fullName: "Candidate 6",
        phone: testPhone,
        ipAddress: "192.168.1.99",
      }),
    ).rejects.toThrow("Số điện thoại này đã tạo quá nhiều lượt khảo thí");
  });

  // Test Case 8: ARIS-7 Framework Band Score Mapping
  it("Test 8: mapBandToArisRank maps IELTS band to correct ARIS rank and recommended course", () => {
    expect(mapBandToArisRank(3.0).rankCode).toBe(3);
    expect(mapBandToArisRank(4.0).rankCode).toBe(4);
    expect(mapBandToArisRank(5.0).rankCode).toBe(5);
    expect(mapBandToArisRank(6.0).rankCode).toBe(6);
    expect(mapBandToArisRank(7.5).rankCode).toBe(7);
  });
});
