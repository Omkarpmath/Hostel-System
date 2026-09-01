import { prisma } from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
export class NotificationService {
    /**
     * Safely create a single in-app notification.
     * If creation fails, logs error without throwing to protect the caller's transaction/operation.
     */
    async createNotification(params) {
        try {
            if (!params.userId)
                return false;
            // Duplicate prevention: If an identical unread notification was created in the last 2 minutes, skip
            if (params.relatedId) {
                const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
                const existing = await prisma.notification.findFirst({
                    where: {
                        userId: params.userId,
                        type: params.type,
                        relatedId: params.relatedId,
                        isRead: false,
                        createdAt: { gte: twoMinutesAgo },
                    },
                    select: { id: true },
                });
                if (existing) {
                    return true; // Already exists, considered handled
                }
            }
            await prisma.notification.create({
                data: {
                    userId: params.userId,
                    title: params.title.trim(),
                    message: params.message.trim(),
                    type: params.type,
                    relatedId: params.relatedId || null,
                    relatedType: params.relatedType || null,
                },
            });
            return true;
        }
        catch (error) {
            console.error("[NotificationService] Failed to create notification:", error);
            return false;
        }
    }
    /**
     * Safely batch create notifications (e.g. for announcements).
     */
    async createNotificationsMany(notifications) {
        try {
            if (!notifications || notifications.length === 0)
                return 0;
            // Filter out empty userIds
            const validNotifications = notifications.filter((n) => Boolean(n.userId));
            if (validNotifications.length === 0)
                return 0;
            const result = await prisma.notification.createMany({
                data: validNotifications.map((n) => ({
                    userId: n.userId,
                    title: n.title.trim(),
                    message: n.message.trim(),
                    type: n.type,
                    relatedId: n.relatedId || null,
                    relatedType: n.relatedType || null,
                })),
                skipDuplicates: true,
            });
            return result.count;
        }
        catch (error) {
            console.error("[NotificationService] Failed to batch create notifications:", error);
            return 0;
        }
    }
    /**
     * List notifications for the authenticated user with pagination and filters.
     */
    async listNotifications(userId, query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(query.unreadOnly ? { isRead: false } : {}),
            ...(query.type ? { type: query.type } : {}),
        };
        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            notifications,
            meta: {
                total,
                unreadCount,
                page,
                limit,
                totalPages,
                hasMore: page < totalPages,
            },
        };
    }
    /**
     * Get unread notification count for the authenticated user.
     */
    async getUnreadCount(userId) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    /**
     * Mark a single notification as read (strictly ensuring ownership).
     */
    async markAsRead(userId, notificationId) {
        const notification = await prisma.notification.findFirst({
            where: { id: notificationId, userId },
            select: { id: true, isRead: true },
        });
        if (!notification) {
            throw ApiError.notFound("Notification not found");
        }
        if (notification.isRead) {
            return { id: notificationId, isRead: true };
        }
        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }
    /**
     * Mark all unread notifications for the authenticated user as read.
     */
    async markAllAsRead(userId) {
        const result = await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { count: result.count };
    }
    /**
     * Delete a single notification (strictly ensuring ownership).
     */
    async deleteNotification(userId, notificationId) {
        const notification = await prisma.notification.findFirst({
            where: { id: notificationId, userId },
            select: { id: true },
        });
        if (!notification) {
            throw ApiError.notFound("Notification not found");
        }
        await prisma.notification.delete({
            where: { id: notificationId },
        });
        return { success: true };
    }
}
export const notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map