import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "../components/ui/tooltip";
import ExamInterface from "../pages/ExamInterface";
import { examsApi, submissionsApi } from "../lib/api";

vi.mock("../lib/api", () => ({
  examsApi: {
    getById: vi.fn(),
  },
  submissionsApi: {
    start: vi.fn().mockResolvedValue({ id: "sub-reading-1", answers: {}, status: "in_progress" }),
    getById: vi.fn().mockResolvedValue({ id: "sub-reading-1", answers: {}, status: "in_progress" }),
    saveAnswers: vi.fn().mockResolvedValue({ success: true }),
    submit: vi.fn().mockResolvedValue({ success: true }),
  },
  formatStorageUrl: (url: string) => url,
  isValidUUID: () => true,
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "student-1", fullName: "Test Student", roles: ["student"] },
    isAuthenticated: true,
    isAdmin: false,
    isTeacher: false,
  }),
}));

describe("📖 Journey 2: Student Reading Exam Interface Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const mockReadingExam = {
    id: "exam-reading-test",
    title: "IELTS Reading Academic Practice",
    durationMinutes: 60,
    isPublished: true,
    isActive: true,
    sections: [
      {
        id: "sec-reading-1",
        sectionType: "reading",
        title: "Reading Section 1",
        orderIndex: 0,
        questionGroups: [
          {
            id: "grp-1",
            title: "Passage 1: Renewable Energy",
            passage: "<p>Solar and wind power have expanded exponentially...</p>",
            instructions: "Answer the following questions based on the text.",
            orderIndex: 0,
            questions: [
              {
                id: "q-mcq-1",
                questionType: "multiple_choice",
                questionText: "<p>What is the primary source of clean energy?</p>",
                options: ["Solar", "Coal", "Oil", "Gas"],
                points: 1,
                orderIndex: 0,
              },
              {
                id: "q-tf-1",
                questionType: "true_false_not_given",
                questionText: "<p>Solar panels require constant sunlight to function.</p>",
                points: 1,
                orderIndex: 1,
              },
            ],
          },
        ],
      },
    ],
  };

  it("Mounts ExamInterface with Reading Section, renders passage and controls without crashing", async () => {
    (examsApi.getById as any).mockResolvedValue(mockReadingExam);

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={["/exam/exam-reading-test"]}>
            <Routes>
              <Route path="/exam/:examId" element={<ExamInterface />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("IELTS Reading Academic Practice")).toBeInTheDocument();
      expect(screen.getByText(/Solar and wind power have expanded exponentially/i)).toBeInTheDocument();
      expect(screen.getByText(/What is the primary source of clean energy\?/i)).toBeInTheDocument();
      expect(screen.getByText("Solar")).toBeInTheDocument();
    });

    // Answer Multiple Choice
    const solarOption = screen.getByText("Solar");
    fireEvent.click(solarOption);

    // Answer True/False
    const tfDropdown = screen.getByText("Chọn đáp án");
    expect(tfDropdown).toBeInTheDocument();
  });
});
