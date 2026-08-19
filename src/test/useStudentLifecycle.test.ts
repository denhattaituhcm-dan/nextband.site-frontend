import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudentLifecycle } from "@/hooks/useStudentLifecycle";
import { classStudentsApi } from "@/lib/api";

// Mock useAuth
const mockUser = {
  id: "d16e345c-9c14-4b4f-9788-1a255237d678",
  email: "denhattaituhcm@gmail.com",
  fullName: "DANBUFFETT",
  roles: ["student"],
};

let mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockAuthContext,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useStudentLifecycle - Pure Enrollment Lifecycle & Terminal-State Hardening", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAuthContext = {
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
    };
  });

  describe("Contract Invariant: Terminal States Guarantee (Never Stuck in LOADING)", () => {
    it("Case A: 200 OK with enrollments -> ENROLLED (isLoading === false)", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
        status: "ok",
        data: [
          {
            id: "ba6d9646-9247-4155-8d76-aebc9e5ecba5",
            classId: "0defcb78-0eca-490e-8e41-476eedffe353",
            className: "D01 07.2026",
            courseId: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
            courseTitle: "DREAMER",
            teacherName: "Teacher Dan",
            isActive: true,
            membershipStatus: "ACTIVE",
            joinedAt: "2026-08-14T06:10:48.248Z",
          },
        ],
      });

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("ENROLLED");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasEnrollments).toBe(true);
      expect(result.current.enrollments).toHaveLength(1);
      expect(result.current.enrollments[0].className).toBe("D01 07.2026");
    });

    it("Case B: 200 OK with empty enrollments -> PRE_ENROLLMENT (isLoading === false)", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
        status: "ok",
        data: [],
      });

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("PRE_ENROLLMENT");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasEnrollments).toBe(false);
      expect(result.current.enrollments).toHaveLength(0);
    });

    it("Case C: 401 / 403 Unauthenticated / Forbidden -> API_ERROR (isLoading === false)", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
        status: "unauthenticated",
      });

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("API_ERROR");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.lifecycleError?.httpStatus).toBe(401);
    });

    it("Case D: 500 Server Error -> API_ERROR (isLoading === false)", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
        status: "api_error",
        httpStatus: 500,
        message: "Internal server error",
      });

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("API_ERROR");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.lifecycleError?.httpStatus).toBe(500);
      expect(result.current.lifecycleError?.message).toBe("Internal server error");
    });

    it("Case E: Network Failure / Timeout -> NETWORK_ERROR (isLoading === false)", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
        status: "network_error",
        message: "Failed to fetch",
      });

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("NETWORK_ERROR");
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.lifecycleError?.message).toBe("Failed to fetch");
    });

    it("Case E.2: Unexpected Query Exception / Promise Rejection -> NETWORK_ERROR (isLoading === false)", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockRejectedValue(
        new TypeError("Network request failed")
      );

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("NETWORK_ERROR");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Fault Isolation (Zero Domino)", () => {
    it("Lifecycle does NOT depend on workspaceApi or secondary widgets", async () => {
      vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
        status: "ok",
        data: [
          {
            id: "cls-1",
            classId: "0defcb78-0eca-490e-8e41-476eedffe353",
            className: "D01 07.2026",
            courseId: "605d3bec-7a80-4cb7-ba7f-ecc74e77e1ab",
            courseTitle: "DREAMER",
            teacherName: null,
            isActive: true,
            membershipStatus: "ACTIVE",
            joinedAt: "2026-08-14T06:10:48.248Z",
          },
        ],
      });

      const { result } = renderHook(() => useStudentLifecycle(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.state).toBe("ENROLLED");
      });

      // Verification: resolveClass works purely without any workspace side-effects
      const res = result.current.resolveClass("0defcb78-0eca-490e-8e41-476eedffe353");
      expect(res.status).toBe("AUTHORIZED");
      expect((res as any).activeClass?.className).toBe("D01 07.2026");
    });
  });
});
