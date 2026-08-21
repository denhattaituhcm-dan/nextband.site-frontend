import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthorizationService } from "../../server/services/authorization.service";

describe("5 Confirmed Defects Remediation Regression Suite", () => {
  let mockPrisma: any;
  let authService: AuthorizationService;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findUnique: vi.fn(),
      },
      exam: {
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    };
    authService = new AuthorizationService(mockPrisma);
  });

  describe("Fix 3: Teacher Course Authoring Access Guard", () => {
    it("should allow admin regardless of course teacherId", async () => {
      const allowed = await authService.requireCourseAuthoringAccess(
        "course-1",
        "admin-user-id",
        ["admin"],
      );
      expect(allowed).toBe(true);
      expect(mockPrisma.course.findUnique).not.toHaveBeenCalled();
    });

    it("should allow designated teacher who owns the course", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        teacherId: "teacher-123",
        isActive: true,
      });

      const allowed = await authService.requireCourseAuthoringAccess(
        "course-1",
        "teacher-123",
        ["teacher"],
      );
      expect(allowed).toBeDefined();
      expect(mockPrisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: "course-1" },
        select: { teacherId: true, isActive: true },
      });
    });

    it("should reject teacher who does NOT own the course with 403", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        teacherId: "teacher-owner-456",
        isActive: true,
      });

      await expect(
        authService.requireCourseAuthoringAccess(
          "course-1",
          "unauthorized-teacher-789",
          ["teacher"],
        ),
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining("Bạn không phụ trách khóa học này"),
      });
    });

    it("should reject teacher when course has teacherId: null with 403", async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: "course-1",
        teacherId: null,
        isActive: true,
      });

      await expect(
        authService.requireCourseAuthoringAccess(
          "course-1",
          "teacher-123",
          ["teacher"],
        ),
      ).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining("Bạn không phụ trách khóa học này"),
      });
    });

    it("should throw 404 when course does not exist", async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null);

      await expect(
        authService.requireCourseAuthoringAccess(
          "non-existent-course",
          "teacher-123",
          ["teacher"],
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: expect.stringContaining("Khóa học không tồn tại"),
      });
    });
  });
});
