import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminNotificationsPage from "../pages/admin/Notifications";
import { notificationsApi, classesApi } from "../lib/api";

vi.mock("../lib/api", () => ({
  notificationsApi: {
    listAdminBroadcasts: vi.fn(),
    getBroadcastRecipients: vi.fn(),
    broadcast: vi.fn(),
    deleteBroadcast: vi.fn(),
  },
  classesApi: {
    list: vi.fn(),
  },
}));

describe("🔔 Admin Notifications UI Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminNotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("Renders header, quick templates and broadcasts table with metrics", async () => {
    (notificationsApi.listAdminBroadcasts as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "bc-1",
          broadcastId: "bc-1",
          title: "Thông báo nghỉ lễ Quốc Khánh 2/9",
          message: "Nghỉ lễ từ ngày 01/09 đến hết ngày 03/09",
          type: "ANNOUNCEMENT",
          targetType: "ALL",
          totalRecipients: 50,
          readCount: 42,
          readRate: 84,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 10 },
    });

    renderComponent();

    // Check page header
    expect(await screen.findByText("Quản lý & Phát Thông Báo")).toBeInTheDocument();

    // Check quick presets
    expect(screen.getByText("Nghỉ Tết Âm Lịch")).toBeInTheDocument();
    expect(screen.getByText("Nghỉ lễ Quốc Khánh 2/9")).toBeInTheDocument();
    expect(screen.getByText("Bảo trì & Nâng cấp")).toBeInTheDocument();

    // Check broadcast row in table
    expect(await screen.findByText("Thông báo nghỉ lễ Quốc Khánh 2/9")).toBeInTheDocument();
    expect(screen.getByText("42 / 50 đã đọc")).toBeInTheDocument();
    expect(screen.getAllByText("84%").length).toBeGreaterThanOrEqual(1);
  });

  it("Applies template to pre-fill broadcast creation form with live preview", async () => {
    (notificationsApi.listAdminBroadcasts as any).mockResolvedValue({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 10 },
    });
    (classesApi.list as any).mockResolvedValue({ data: [] });
    (notificationsApi.broadcast as any).mockResolvedValue({
      success: true,
      broadcastId: "new-bc",
      recipientCount: 25,
      message: "Đã phát thông báo thành công",
    });

    renderComponent();

    // Click "Dùng mẫu này" for Nghỉ Tết Âm Lịch
    const tetButton = await screen.findByText("Nghỉ Tết Âm Lịch");
    fireEvent.click(tetButton);

    // Modal title should appear
    expect(await screen.findByText("Soạn & Phát Thông Báo Mới")).toBeInTheDocument();

    // Form title should be pre-filled
    const titleInput = screen.getByDisplayValue("Thông báo lịch nghỉ Tết Âm Lịch");
    expect(titleInput).toBeInTheDocument();

    // Submit the form
    const submitBtn = screen.getByText("Phát thông báo ngay");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(notificationsApi.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Thông báo lịch nghỉ Tết Âm Lịch",
          targetType: "ALL",
        })
      );
    });
  });
});
