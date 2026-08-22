import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    start: vi.fn().mockResolvedValue({ id: "sub-listening-1", answers: {}, status: "in_progress" }),
    getById: vi.fn().mockResolvedValue({ id: "sub-listening-1", answers: {}, status: "in_progress" }),
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

describe("🎧 Journey 3: Student Listening Exam Interface Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const mockListeningExam = {
    id: "exam-listening-test",
    title: "IELTS Listening Practice Test 1",
    durationMinutes: 30,
    isPublished: true,
    isActive: true,
    sections: [
      {
        id: "sec-listening-1",
        sectionType: "listening",
        title: "Listening Section 1",
        audioUrl: "https://example.com/audio1.mp3",
        orderIndex: 0,
        questionGroups: [
          {
            id: "grp-listen-1",
            title: "Part 1: Conversation at the Library",
            instructions: "Complete the notes below. Write NO MORE THAN TWO WORDS.",
            audioUrl: "https://example.com/audio_part1.mp3",
            orderIndex: 0,
            questions: [
              {
                id: "q-fill-1",
                questionType: "short_answer",
                questionText: "The library is closed on [BLANK].",
                points: 1,
                orderIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  it("Mounts ExamInterface with Listening Section, initializes audio and questions without error", async () => {
    (examsApi.getById as any).mockResolvedValue(mockListeningExam);

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={["/exam/exam-listening-test"]}>
            <Routes>
              <Route path="/exam/:examId" element={<ExamInterface />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("IELTS Listening Practice Test 1")).toBeInTheDocument();
      expect(screen.getByText("Part 1: Conversation at the Library")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Nhập câu trả lời...")).toBeInTheDocument();
    });
  });
});
