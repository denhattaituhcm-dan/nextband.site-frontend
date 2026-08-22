import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminExamEdit from "../pages/admin/ExamEdit";
import AdminSectionEdit from "../pages/admin/SectionEdit";
import { examsApi, sectionsApi, questionsApi } from "../lib/api";

// Mock API layer
vi.mock("../lib/api", () => ({
  examsApi: {
    getById: vi.fn(),
    update: vi.fn(),
  },
  sectionsApi: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  questionsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  questionGroupsApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  formatStorageUrl: (url: string) => url,
  isValidUUID: () => true,
  fetchWithResilience: vi.fn(),
  getAuthToken: vi.fn().mockResolvedValue("mock-jwt-token"),
  API_BASE_URL: "http://localhost:3000/api/v1",
}));

// Mock useAuth
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "admin-1", fullName: "Admin User", roles: ["admin"] },
    isAuthenticated: true,
    isAdmin: true,
    isTeacher: false,
    signOut: vi.fn(),
  }),
}));

describe("🏛️ Journey 1: Admin Exam & Section Management Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const mockExam = {
    id: "exam-123",
    courseId: "course-456",
    title: "IELTS Academic Test 1",
    description: "Full practice test",
    week: 1,
    durationMinutes: 120,
    isPublished: true,
    isActive: true,
    sections: [
      {
        id: "sec-reading-1",
        examId: "exam-123",
        sectionType: "reading",
        title: "Reading Section 1",
        orderIndex: 0,
        questionGroups: [
          {
            id: "grp-1",
            sectionId: "sec-reading-1",
            title: "Passage 1: The History of Tea",
            passage: "<p>Tea has a long history...</p>",
            instructions: "Read the passage and answer questions 1-5",
            orderIndex: 0,
            questions: [
              {
                id: "q-1",
                groupId: "grp-1",
                questionType: "multiple_choice",
                questionText: "<p>Where did tea originate?</p>",
                options: ["China", "India", "Japan", "Vietnam"],
                correctAnswer: "China",
                points: 1,
                orderIndex: 0,
              },
            ],
          },
        ],
      },
    ],
  };

  it("Step 1 & 2: Renders AdminExamEdit, switches to Sections tab, and displays section cards", async () => {
    (examsApi.getById as any).mockResolvedValue(mockExam);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/admin/exams/exam-123?tab=sections"]}>
          <Routes>
            <Route path="/admin/exams/:id" element={<AdminExamEdit />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Quản lý Sections")).toBeInTheDocument();
      expect(screen.getByText("Reading Section 1")).toBeInTheDocument();
      expect(screen.getByText("READING")).toBeInTheDocument();
    });

    const editBtn = screen.getByRole("link", { name: /Sửa/i });
    expect(editBtn).toHaveAttribute("href", "/admin/sections/sec-reading-1");
  });

  it("Step 3 & 4: Renders AdminSectionEdit, displays passage and question groups without crashing", async () => {
    (sectionsApi.getById as any).mockResolvedValue(mockExam.sections[0]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/admin/sections/sec-reading-1"]}>
          <Routes>
            <Route path="/admin/sections/:id" element={<AdminSectionEdit />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Passage 1: The History of Tea")).toBeInTheDocument();
      expect(screen.getByText(/Where did tea originate\?/i)).toBeInTheDocument();
      expect(screen.getByText("China")).toBeInTheDocument();
    });
  });

  it("Step 5 & 6: Opens and verifies Question Dialog and Smart Bulk Import without runtime crashes", async () => {
    (sectionsApi.getById as any).mockResolvedValue(mockExam.sections[0]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/admin/sections/sec-reading-1"]}>
          <Routes>
            <Route path="/admin/sections/:id" element={<AdminSectionEdit />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Passage 1: The History of Tea")).toBeInTheDocument();
    });

    // Click "Nhập nhanh"
    const bulkImportBtn = screen.getByRole("button", { name: /Nhập nhanh/i });
    fireEvent.click(bulkImportBtn);

    expect(screen.getByText("Nhập nhanh câu hỏi thông minh")).toBeInTheDocument();

    // Type bulk questions
    const textarea = screen.getByPlaceholderText(/Ví dụ dán vào đây/i);
    fireEvent.change(textarea, {
      target: {
        value: "1. What is tea?\nA. Drink\nB. Food\nĐáp án: A",
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/Đã nhận diện: 1 câu hỏi/i)).toBeInTheDocument();
    });
  });
});
