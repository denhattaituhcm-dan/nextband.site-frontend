import { describe, it, expect, vi, beforeEach } from "vitest";
import { lessonsApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";

describe("Tầng 2: Integration Test - Class Lessons Data & Contract Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser = {
    id: "d16e345c-9c14-4b4f-9788-1a255237d678",
    email: "denhattaituhcm@gmail.com",
  };

  const validClassId = "0defcb78-0eca-490e-8e41-476eedffe353";
  const validCourseId = "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab";

  describe("TEST-04 [INTEGRATION_HAS_LESSONS (29 Exercises)]", () => {
    it("should retrieve full 29 lessons for valid class D01 07.2026 linked to course DREAMER", async () => {
      // Mock Auth
      vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      // Mock classes query
      const mockClassRow = {
        id: validClassId,
        name: "D01 07.2026",
        course_id: validCourseId,
        courses: { id: validCourseId, title: "DREAMER" },
      };

      // Mock 29 exams
      const mock29Exams = Array.from({ length: 29 }, (_, i) => ({
        id: `exam-uuid-${String(i + 1).padStart(3, "0")}`,
        title: `W${Math.floor(i / 3) + 1} - D${(i % 3) + 1} - Lesson`,
        description: `Bài tập buổi ${i + 1}`,
        week: Math.floor(i / 3) + 1,
        exam_type: "ielts",
        exam_sections: [
          { id: `sec-${i}-1`, section_type: "listening", title: "Listening" },
          { id: `sec-${i}-2`, section_type: "reading", title: "Reading" },
        ],
      }));

      // Mock submissions
      const mockSubmissions = [
        { id: "sub-1", exam_id: "exam-uuid-001", status: "graded", total_score: 7.5 },
        { id: "sub-2", exam_id: "exam-uuid-002", status: "submitted", total_score: null },
      ];

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "classes") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: mockClassRow, error: null }),
              }),
            }),
          } as any;
        }
        if (table === "exams") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: mock29Exams, error: null }),
              }),
            }),
          } as any;
        }
        if (table === "exam_submissions") {
          return {
            select: () => ({
              eq: () => ({
                in: async () => ({ data: mockSubmissions, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const response = await lessonsApi.getClassLessons(validClassId);
      expect(response.success).toBe(true);
      expect(response.data.classId).toBe(validClassId);
      expect(response.data.className).toBe("D01 07.2026");
      expect(response.data.courseTitle).toBe("DREAMER");
      expect(response.data.lessons).toHaveLength(29);
      expect(response.data.progress.totalLessons).toBe(29);
      expect(response.data.progress.completedLessons).toBe(2); // 1 graded + 1 submitted
    });
  });

  describe("TEST-05 [INTEGRATION_EMPTY_COLLECTION_NOT_ERROR]", () => {
    it("INVARIANT-03: Empty lessons collection MUST return success with 0 items, NOT an error exception", async () => {
      vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const mockClassRow = {
        id: validClassId,
        name: "D01 07.2026",
        course_id: validCourseId,
        courses: { id: validCourseId, title: "DREAMER" },
      };

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "classes") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: mockClassRow, error: null }),
              }),
            }),
          } as any;
        }
        if (table === "exams") {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: [], error: null }), // 0 exams
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const response = await lessonsApi.getClassLessons(validClassId);
      expect(response.success).toBe(true);
      expect(response.data.lessons).toEqual([]);
      expect(response.data.progress.totalLessons).toBe(0);
      expect(response.data.progress.completedLessons).toBe(0);
    });
  });

  describe("TEST-06 [INTEGRATION_COURSE_NOT_CONFIGURED]", () => {
    it("should handle class with course_id = null gracefully without throwing unhandled crash", async () => {
      vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      });

      const unconfiguredClass = {
        id: validClassId,
        name: "Unconfigured Class",
        course_id: null,
        courses: null,
      };

      vi.spyOn(supabase, "from").mockImplementation((table: string) => {
        if (table === "classes") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({ data: unconfiguredClass, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const response = await lessonsApi.getClassLessons(validClassId);
      expect(response.success).toBe(true);
      expect(response.data.lessons).toEqual([]);
    });
  });

  describe("TEST-07 [INTEGRATION_BOUNDARY_PREVENTION]", () => {
    it("should reject non-UUID classId at the API wrapper before making network call", async () => {
      const dbCallSpy = vi.spyOn(supabase, "from");

      await expect(lessonsApi.getClassLessons(":classId")).rejects.toThrow("Mã định danh lớp học không hợp lệ");
      
      // Zero DB calls made!
      expect(dbCallSpy).not.toHaveBeenCalled();
    });
  });
});
