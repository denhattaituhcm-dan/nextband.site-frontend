import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationBell } from "../components/navigation/NotificationBell";
import { notificationsApi } from "../lib/api";

vi.mock("../lib/api", () => ({
  notificationsApi: {
    list: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-test-uuid-1", email: "student@test.com", fullName: "Nguyễn Văn An" },
    isAuthenticated: true,
  }),
}));

describe("🔔 NotificationBell Component & Client Contract Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("DoD #3 & #4 & #12: Displays unread count badge and fetches notifications list", async () => {
    (notificationsApi.getUnreadCount as any).mockResolvedValue({ success: true, count: 3 });
    (notificationsApi.list as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "notif-1",
          userId: "user-test-uuid-1",
          type: "NEW_SUBMISSION",
          title: "Bài nộp mới cần chấm",
          message: "Học viên Nguyễn Văn An vừa nộp bài thi IELTS Writing Task 1.",
          link: "/admin/submissions/sub-1",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif-2",
          userId: "user-test-uuid-1",
          type: "SUBMISSION_GRADED",
          title: "Kết quả bài thi",
          message: "Bài thi Listening Cam 18 của bạn đã có điểm: Band 7.5.",
          link: "/results/sub-2",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "notif-3",
          userId: "user-test-uuid-1",
          type: "TEACHER_FEEDBACK",
          title: "Giáo viên đã nhận xét bài thi",
          message: "Thầy/Cô đã gửi nhận xét bài viết Task 2.",
          link: "/results/sub-3",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 3,
      pagination: { total: 3, page: 1, limit: 30 },
    });

    renderComponent();

    // Check badge count
    const badge = await screen.findByText("3");
    expect(badge).toBeInTheDocument();

    // Click bell to open popover
    const bellButton = screen.getByLabelText("Thông báo");
    fireEvent.click(bellButton);

    // Verify notification titles and messages
    expect(await screen.findByText("Bài nộp mới cần chấm")).toBeInTheDocument();
    expect(screen.getByText("Kết quả bài thi")).toBeInTheDocument();
    expect(screen.getByText("Giáo viên đã nhận xét bài thi")).toBeInTheDocument();
  });

  it("DoD #5: Clicking unread notification triggers markAsRead", async () => {
    (notificationsApi.getUnreadCount as any).mockResolvedValue({ success: true, count: 1 });
    (notificationsApi.list as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "notif-mark-1",
          userId: "user-test-uuid-1",
          type: "SUBMISSION_GRADED",
          title: "Kết quả bài thi",
          message: "Bài thi của bạn đã có điểm.",
          link: "/results/sub-1",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
      pagination: { total: 1, page: 1, limit: 30 },
    });
    (notificationsApi.markAsRead as any).mockResolvedValue({ success: true });

    renderComponent();

    const bellButton = screen.getByLabelText("Thông báo");
    fireEvent.click(bellButton);

    const item = await screen.findByText("Kết quả bài thi");
    fireEvent.click(item);

    await waitFor(() => {
      expect(notificationsApi.markAsRead).toHaveBeenCalledWith("notif-mark-1");
    });
  });

  it("DoD #6: Clicking 'Đọc tất cả' triggers markAllAsRead", async () => {
    (notificationsApi.getUnreadCount as any).mockResolvedValue({ success: true, count: 2 });
    (notificationsApi.list as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "notif-a",
          userId: "user-test-uuid-1",
          type: "NEW_SUBMISSION",
          title: "Thông báo 1",
          message: "Nội dung 1",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 2,
      pagination: { total: 1, page: 1, limit: 30 },
    });
    (notificationsApi.markAllAsRead as any).mockResolvedValue({ success: true, markedCount: 2 });

    renderComponent();

    const bellButton = screen.getByLabelText("Thông báo");
    fireEvent.click(bellButton);

    const readAllButton = await screen.findByText("Đọc tất cả");
    fireEvent.click(readAllButton);

    await waitFor(() => {
      expect(notificationsApi.markAllAsRead).toHaveBeenCalledTimes(1);
    });
  });

  it("DoD #1 & Error State: Handles API failure gracefully with retry option", async () => {
    (notificationsApi.getUnreadCount as any).mockRejectedValue(new Error("API Connection Failed"));
    (notificationsApi.list as any).mockRejectedValue(new Error("API Connection Failed"));

    renderComponent();

    const bellButton = screen.getByLabelText("Thông báo");
    fireEvent.click(bellButton);

    expect(
      await screen.findByText("Không thể tải thông báo. Vui lòng kiểm tra kết nối.")
    ).toBeInTheDocument();
    expect(screen.getByText("Thử lại")).toBeInTheDocument();
  });

  describe("🎯 Entity Resolution & Link Fallback Tests", () => {
    it("resolves SUBMISSION entity to /admin/submissions/:id for teacher/admin scope", async () => {
      const { resolveNotificationLink } = await import("../components/navigation/NotificationBell");
      const item = {
        id: "notif-sub-1",
        userId: "teacher-1",
        type: "NEW_SUBMISSION",
        title: "Bài nộp mới",
        message: "Bài làm mới",
        entityType: "SUBMISSION",
        entityId: "sub-999",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      expect(resolveNotificationLink(item, "teacher")).toBe("/admin/submissions/sub-999");
      expect(resolveNotificationLink(item, "admin")).toBe("/admin/submissions/sub-999");
      expect(resolveNotificationLink(item, "student")).toBe("/app/submissions/sub-999");
    });

    it("resolves ASSESSMENT_SESSION entity to /admin/assessments/:id", async () => {
      const { resolveNotificationLink } = await import("../components/navigation/NotificationBell");
      const item = {
        id: "notif-ass-1",
        userId: "admin-1",
        type: "NEW_SUBMISSION",
        title: "Test mới",
        message: "Khảo thí mới",
        entityType: "ASSESSMENT_SESSION",
        entityId: "session-abc",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      expect(resolveNotificationLink(item, "admin")).toBe("/admin/assessments/session-abc");
    });

    it("falls back to item.link when entity is generic SYSTEM", async () => {
      const { resolveNotificationLink } = await import("../components/navigation/NotificationBell");
      const item = {
        id: "notif-sys-1",
        userId: "user-1",
        type: "SYSTEM",
        title: "Thông báo hệ thống",
        message: "Bảo trì",
        link: "/maintenance-info",
        entityType: "SYSTEM",
        entityId: "GLOBAL",
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      expect(resolveNotificationLink(item)).toBe("/maintenance-info");
    });
  });
});

