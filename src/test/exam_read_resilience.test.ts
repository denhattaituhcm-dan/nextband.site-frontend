import { describe, it, expect, vi, beforeEach } from "vitest";
import { examsApi, normalizeExamData } from "@/lib/api";
import { supabase } from "@/lib/supabase";

describe("Exam Read Resilience & Security Invariants ('Read may degrade; write must never fork')", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validExamId = "03c0215e-bbc7-4ac4-9c42-65e16e1c77f5";

  describe("Gate 1: Fastify Normal Operation (200 OK)", () => {
    it("should return normalized exam from Fastify when gateway is healthy", async () => {
      const mockFastifyExam = {
        id: validExamId,
        title: "Final test",
        courseId: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
        sections: [
          {
            id: "sec-1",
            sectionType: "reading",
            title: "Reading Section",
            questionGroups: [
              {
                id: "grp-1",
                questions: [
                  {
                    id: "q-1",
                    prompt: "What is IELTS?",
                    options: ["A", "B", "C"],
                    correctAnswer: null, // Stripped for students
                  },
                ],
              },
            ],
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockFastifyExam,
      } as any);

      const dbSpy = vi.spyOn(supabase, "from");

      const result = await examsApi.getById(validExamId);
      expect(result.id).toBe(validExamId);
      expect(result.title).toBe("Final test");
      // Supabase was NOT called because Fastify returned 200
      expect(dbSpy).not.toHaveBeenCalled();
    });
  });

  describe("Gate 2, 3, 4: Strict Non-Fallback on 401, 403, 404", () => {
    it("Gate 2 [401 UNAUTHORIZED]: MUST STOP and NOT fallback to Supabase", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Phiên đăng nhập đã hết hạn" }),
      } as any);

      const dbSpy = vi.spyOn(supabase, "from");

      await expect(examsApi.getById(validExamId)).rejects.toThrow();
      expect(dbSpy).not.toHaveBeenCalled();
    });

    it("Gate 3 [403 FORBIDDEN]: MUST STOP and NOT fallback to Supabase", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: "Bạn chưa đăng ký khóa học hoặc lớp học này" }),
      } as any);

      const dbSpy = vi.spyOn(supabase, "from");

      await expect(examsApi.getById(validExamId)).rejects.toThrow();
      expect(dbSpy).not.toHaveBeenCalled();
    });

    it("Gate 4 [404 NOT FOUND]: MUST STOP and NOT fallback to Supabase", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: "Không tìm thấy bài thi" }),
      } as any);

      const dbSpy = vi.spyOn(supabase, "from");

      await expect(examsApi.getById(validExamId)).rejects.toThrow();
      expect(dbSpy).not.toHaveBeenCalled();
    });
  });

  describe("Gate 5: Fastify Offline / 5xx -> Safe Read-Only Supabase Fallback", () => {
    it("should trigger safe Read-Only Supabase Fallback when Fastify is offline (fetch failed)", async () => {
      // Fastify offline
      global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed: ECONNREFUSED"));

      const mockSupabaseExam = {
        id: validExamId,
        title: "Final test",
        course_id: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
        courses: { id: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab", title: "DREAMER" },
        exam_sections: [
          {
            id: "sec-1",
            section_type: "listening",
            title: "Listening Section",
            audio_url: "audio/sample.mp3",
            audio_script: "SECRET AUDIO TRANSCRIPT", // Should be stripped
            question_groups: [
              {
                id: "grp-1",
                passage: "Listen to the conversation",
                questions: [
                  {
                    id: "q-1",
                    prompt: "Question 1",
                    options: ["Yes", "No"],
                    answer_key: "Yes", // Should be stripped
                    correct_answer: "Yes", // Should be stripped
                  },
                ],
              },
            ],
          },
        ],
      };

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "exams") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: mockSupabaseExam, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await examsApi.getById(validExamId);
      expect(result.id).toBe(validExamId);
      expect(result.title).toBe("Final test");

      // ZERO SECRET LEAKS: answer keys and audio transcripts must be stripped!
      const section = result.sections[0];
      expect(section.audioScript).toBeUndefined();
      expect(section.audio_script).toBeUndefined();

      const question = section.questionGroups[0].questions[0];
      expect(question.answerKey).toBeUndefined();
      expect(question.answer_key).toBeUndefined();
      expect(question.correctAnswer).toBeNull();
      expect(question.correct_answer).toBeNull();
    });
  });
});
