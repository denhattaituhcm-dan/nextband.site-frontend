import { PrismaClient, Prisma, NotificationType, Notification } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Tạo 1 notification trong transaction hoặc direct client context.
   * Nếu vi phạm unique constraint (P2002) do retry cùng business event -> skip an toàn (Idempotency).
   */
  async createNotification(
    tx: Prisma.TransactionClient | PrismaClient,
    data: CreateNotificationDTO
  ): Promise<void> {
    try {
      await tx.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          entityType: data.entityType || null,
          entityId: data.entityId || null,
        },
      });
    } catch (err: unknown) {
      // Prisma P2002: Unique constraint failed -> Idempotent skip
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return;
      }
      throw err;
    }
  }

  /**
   * Tạo batch notifications cho nhiều người nhận bằng 1 single query (createMany).
   * Dùng skipDuplicates: true để bỏ qua các bản ghi trùng lặp.
   */
  async createBatchNotifications(
    tx: Prisma.TransactionClient | PrismaClient,
    items: CreateNotificationDTO[]
  ): Promise<void> {
    if (items.length === 0) return;

    await tx.notification.createMany({
      data: items.map((item) => ({
        userId: item.userId,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link || null,
        entityType: item.entityType || null,
        entityId: item.entityId || null,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Lấy danh sách notifications của một user cụ thể (có phân trang).
   * Backend xác định ownership, không cho phép query user khác.
   */
  async listNotifications(params: {
    userId: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: params.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId: params.userId },
      }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * Đếm số lượng thông báo chưa đọc của user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc.
   * Áp dụng Object-level authorization: chỉ cập nhật nếu bản ghi thuộc đúng userId.
   */
  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count > 0;
  }

  /**
   * Đánh dấu tất cả thông báo chưa đọc của user là đã đọc.
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }
}
