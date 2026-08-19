import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SubmissionDetail from "../pages/SubmissionDetail";
import { submissionsApi } from "../lib/api";

vi.mock("../lib/api", () => {
  return {
    submissionsApi: {
      getById: vi.fn(),
      startRevision: vi.fn(),
    },
    formatStorageUrl: (url: string) => url,
  };
});

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "std-test-1", fullName: "Test Student", role: "student" },
    isAuthenticated: true,
    isAdmin: false,
    isTeacher: false,
  }),
}));

describe("🎯 P1-C: Student UI Learning Loop & Invariant Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it("Invariant 1 & 2: When revisionRequired is true, shows teacher feedback, error category, and 'Làm bài sửa (Attempt 2)' button", async () => {
    (submissionsApi.getById as any).mockResolvedValue({
      id: "sub-attempt-1",
      examId: "exam-essay-1",
      studentId: "std-test-1",
      status: "graded",
      totalScore: 5.5,
      feedback: "Cần cải thiện tính liên kết và bố cục câu ở phần thân bài 2.",
      primaryErrorCategory: "STRUCTURE",
      revisionRequired: true,
      exam: {
        id: "exam-essay-1",
        title: "IELTS Writing Task 2",
        sections: [
          {
            id: "sec-1",
            title: "Writing Section",
            sectionType: "writing",
            questionGroups: [
              {
                id: "grp-1",
                questions: [
                  {
                    id: "q-1",
                    questionType: "essay",
                    questionText: "Discuss both views and give your opinion.",
                    points: 9.0,
                  },
                ],
              },
            ],
          },
        ],
      },
      answers: [
        {
          id: "ans-1",
          questionId: "q-1",
          answerText: "Technology has both benefits and drawbacks in modern society.",
          score: 5.5,
          feedback: "Cần cải thiện tính liên kết và bố cục câu ở phần thân bài 2.",
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/submission/sub-attempt-1"]}>
          <Routes>
            <Route path="/submission/:id" element={<SubmissionDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/IELTS Writing Task 2/i)).toBeInTheDocument();
    });

    // Verify Teacher Feedback block is rendered
    expect(screen.getByText(/Phản Hồi & Đánh Giá Của Giáo Viên/i)).toBeInTheDocument();
    expect(screen.getByText(/Lỗi chính: STRUCTURE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cần cải thiện tính liên kết và bố cục câu/i).length).toBeGreaterThanOrEqual(1);

    // Verify Attempt 2 Revision Button is present
    const revisionBtn = screen.getByRole("button", { name: /Làm bài sửa \(Attempt 2\)/i });
    expect(revisionBtn).toBeInTheDocument();
  });

  it("Invariant 2: When revisionRequired is false, 'Làm bài sửa (Attempt 2)' button is NOT rendered", async () => {
    (submissionsApi.getById as any).mockResolvedValue({
      id: "sub-attempt-1",
      examId: "exam-essay-1",
      studentId: "std-test-1",
      status: "graded",
      totalScore: 8.0,
      feedback: "Bài viết rất tốt, từ vựng và cấu trúc hoàn chỉnh.",
      primaryErrorCategory: null,
      revisionRequired: false,
      exam: {
        id: "exam-essay-1",
        title: "IELTS Writing Task 2",
        sections: [],
      },
      answers: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/submission/sub-attempt-1"]}>
          <Routes>
            <Route path="/submission/:id" element={<SubmissionDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/IELTS Writing Task 2/i)).toBeInTheDocument();
    });

    // Verify Revision Button is NOT rendered
    expect(screen.queryByRole("button", { name: /Làm bài sửa \(Attempt 2\)/i })).not.toBeInTheDocument();
  });

  it("Invariant 3: Clicking 'Làm bài sửa (Attempt 2)' triggers submissionsApi.startRevision with examId", async () => {
    (submissionsApi.getById as any).mockResolvedValue({
      id: "sub-attempt-1",
      examId: "exam-essay-1",
      studentId: "std-test-1",
      status: "graded",
      totalScore: 5.0,
      feedback: "Xem lại ngữ pháp.",
      primaryErrorCategory: "GRAMMAR",
      revisionRequired: true,
      exam: {
        id: "exam-essay-1",
        title: "IELTS Writing Task 2",
        sections: [],
      },
      answers: [],
    });

    (submissionsApi.startRevision as any).mockResolvedValue({
      id: "sub-attempt-2",
      examId: "exam-essay-1",
      status: "in_progress",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/submission/sub-attempt-1"]}>
          <Routes>
            <Route path="/submission/:id" element={<SubmissionDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Làm bài sửa \(Attempt 2\)/i })).toBeInTheDocument();
    });

    const revisionBtn = screen.getByRole("button", { name: /Làm bài sửa \(Attempt 2\)/i });
    fireEvent.click(revisionBtn);

    expect(submissionsApi.startRevision).toHaveBeenCalledWith({
      examId: "exam-essay-1",
      clonePreviousAnswers: true,
    });
  });
});
