import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "@/pages/HomePage";
import { classStudentsApi, submissionsApi } from "@/lib/api";

// Mock useAuth
const mockUser = {
  id: "d16e345c-9c14-4b4f-9788-1a255237d678",
  email: "denhattaituhcm@gmail.com",
  fullName: "DANBUFFETT",
  roles: ["student"],
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("HomePage Consumer-Level Fault Isolation & Resilience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("Gate 1: When Enrollment API returns 500, HomePage renders Error Banner gracefully (No Infinite Skeleton)", async () => {
    vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
      status: "api_error",
      httpStatus: 500,
      message: "Database connection refused",
    });

    renderHomePage();

    // Verify: Banner appears and Skeleton is gone
    await waitFor(() => {
      expect(screen.getByText("Không thể tải thông tin lớp học")).toBeInTheDocument();
    });

    expect(screen.getByText(/Database connection refused/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thử lại/i })).toBeInTheDocument();
  });

  it("Gate 2: When Enrollment API has network failure, HomePage renders Network Error Banner", async () => {
    vi.spyOn(classStudentsApi, "getMyClasses").mockResolvedValue({
      status: "network_error",
      message: "Failed to fetch",
    });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText("Không thể kết nối tới máy chủ")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Thử lại/i })).toBeInTheDocument();
  });

  it("Gate 3: When Enrollment succeeds (ENROLLED) but child KPI API fails, HomePage still renders class cards (Fault Isolation)", async () => {
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

    // Child KPI API fails
    vi.spyOn(submissionsApi, "list").mockRejectedValue(new Error("KPI service down"));

    renderHomePage();

    // Verify: Class welcome banner renders successfully despite KPI failure
    await waitFor(() => {
      expect(screen.getByText(/Xin chào, DANBUFFETT!/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/D01 07.2026/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Vào Lớp D01 07.2026 để Làm Bài/i })).toBeInTheDocument();
  });
});
