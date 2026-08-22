import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../../../server/services/notification.service";
import { NotificationType } from "@prisma/client";

describe("🔔 Admin Notifications & Broadcast Architecture Tests", () => {
  let prismaMock: any;
  let service: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock = {
      $transaction: vi.fn(async (cb) => cb(prismaMock)),
      user: {
        findMany: vi.fn(),
      },
      userRole: {
        findMany: vi.fn(),
      },
      classStudent: {
        findMany: vi.fn(),
      },
      class: {
        findUnique: vi.fn(),
      },
      notificationBroadcast: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      notification: {
        createMany: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    service = new NotificationService(prismaMock as any);
  });

  describe("1. Target Audience Resolution & Deduplication (DoD #4 & #5)", () => {
    it("Target ALL: Resolves all active users", async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { userId: "u-1" },
        { userId: "u-2" },
        { userId: "u-3" },
      ]);
      prismaMock.notificationBroadcast.create.mockResolvedValue({ id: "bc-1" });
      prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

      const res = await service.broadcastAnnouncement({
        title: "Thông báo nghỉ Tết",
        message: "Nghỉ Tết từ 28 đến mùng 6",
        targetType: "ALL",
      });

      expect(res.broadcastId).toBe("bc-1");
      expect(res.recipientCount).toBe(3);
      expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ broadcastId: "bc-1", userId: "u-1" }),
          expect.objectContaining({ broadcastId: "bc-1", userId: "u-2" }),
          expect.objectContaining({ broadcastId: "bc-1", userId: "u-3" }),
        ]),
        skipDuplicates: true,
      });
    });

    it("Target STUDENTS: Resolves only students", async () => {
      prismaMock.userRole.findMany.mockResolvedValue([
        { userId: "student-1" },
        { userId: "student-2" },
      ]);
      prismaMock.notificationBroadcast.create.mockResolvedValue({ id: "bc-2" });
      prismaMock.notification.createMany.mockResolvedValue({ count: 2 });

      const res = await service.broadcastAnnouncement({
        title: "Nhắc nhở làm bài",
        message: "Hạn nộp Writing Task 2",
        targetType: "STUDENTS",
      });

      expect(res.recipientCount).toBe(2);
      expect(prismaMock.userRole.findMany).toHaveBeenCalledWith({
        where: { role: "student", user: { isActive: true } },
        select: { userId: true },
      });
    });

    it("Target CLASS: Resolves class students + assigned teacher without duplicate", async () => {
      // User 'u-dual' is both enrolled student and teacher in edge case
      prismaMock.classStudent.findMany.mockResolvedValue([
        { studentId: "student-1" },
        { studentId: "student-2" },
        { studentId: "teacher-1" },
      ]);
      prismaMock.class.findUnique.mockResolvedValue({
        teacherId: "teacher-1",
      });
      prismaMock.notificationBroadcast.create.mockResolvedValue({ id: "bc-class" });
      prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

      const res = await service.broadcastAnnouncement({
        title: "Thông báo lớp IELTS Intensive",
        message: "Đổi phòng học sang Room 302",
        targetType: "CLASS",
        targetClassId: "class-123",
      });

      // 3 unique users: student-1, student-2, teacher-1
      expect(res.recipientCount).toBe(3);
      expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "student-1" }),
          expect.objectContaining({ userId: "student-2" }),
          expect.objectContaining({ userId: "teacher-1" }),
        ]),
        skipDuplicates: true,
      });
    });

    it("Empty target: Returns gracefully without inserting", async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const res = await service.broadcastAnnouncement({
        title: "Test",
        message: "No users",
        targetType: "ALL",
      });

      expect(res.broadcastId).toBe("");
      expect(res.recipientCount).toBe(0);
      expect(prismaMock.notificationBroadcast.create).not.toHaveBeenCalled();
    });
  });

  describe("2. Analytics & Read Rate Calculation (DoD #11 & #18)", () => {
    it("Calculates exact read rate: 40 recipients, 31 read -> 77.5%", async () => {
      prismaMock.notificationBroadcast.findMany.mockResolvedValue([
        {
          id: "bc-holiday",
          title: "Nghỉ lễ 30/4",
          message: "Nghỉ từ 30/4 đến 3/5",
          type: "ANNOUNCEMENT",
          targetType: "ALL",
          targetClassId: null,
          link: "/app",
          createdBy: "admin-1",
          createdAt: new Date(),
          publishedAt: new Date(),
          expiresAt: null,
          _count: { notifications: 40 },
        },
      ]);
      prismaMock.notificationBroadcast.count.mockResolvedValue(1);

      // Read count for bc-holiday is 31
      prismaMock.notification.count.mockResolvedValueOnce(31);

      const result = await service.listAdminBroadcasts({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.items[0].totalRecipients).toBe(40);
      expect(result.items[0].readCount).toBe(31);
      expect(result.items[0].readRate).toBe(77.5);
    });
  });

  describe("3. Recipient Viewer with Pagination & Filters (DoD #13)", () => {
    it("Filters recipients by READ status", async () => {
      prismaMock.notification.findMany.mockResolvedValue([
        {
          id: "n-1",
          userId: "u-1",
          isRead: true,
          readAt: new Date("2026-08-22T10:00:00Z"),
          createdAt: new Date("2026-08-22T08:00:00Z"),
          user: {
            userId: "u-1",
            fullName: "Trần Thị B",
            email: "b@test.com",
            avatarUrl: null,
            roles: [{ role: "student" }],
          },
        },
      ]);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await service.getBroadcastRecipients({
        broadcastId: "bc-1",
        status: "READ",
      });

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            broadcastId: "bc-1",
            isRead: true,
          }),
        })
      );
      expect(result.items[0].userName).toBe("Trần Thị B");
      expect(result.items[0].isRead).toBe(true);
    });
  });

  describe("4. Soft Delete (DoD #7 & #10)", () => {
    it("Sets deletedAt without deleting persistent notification history", async () => {
      prismaMock.notificationBroadcast.updateMany.mockResolvedValue({ count: 1 });

      const success = await service.deleteBroadcast("bc-1");

      expect(success).toBe(true);
      expect(prismaMock.notificationBroadcast.updateMany).toHaveBeenCalledWith({
        where: { id: "bc-1", deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
      // Notifications table is NOT deleted
      expect(prismaMock.notification.deleteMany).not.toHaveBeenCalled();
    });
  });
});
