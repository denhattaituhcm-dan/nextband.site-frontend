import { describe, it, expect } from "vitest";
import { isValidUUID, resolveClassContext, classifyClassError } from "@/lib/classContext";
import { MyClassEnrollment } from "@/lib/api";

describe("Tầng 1: Unit Test - Class Context Resolver & Boundary Guard", () => {
  const mockClassA: MyClassEnrollment = {
    id: "enroll-001-uuid-000000000001",
    classId: "0defcb78-0eca-490e-8e41-476eedffe353",
    className: "D01 07.2026",
    courseId: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
    courseTitle: "DREAMER",
    teacherName: "Teacher Alex",
    isActive: true,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-08-01T00:00:00Z",
  };

  const mockClassB: MyClassEnrollment = {
    id: "enroll-002-uuid-000000000002",
    classId: "29749efd-24e4-4529-bfb6-54636e189b33",
    className: "M01 07.2026",
    courseId: "86c74efa-2b5e-4676-8a36-ad7cf575d15e",
    courseTitle: "MASTER",
    teacherName: "Teacher Ben",
    isActive: true,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-08-05T00:00:00Z",
  };

  const studentEnrollments = [mockClassA, mockClassB];

  describe("UUID Boundary Guard", () => {
    it("should accept valid standard UUID v4 strings", () => {
      expect(isValidUUID("0defcb78-0eca-490e-8e41-476eedffe353")).toBe(true);
      expect(isValidUUID("29749efd-24e4-4529-bfb6-54636e189b33")).toBe(true);
    });

    it("should reject garbage, literal parameters, or injection strings", () => {
      expect(isValidUUID(":classId")).toBe(false);
      expect(isValidUUID("undefined")).toBe(false);
      expect(isValidUUID("null")).toBe(false);
      expect(isValidUUID("")).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
      expect(isValidUUID("abc-xyz")).toBe(false);
      expect(isValidUUID("12345")).toBe(false);
      expect(isValidUUID("0defcb78-0eca-490e-8e41-476eedffe353; DROP TABLE classes;")).toBe(false);
    });
  });

  describe("TEST-01 [CLIENT_BOUNDARY_INVALID_UUID]", () => {
    it("should reject invalid UUID parameter with explicit INVALID_CLASS_ID error without network requests", () => {
      const result = resolveClassContext(studentEnrollments, ":classId");
      expect(result.status).toBe("INVALID_CLASS_ID");
      if (result.status === "INVALID_CLASS_ID") {
        expect(result.error.type).toBe("INVALID_CLASS_ID");
        expect(result.error.message).toContain("không hợp lệ");
      }
    });

    it("should reject malformed text parameter ('random-id') with INVALID_CLASS_ID", () => {
      const result = resolveClassContext(studentEnrollments, "random-id-1234");
      expect(result.status).toBe("INVALID_CLASS_ID");
    });
  });

  describe("TEST-02 [AUTH_AUTHORIZATION_MISMATCH & NO_SILENT_FALLBACK]", () => {
    it("should reject a valid UUID that does not belong to the student with CLASS_ACCESS_DENIED (403)", () => {
      const unownedClassId = "99999999-9999-4999-8999-999999999999";
      const result = resolveClassContext(studentEnrollments, unownedClassId);
      
      expect(result.status).toBe("CLASS_ACCESS_DENIED");
      if (result.status === "CLASS_ACCESS_DENIED") {
        expect(result.error.type).toBe("CLASS_ACCESS_DENIED");
        expect(result.error.httpStatus).toBe(403);
      }
    });

    it("INVARIANT-01: MUST NEVER silently fallback to enrollments[0] when given an unauthorized classId", () => {
      const unownedClassId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const result = resolveClassContext(studentEnrollments, unownedClassId);
      
      expect(result.status).not.toBe("AUTHORIZED");
      expect(result.status).toBe("CLASS_ACCESS_DENIED");
    });
  });

  describe("TEST-03 [RESOLVER_AUTHORIZED_MATCH]", () => {
    it("should correctly resolve Class A when targetClassId matches Class A", () => {
      const result = resolveClassContext(studentEnrollments, mockClassA.classId);
      expect(result.status).toBe("AUTHORIZED");
      if (result.status === "AUTHORIZED") {
        expect(result.activeClass.classId).toBe(mockClassA.classId);
        expect(result.activeClass.className).toBe("D01 07.2026");
        expect(result.activeClass.courseTitle).toBe("DREAMER");
      }
    });

    it("should correctly resolve Class B when targetClassId matches Class B", () => {
      const result = resolveClassContext(studentEnrollments, mockClassB.classId);
      expect(result.status).toBe("AUTHORIZED");
      if (result.status === "AUTHORIZED") {
        expect(result.activeClass.classId).toBe(mockClassB.classId);
        expect(result.activeClass.className).toBe("M01 07.2026");
        expect(result.activeClass.courseTitle).toBe("MASTER");
      }
    });

    it("should resolve default initial class (enrollments[0]) ONLY when targetClassId is null or undefined", () => {
      const result = resolveClassContext(studentEnrollments, null);
      expect(result.status).toBe("AUTHORIZED");
      if (result.status === "AUTHORIZED") {
        expect(result.activeClass.classId).toBe(mockClassA.classId);
      }
    });
  });

  describe("Error Classification Taxonomy", () => {
    it("should classify 401 unauthenticated errors as AUTH_REQUIRED", () => {
      const err = classifyClassError({ httpStatus: 401, message: "Unauthenticated" });
      expect(err.type).toBe("AUTH_REQUIRED");
    });

    it("should classify 403 authorization failures as CLASS_ACCESS_DENIED", () => {
      const err = classifyClassError({ httpStatus: 403, message: "Access Denied" });
      expect(err.type).toBe("CLASS_ACCESS_DENIED");
    });

    it("should classify 404 missing class errors as CLASS_NOT_FOUND", () => {
      const err = classifyClassError({ httpStatus: 404, message: "Class Not Found" });
      expect(err.type).toBe("CLASS_NOT_FOUND");
    });

    it("should classify PostgreSQL 22P02 as INVALID_CLASS_ID", () => {
      const err = classifyClassError({ message: 'invalid input syntax for type uuid: ":classId"' });
      expect(err.type).toBe("INVALID_CLASS_ID");
    });

    it("should classify network fetch failures as NETWORK_ERROR", () => {
      const err = classifyClassError(new TypeError("Failed to fetch"));
      expect(err.type).toBe("NETWORK_ERROR");
    });
  });
});
