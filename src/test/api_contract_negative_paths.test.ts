import { describe, it, expect, vi, beforeEach } from "vitest";
import { adaptQuestion } from "../adapters/question.adapter";
import { adaptSection } from "../adapters/section.adapter";
import { adaptExam } from "../adapters/exam.adapter";
import { adaptSession } from "../adapters/session.adapter";
import { sectionsApi } from "../lib/api";

describe("🛡️ Step 6: Negative-Path & Contract Violation Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Question Adapter Negative Matrix", () => {
    it("Case 1: When options is null, adapts deterministically without throwing", () => {
      const raw = {
        id: "q-bad-1",
        questionType: "multiple_choice",
        questionText: "Which is correct?",
        options: null,
        correctAnswer: null,
      };

      const result = adaptQuestion(raw);
      expect(result.id).toBe("q-bad-1");
      expect(result.options).toEqual([]);
      expect(Array.isArray(result.options)).toBe(true);
    });

    it("Case 2: When options is malformed JSON string, recovers without throwing", () => {
      const raw = {
        id: "q-bad-2",
        questionType: "multiple_choice",
        questionText: "Sample",
        options: "{ invalid json string",
      };

      const result = adaptQuestion(raw);
      expect(result.options).toEqual([]);
    });

    it("Case 3: When questionText is null or undefined, provides string fallback", () => {
      const raw = {
        id: "q-bad-3",
        questionText: null,
        question_text: undefined,
      };

      const result = adaptQuestion(raw);
      expect(result.questionText).toBe("");
      expect(typeof result.questionText).toBe("string");
    });

    it("Case 4: When fillBlankAnswers is null, provides safe empty array", () => {
      const raw = {
        id: "q-bad-4",
        questionType: "fill_blank",
        fillBlankAnswers: null,
        correctAnswer: null,
      };

      const result = adaptQuestion(raw);
      expect(result.fillBlankAnswers).toEqual([]);
      expect(Array.isArray(result.fillBlankAnswers)).toBe(true);
    });

    it("Case 5: When entirely non-object or null passed to adaptQuestion, handles gracefully", () => {
      const resultNull = adaptQuestion(null);
      expect(resultNull.id).toBeDefined();
      expect(resultNull.options).toEqual([]);

      const resultString = adaptQuestion("corrupted-string");
      expect(resultString.id).toBeDefined();
      expect(resultString.options).toEqual([]);
    });
  });

  describe("Section & Exam Adapter Negative Matrix", () => {
    it("Case 6: When questionGroups is null or undefined, provides empty array", () => {
      const raw = {
        id: "sec-bad-1",
        questionGroups: null,
        question_groups: undefined,
      };

      const result = adaptSection(raw);
      expect(result.questionGroups).toEqual([]);
      expect(Array.isArray(result.questionGroups)).toBe(true);
    });

    it("Case 7: When sections in exam is null or undefined, provides empty array", () => {
      const raw = {
        id: "exam-bad-1",
        sections: null,
        exam_sections: undefined,
      };

      const result = adaptExam(raw);
      expect(result.sections).toEqual([]);
      expect(Array.isArray(result.sections)).toBe(true);
    });

    it("Case 8: When session date is malformed or null, provides safe ISO date format", () => {
      const raw = {
        id: "sess-bad-1",
        plannedDate: null,
        scheduledDate: undefined,
      };

      const result = adaptSession(raw);
      expect(result.plannedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.status).toBe("SCHEDULED");
    });
  });

  describe("API Controlled Failure Propagation", () => {
    it("Case 9: When section ID is invalid UUID, sectionsApi.getById throws 400 error cleanly", async () => {
      await expect(sectionsApi.getById("invalid-non-uuid-string")).rejects.toThrow(
        /Mã phần thi không hợp lệ/i
      );
    });
  });
});
