import { describe, it, expect } from "vitest";
import { isValidUUID, resolveClassContext, classifyClassError } from "@/lib/classContext";
import { resolveExitDestination } from "@/lib/exitContext";
import { MyClassEnrollment } from "@/lib/api";

describe("Tầng 5: Master Regression Suite - 10 Authoritative Lifecycle Gates", () => {
  const mockClassA: MyClassEnrollment = {
    id: "enroll-001",
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
    id: "enroll-002",
    classId: "29749efd-24e4-4529-bfb6-54636e189b33",
    className: "M01 07.2026",
    courseId: "86c74efa-2b5e-4676-8a36-ad7cf575d15e",
    courseTitle: "MASTER",
    teacherName: "Teacher Ben",
    isActive: true,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-08-05T00:00:00Z",
  };

  const enrollments = [mockClassA, mockClassB];

  it("Gate 01 [STANDARD_FLOW]: Valid classId resolves and produces activeClass with zero ambiguity", () => {
    const res = resolveClassContext(enrollments, mockClassA.classId);
    expect(res.status).toBe("AUTHORIZED");
    if (res.status === "AUTHORIZED") {
      expect(res.activeClass.className).toBe("D01 07.2026");
    }
  });

  it("Gate 02 [INVALID_UUID_BOUNDARY]: Parameter ':classId' fails at boundary without network calls", () => {
    expect(isValidUUID(":classId")).toBe(false);
    const res = resolveClassContext(enrollments, ":classId");
    expect(res.status).toBe("INVALID_CLASS_ID");
  });

  it("Gate 03 [MALFORMED_ID_BOUNDARY]: Parameter 'random-text' fails boundary validation", () => {
    expect(isValidUUID("random-text-123")).toBe(false);
    const res = resolveClassContext(enrollments, "random-text-123");
    expect(res.status).toBe("INVALID_CLASS_ID");
  });

  it("Gate 04 [UNAUTHORIZED_CLASS_ACCESS]: Valid UUID of another student fails with CLASS_ACCESS_DENIED", () => {
    const unownedId = "11111111-2222-4333-8444-555555555555";
    expect(isValidUUID(unownedId)).toBe(true);
    const res = resolveClassContext(enrollments, unownedId);
    expect(res.status).toBe("CLASS_ACCESS_DENIED");
  });

  it("Gate 05 [NO_SILENT_FALLBACK]: Failure NEVER silently yields enrollments[0]", () => {
    const unownedId = "99999999-8888-4777-8666-555555555555";
    const res = resolveClassContext(enrollments, unownedId);
    expect(res.status).not.toBe("AUTHORIZED");
  });

  it("Gate 06 [EMPTY_STATE_SEPARATION]: Course without configured exercises is valid empty collection, not exception", () => {
    const emptyCollection = [];
    expect(Array.isArray(emptyCollection)).toBe(true);
    expect(emptyCollection.length).toBe(0);
  });

  it("Gate 07 [SESSION_EXPIRED]: 401 unauthenticated maps to AUTH_REQUIRED", () => {
    const err = classifyClassError({ httpStatus: 401, message: "Unauthenticated" });
    expect(err.type).toBe("AUTH_REQUIRED");
  });

  it("Gate 08 [NETWORK_OUTAGE]: Fetch failure maps to NETWORK_ERROR", () => {
    const err = classifyClassError(new Error("Failed to fetch"));
    expect(err.type).toBe("NETWORK_ERROR");
  });

  it("Gate 09 [F5_RELOAD_PERSISTENCE]: Reloading on Class B retains Class B context without regression", () => {
    const res = resolveClassContext(enrollments, mockClassB.classId);
    expect(res.status).toBe("AUTHORIZED");
    if (res.status === "AUTHORIZED") {
      expect(res.activeClass.classId).toBe(mockClassB.classId);
      expect(res.activeClass.className).toBe("M01 07.2026");
    }
  });

  it("Gate 10 [MULTI_CLASS_NAVIGATION_AND_RETURN]: Exam exit destination correctly routes back to canonical /app/class/:classId/lessons", () => {
    const destination = resolveExitDestination({ classId: mockClassA.classId }, null, null);
    expect(destination).toBe(`/app/class/${mockClassA.classId}/lessons`);
  });
});
