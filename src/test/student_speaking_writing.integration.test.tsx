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
    start: vi.fn().mockResolvedValue({ id: "sub-sw-1", answers: {}, status: "in_progress" }),
    getById: vi.fn().mockResolvedValue({ id: "sub-sw-1", answers: {}, status: "in_progress" }),
    saveAnswers: vi.fn().mockResolvedValue({ success: true }),
    submit: vi.fn().mockResolvedValue({ success: true }),
  },
  formatStorageUrl: (url: string) => url,
  isValidUUID: () => true,
}));

vi.mock("../lib/tabLeaseManager", () => ({
  TabLeaseManager: class {
    start = vi.fn().mockResolvedValue(true);
    destroy = vi.fn();
    subscribe = (cb: any) => {
      cb(true, null);
      return () => {};
    };
  },
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "student-1", fullName: "Test Student", roles: ["student"] },
    isAuthenticated: true,
    isAdmin: false,
    isTeacher: false,
  }),
}));

describe("🎙️ & ✍️ Journey 4: Student Speaking & Writing Exam Interface Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const mockSpeakingWritingExam = {
    id: "exam-sw-test",
    title: "IELTS Speaking & Writing Practice",
    durationMinutes: 60,
    isPublished: true,
    isActive: true,
    sections: [
      {
        id: "sec-writing-1",
        sectionType: "writing",
        title: "Writing Task 2",
        orderIndex: 0,
        questionGroups: [
          {
            id: "grp-w-1",
            title: "Essay Topic",
            passage: "<p>Some people believe that university education should be free for all. Do you agree?</p>",
            instructions: "Write at least 250 words on the following topic.",
            orderIndex: 0,
            questions: [
              {
                id: "q-essay-1",
                questionType: "essay",
                questionText: "<p>Write your essay response here.</p>",
                points: 9,
                orderIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  it("Mounts ExamInterface with Writing Section, renders essay textarea, word count and updates answer cleanly", async () => {
    (examsApi.getById as any).mockResolvedValue(mockSpeakingWritingExam);

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={["/exam/exam-sw-test"]}>
            <Routes>
              <Route path="/exam/:examId" element={<ExamInterface />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("IELTS Speaking & Writing Practice")).toBeInTheDocument();
      expect(screen.getByText(/university education should be free/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Viết bài luận của bạn tại đây/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Viết bài luận của bạn tại đây/i);
    fireEvent.change(textarea, { target: { value: "In my opinion, higher education plays a crucial role..." } });

    await waitFor(() => {
      expect(screen.getByText(/Số từ:/i)).toBeInTheDocument();
      expect(textarea).toHaveValue("In my opinion, higher education plays a crucial role...");
    });
  });
});
