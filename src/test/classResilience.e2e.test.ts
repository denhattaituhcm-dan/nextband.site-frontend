import { describe, it, expect } from "vitest";
import { resolveClassContext, MyClassEnrollment } from "@/lib/classContext";

describe("Tầng 4: Multi-Class Isolation & F5 Resilience Flow", () => {
  const classA: MyClassEnrollment = {
    id: "enrollment-a",
    classId: "0defcb78-0eca-490e-8e41-476eedffe353",
    className: "D01 07.2026",
    courseId: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
    courseTitle: "DREAMER",
    teacherName: "Teacher Alex",
    isActive: true,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-08-01T00:00:00Z",
  };

  const classB: MyClassEnrollment = {
    id: "enrollment-b",
    classId: "29749efd-24e4-4529-bfb6-54636e189b33",
    className: "M01 07.2026",
    courseId: "86c74efa-2b5e-4676-8a36-ad7cf575d15e",
    courseTitle: "MASTER",
    teacherName: "Teacher Ben",
    isActive: true,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-08-05T00:00:00Z",
  };

  const studentEnrollments = [classA, classB];

  describe("TEST-09 [RESILIENCE_MULTI_CLASS_ISOLATION]", () => {
    it("should maintain strict isolation when switching between Class A and Class B", () => {
      // 1. User is on Class A
      const resultA = resolveClassContext(studentEnrollments, classA.classId);
      expect(resultA.status).toBe("AUTHORIZED");
      if (resultA.status === "AUTHORIZED") {
        expect(resultA.activeClass.classId).toBe(classA.classId);
        expect(resultA.activeClass.courseTitle).toBe("DREAMER");
      }

      // 2. User switches to Class B
      const resultB = resolveClassContext(studentEnrollments, classB.classId);
      expect(resultB.status).toBe("AUTHORIZED");
      if (resultB.status === "AUTHORIZED") {
        expect(resultB.activeClass.classId).toBe(classB.classId);
        expect(resultB.activeClass.courseTitle).toBe("MASTER");
      }

      // 3. User switches back to Class A
      const resultA2 = resolveClassContext(studentEnrollments, classA.classId);
      expect(resultA2.status).toBe("AUTHORIZED");
      if (resultA2.status === "AUTHORIZED") {
        expect(resultA2.activeClass.classId).toBe(classA.classId);
        expect(resultA2.activeClass.courseTitle).toBe("DREAMER");
      }
    });
  });

  describe("TEST-10 [RESILIENCE_F5_RELOAD_PERSISTENCE]", () => {
    it("INVARIANT-04: When student is on Class B and refreshes (F5), activeClass must remain Class B and NEVER revert to Class A", () => {
      // Simulating browser F5: URL parameter retains Class B's classId
      const urlClassIdAfterF5 = classB.classId;

      const result = resolveClassContext(studentEnrollments, urlClassIdAfterF5);
      expect(result.status).toBe("AUTHORIZED");
      if (result.status === "AUTHORIZED") {
        expect(result.activeClass.classId).toBe(classB.classId);
        expect(result.activeClass.className).toBe("M01 07.2026");
        // Verify it did NOT revert to enrollments[0]
        expect(result.activeClass.classId).not.toBe(classA.classId);
      }
    });
  });
});
