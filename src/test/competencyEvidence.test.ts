import { describe, it, expect } from "vitest";
import {
  buildEvidenceItem,
  buildStudentEvidenceCorpus,
  ERROR_TO_COMPETENCY_HYPOTHESIS,
} from "../lib/competencyEvidence";

describe("🧪 P2-A: COMPETENCY EVIDENCE COLLECTION UNIT TEST SUITE", () => {
  const mockExam = { id: "exam-writing-01", title: "Writing Task 2: Technology" };

  it("1. Returns null when Attempt 1 has no primaryErrorCategory (No observation recorded)", () => {
    const att1 = {
      id: "sub-1",
      examId: "exam-writing-01",
      exam: mockExam,
      status: "GRADED",
      totalScore: 7.0,
      feedback: "Bài viết tốt, không có lỗi nghiêm trọng.",
    };

    const evidence = buildEvidenceItem(att1);
    expect(evidence).toBeNull();
  });

  it("2. Returns evidenceStatus = 'OBSERVED' when Attempt 1 is tagged but no revision attempt exists", () => {
    const att1 = {
      id: "sub-1",
      examId: "exam-writing-01",
      exam: mockExam,
      status: "GRADED",
      totalScore: 5.5,
      primaryErrorCategory: "STRUCTURE",
      feedback: "Cần cải thiện cấu trúc câu phức ở thân bài 1.",
      answers: [{ answerText: "The government gave money to help poor people." }],
      createdAt: "2026-08-01T10:00:00Z",
    };

    const evidence = buildEvidenceItem(att1);
    expect(evidence).not.toBeNull();
    expect(evidence?.errorCategory).toBe("STRUCTURE");
    expect(evidence?.implicatedCompetency).toBe("C2_STRUCTURE");
    expect(evidence?.evidenceStatus).toBe("OBSERVED");
    expect(evidence?.initialScore).toBe(5.5);
    expect(evidence?.resolvedInAttemptId).toBeUndefined();
    expect(evidence?.resolvedScore).toBeNull();
    expect(evidence?.scoreDelta).toBeNull();
    expect(evidence?.attempt1AnswerText).toBe("The government gave money to help poor people.");
  });

  it("3. Returns evidenceStatus = 'IMPROVED' when Attempt 2 is reviewed with revisionRequired = false (Teacher Verified Fix)", () => {
    const att1 = {
      id: "sub-1",
      examId: "exam-writing-01",
      exam: mockExam,
      status: "GRADED",
      totalScore: 5.5,
      primaryErrorCategory: "CONCEPT",
      feedback: "Dùng từ sai trường nghĩa (concept error).",
      answers: [{ answerText: "Old sentence with word error" }],
      createdAt: "2026-08-01T10:00:00Z",
    };

    const att2 = {
      id: "sub-2",
      examId: "exam-writing-01",
      status: "GRADED",
      totalScore: 7.0,
      revisionRequired: false,
      feedback: "Đã chọn đúng từ vựng học thuật chính xác.",
      answers: [{ answerText: "Improved sentence with precise vocabulary" }],
      createdAt: "2026-08-02T10:00:00Z",
    };

    const evidence = buildEvidenceItem(att1, att2);
    expect(evidence).not.toBeNull();
    expect(evidence?.implicatedCompetency).toBe("C1_MEANING");
    expect(evidence?.evidenceStatus).toBe("IMPROVED");
    expect(evidence?.resolvedInAttemptId).toBe("sub-2");
    expect(evidence?.resolvedScore).toBe(7.0);
    expect(evidence?.scoreDelta).toBe(1.5);
    expect(evidence?.attempt2AnswerText).toBe("Improved sentence with precise vocabulary");
  });

  it("4. Returns evidenceStatus = 'NOT_YET_IMPROVED' when Attempt 2 is reviewed with revisionRequired = true (Error Persisted)", () => {
    const att1 = {
      id: "sub-1",
      examId: "exam-writing-01",
      exam: mockExam,
      status: "GRADED",
      totalScore: 5.0,
      primaryErrorCategory: "GRAMMAR",
      feedback: "Nhiều lỗi chia động từ và mạo từ.",
      createdAt: "2026-08-01T10:00:00Z",
    };

    const att2 = {
      id: "sub-2",
      examId: "exam-writing-01",
      status: "GRADED",
      totalScore: 5.5,
      revisionRequired: true,
      feedback: "Vẫn còn mắc lỗi thì quá khứ ở đoạn cuối.",
      createdAt: "2026-08-02T10:00:00Z",
    };

    const evidence = buildEvidenceItem(att1, att2);
    expect(evidence).not.toBeNull();
    expect(evidence?.implicatedCompetency).toBe("C2_STRUCTURE");
    expect(evidence?.evidenceStatus).toBe("NOT_YET_IMPROVED");
    expect(evidence?.scoreDelta).toBe(0.5); // Score delta alone does NOT mark it as improved
  });

  it("5. Returns evidenceStatus = 'UNDETERMINED' when Attempt 2 is still IN_PROGRESS or SUBMITTED (Not yet Teacher Graded)", () => {
    const att1 = {
      id: "sub-1",
      examId: "exam-writing-01",
      exam: mockExam,
      status: "GRADED",
      totalScore: 5.5,
      primaryErrorCategory: "EXPRESSION",
      feedback: "Văn phong quá thân mật, cần dùng academic register.",
      createdAt: "2026-08-01T10:00:00Z",
    };

    const att2 = {
      id: "sub-2",
      examId: "exam-writing-01",
      status: "SUBMITTED",
      createdAt: "2026-08-02T10:00:00Z",
    };

    const evidence = buildEvidenceItem(att1, att2);
    expect(evidence).not.toBeNull();
    expect(evidence?.implicatedCompetency).toBe("C4_CONTEXT");
    expect(evidence?.evidenceStatus).toBe("UNDETERMINED");
  });

  it("6. Correctly maps all 4 Error Categories to their respective Inferred Competencies", () => {
    expect(ERROR_TO_COMPETENCY_HYPOTHESIS.CONCEPT).toBe("C1_MEANING");
    expect(ERROR_TO_COMPETENCY_HYPOTHESIS.STRUCTURE).toBe("C2_STRUCTURE");
    expect(ERROR_TO_COMPETENCY_HYPOTHESIS.EXPRESSION).toBe("C4_CONTEXT");
    expect(ERROR_TO_COMPETENCY_HYPOTHESIS.GRAMMAR).toBe("C2_STRUCTURE");
  });

  it("7. buildStudentEvidenceCorpus aggregates observations, counts, and coverage across multiple exams", () => {
    const studentId = "student-123";
    const submissions = [
      // Exam 1: Attempt 1 & Attempt 2 (Resolved)
      {
        id: "sub-ex1-1",
        examId: "ex-1",
        exam: { id: "ex-1", title: "Task 1 Bar Chart" },
        status: "GRADED",
        totalScore: 5.5,
        primaryErrorCategory: "STRUCTURE",
        feedback: "Lỗi cấu trúc",
        createdAt: "2026-08-01T08:00:00Z",
      },
      {
        id: "sub-ex1-2",
        examId: "ex-1",
        exam: { id: "ex-1", title: "Task 1 Bar Chart" },
        status: "GRADED",
        totalScore: 6.5,
        revisionRequired: false,
        feedback: "Đã sửa tốt",
        createdAt: "2026-08-02T08:00:00Z",
      },
      // Exam 2: Attempt 1 (Observed only)
      {
        id: "sub-ex2-1",
        examId: "ex-2",
        exam: { id: "ex-2", title: "Task 2 Essay" },
        status: "GRADED",
        totalScore: 6.0,
        primaryErrorCategory: "EXPRESSION",
        feedback: "Lỗi văn phong",
        createdAt: "2026-08-03T08:00:00Z",
      },
      // Exam 3: Attempt 1 without error category (Passed cleanly)
      {
        id: "sub-ex3-1",
        examId: "ex-3",
        exam: { id: "ex-3", title: "Task 2 Education" },
        status: "GRADED",
        totalScore: 8.0,
        feedback: "Rất xuất sắc",
        createdAt: "2026-08-04T08:00:00Z",
      },
    ];

    const corpus = buildStudentEvidenceCorpus(studentId, submissions);

    expect(corpus.studentId).toBe(studentId);
    expect(corpus.totalReviewedSubmissions).toBe(2); // Only sub-ex1-1 and sub-ex2-1 have primaryErrorCategory
    expect(corpus.observedErrorCounts.STRUCTURE).toBe(1);
    expect(corpus.observedErrorCounts.EXPRESSION).toBe(1);
    expect(corpus.observedErrorCounts.CONCEPT).toBe(0);
    expect(corpus.observedErrorCounts.GRAMMAR).toBe(0);

    expect(corpus.evidenceItems.length).toBe(2);
    expect(corpus.evidenceItems[0].evidenceStatus).toBe("IMPROVED");
    expect(corpus.evidenceItems[1].evidenceStatus).toBe("OBSERVED");

    expect(corpus.evidenceCoverage.totalSubmissionsWithFeedback).toBe(2);
    expect(corpus.evidenceCoverage.totalRevisionsCompleted).toBe(1);
    expect(corpus.evidenceCoverage.undeterminedCount).toBe(0);
  });
});
