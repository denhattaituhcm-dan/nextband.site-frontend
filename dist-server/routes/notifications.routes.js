import { NotificationService } from '../services/notification.service.js';
const notificationsRoutes = async (fastify) => {
    const notificationService = new NotificationService(fastify.prisma);
    // GET /notifications — Danh sách notifications của user đang đăng nhập (N3-C: Backend enforces ownership)
    fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { page, limit } = (request.query || {});
        const result = await notificationService.listNotifications({
            userId: user.id,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        const unreadCount = await notificationService.getUnreadCount(user.id);
        return reply.send({
            success: true,
            data: result.items,
            unreadCount,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
            },
        });
    });
    // GET /notifications/unread-count — Đếm số lượng chưa đọc
    fastify.get('/unread-count', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const count = await notificationService.getUnreadCount(user.id);
        return reply.send({ success: true, count });
    });
    // PATCH /notifications/:id/read — Đánh dấu đã đọc (N3-C: Object-level authorization)
    fastify.patch('/:id/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const updated = await notificationService.markAsRead(request.params.id, user.id);
        if (!updated) {
            return reply.status(404).send({ success: false, error: 'Notification not found.' });
        }
        return reply.send({ success: true });
    });
    // PATCH /notifications/read-all — Đánh dấu tất cả thông báo của user hiện tại là đã đọc
    fastify.patch('/read-all', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const user = request.user;
        const markedCount = await notificationService.markAllAsRead(user.id);
        return reply.send({ success: true, markedCount });
    });
};
export default notificationsRoutes;
