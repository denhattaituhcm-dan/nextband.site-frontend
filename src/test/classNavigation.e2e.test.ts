import { describe, it, expect } from "vitest";
import { resolveExitDestination, sanitizeInternalRoute } from "@/lib/exitContext";

describe("Tầng 3: E2E Navigation & Return Context Flow", () => {
  const mockExam = {
    id: "exam-001-uuid",
    classId: "0defcb78-0eca-490e-8e41-476eedffe353",
    courseId: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
  };

  describe("TEST-08 [E2E_CANONICAL_CLASS_TO_EXAM_JOURNEY]", () => {
    it("should resolve explicit locationState destination when returning from exam", () => {
      const locationState = {
        exitContext: {
          destination: `/app/class/${mockExam.classId}/lessons`,
          source: "class_homework",
          classId: mockExam.classId,
        },
        returnUrl: `/app/class/${mockExam.classId}/lessons`,
      };

      const destination = resolveExitDestination(mockExam, null, locationState);
      expect(destination).toBe(`/app/class/${mockExam.classId}/lessons`);
    });

    it("should resolve query parameter ?returnUrl= when state is missing", () => {
      const searchParams = new URLSearchParams(`returnUrl=${encodeURIComponent(`/app/class/${mockExam.classId}/lessons`)}`);
      
      const destination = resolveExitDestination(mockExam, searchParams, null);
      expect(destination).toBe(`/app/class/${mockExam.classId}/lessons`);
    });

    it("should fallback to canonical class lessons workspace when both state and params are missing", () => {
      const destination = resolveExitDestination(mockExam, null, null);
      expect(destination).toBe(`/app/class/${mockExam.classId}/lessons`);
    });
  });

  describe("Security & Route Sanitization", () => {
    it("should sanitize open redirect attempts and return safe app fallback", () => {
      expect(sanitizeInternalRoute("https://malicious-site.com", "/app")).toBe("/app");
      expect(sanitizeInternalRoute("//malicious-site.com", "/app")).toBe("/app");
      expect(sanitizeInternalRoute("javascript:alert(1)", "/app")).toBe("/app");
      expect(sanitizeInternalRoute("/app/class/123/lessons", "/app")).toBe("/app/class/123/lessons");
    });
  });
});
