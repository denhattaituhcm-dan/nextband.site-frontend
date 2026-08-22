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

  describe("Gate 5: Fastify Offline / 5xx -> Explicit Connection Error (No Silent Fallback)", () => {
    it("should throw explicit connection error when Fastify is offline (fetch failed)", async () => {
      // Fastify offline
      global.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed: ECONNREFUSED"));

      const dbSpy = vi.spyOn(supabase, "from");

      await expect(examsApi.getById(validExamId)).rejects.toThrow(/Không thể kết nối|máy chủ/i);
      expect(dbSpy).not.toHaveBeenCalled();
    });
  });
});
