import { describe, it, expect } from "vitest";
import {
  gradeSingleQuestion,
  gradeAllExamQuestions,
  convertOptionValToIndex,
  QuestionForGrading,
  StudentAnswerItem,
} from "../gradingEngine";

describe("gradingEngine - Unit Test Suite", () => {
  it("converts option value to 0-based index correctly", () => {
    expect(convertOptionValToIndex(0)).toBe(0);
    expect(convertOptionValToIndex(3)).toBe(3);
    expect(convertOptionValToIndex("0")).toBe(0);
    expect(convertOptionValToIndex("3")).toBe(3);
    expect(convertOptionValToIndex("A")).toBe(0);
    expect(convertOptionValToIndex("B")).toBe(1);
    expect(convertOptionValToIndex("C")).toBe(2);
    expect(convertOptionValToIndex("D")).toBe(3);
    expect(convertOptionValToIndex(null)).toBeNull();
    expect(convertOptionValToIndex(undefined)).toBeNull();
  });

  describe("Multiple Choice & Short Answer", () => {
    it("grades exact multiple choice correctly", () => {
      const q: QuestionForGrading = {
        id: "q1",
        questionType: "multiple_choice",
        correctAnswer: "B",
        points: 1,
      };

      expect(gradeSingleQuestion(q, { questionId: "q1", answerText: "B" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q1", answerText: "b" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q1", answerText: "A" }).isCorrect).toBe(false);
      expect(gradeSingleQuestion(q, { questionId: "q1", answerText: "" }).isCorrect).toBe(false);
    });

    it("grades short answer with multiple alternatives separated by |", () => {
      const q: QuestionForGrading = {
        id: "q2",
        questionType: "short_answer",
        correctAnswer: "centre|center|the centre",
        points: 1,
      };

      expect(gradeSingleQuestion(q, { questionId: "q2", answerText: "centre" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q2", answerText: "Center" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q2", answerText: "The Centre" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q2", answerText: "corner" }).isCorrect).toBe(false);
    });
  });

  describe("True/False/Not Given & Yes/No/Not Given", () => {
    it("grades True/False/Not Given case-insensitively", () => {
      const q: QuestionForGrading = {
        id: "q3",
        questionType: "true_false_not_given",
        correctAnswer: "NOT GIVEN",
        points: 1,
      };

      expect(gradeSingleQuestion(q, { questionId: "q3", answerText: "NOT GIVEN" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q3", answerText: "not given" }).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, { questionId: "q3", answerText: "FALSE" }).isCorrect).toBe(false);
    });
  });

  describe("Fill in the Blank (Multiple Blanks & Alternatives)", () => {
    it("grades fill_blank with JSON multiple blanks and partial scores", () => {
      const q: QuestionForGrading = {
        id: "q4",
        questionType: "fill_blank",
        correctAnswer: JSON.stringify({
          "0": "fast|quick",
          "1": "expensive|costly",
        }),
        points: 2,
      };

      // Both correct
      const resFull = gradeSingleQuestion(q, {
        questionId: "q4",
        answerText: JSON.stringify({ "0": "quick", "1": "expensive" }),
      });
      expect(resFull.isCorrect).toBe(true);
      expect(resFull.score).toBe(2);
      expect(resFull.maxScore).toBe(2);

      // Partial correct
      const resPartial = gradeSingleQuestion(q, {
        questionId: "q4",
        answerText: JSON.stringify({ "0": "quick", "1": "cheap" }),
      });
      expect(resPartial.isCorrect).toBe(false);
      expect(resPartial.score).toBe(1);
      expect(resPartial.maxScore).toBe(2);

      // Both wrong
      const resWrong = gradeSingleQuestion(q, {
        questionId: "q4",
        answerText: JSON.stringify({ "0": "slow", "1": "cheap" }),
      });
      expect(resWrong.isCorrect).toBe(false);
      expect(resWrong.score).toBe(0);
    });
  });

  describe("Matching (Pair matching)", () => {
    it("grades matching pairs correctly", () => {
      const q: QuestionForGrading = {
        id: "q5",
        questionType: "matching",
        correctAnswer: JSON.stringify({
          pairs: {
            "0": 1,
            "1": "C",
          },
        }),
        points: 2,
      };

      const resMatch = gradeSingleQuestion(q, {
        questionId: "q5",
        answerText: JSON.stringify({
          "0": "B", // index 1
          "1": 2,   // 'C' is index 2
        }),
      });

      expect(resMatch.isCorrect).toBe(true);
      expect(resMatch.score).toBe(2);
    });
  });

  describe("Manual Question Types (Writing / Speaking / Essay)", () => {
    it("marks manual question types as requiring manual grading", () => {
      const qWriting: QuestionForGrading = {
        id: "q6",
        questionType: "writing",
        correctAnswer: null,
        points: 9,
      };

      const res = gradeSingleQuestion(qWriting, {
        questionId: "q6",
        answerText: "This is my essay.",
      });

      expect(res.isManual).toBe(true);
      expect(res.score).toBe(0);
      expect(res.maxScore).toBe(9);
    });
  });

  describe("Complete Exam Grading Summary", () => {
    it("computes overall summary and marks hasManualQuestions correctly", () => {
      const questions: QuestionForGrading[] = [
        { id: "q1", questionType: "multiple_choice", correctAnswer: "A", points: 1 },
        { id: "q2", questionType: "multiple_choice", correctAnswer: "B", points: 1 },
        { id: "q3", questionType: "writing", correctAnswer: null, points: 9 },
      ];

      const answers: StudentAnswerItem[] = [
        { questionId: "q1", answerText: "A" },
        { questionId: "q2", answerText: "C" },
        { questionId: "q3", answerText: "Essay draft..." },
      ];

      const summary = gradeAllExamQuestions(questions, answers);

      expect(summary.hasManualQuestions).toBe(true);
      expect(summary.correctAnswers).toBe(1);
      expect(summary.totalQuestions).toBe(2); // Objective questions count
      expect(summary.totalScore).toBe(1);
    });

    it("marks 100% objective exam as NOT having manual questions", () => {
      const questions: QuestionForGrading[] = [
        { id: "q1", questionType: "multiple_choice", correctAnswer: "A", points: 1 },
        { id: "q2", questionType: "multiple_choice", correctAnswer: "B", points: 1 },
      ];

      const answers: StudentAnswerItem[] = [
        { questionId: "q1", answerText: "A" },
        { questionId: "q2", answerText: "B" },
      ];

      const summary = gradeAllExamQuestions(questions, answers);

      expect(summary.hasManualQuestions).toBe(false);
      expect(summary.correctAnswers).toBe(2);
      expect(summary.totalQuestions).toBe(2);
      expect(summary.totalScore).toBe(2);
    });
  });
});
