import { NotificationType } from "@prisma/client";
export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedId?: string | null;
    relatedType?: string | null;
}
export declare class NotificationService {
    /**
     * Safely create a single in-app notification.
     * If creation fails, logs error without throwing to protect the caller's transaction/operation.
     */
    createNotification(params: CreateNotificationParams): Promise<boolean>;
    /**
     * Safely batch create notifications (e.g. for announcements).
     */
    createNotificationsMany(notifications: CreateNotificationParams[]): Promise<number>;
    /**
     * List notifications for the authenticated user with pagination and filters.
     */
    listNotifications(userId: string, query: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
        type?: NotificationType;
    }): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.NotificationType;
            title: string;
            message: string;
            userId: string;
            isRead: boolean;
            relatedId: string | null;
            relatedType: string | null;
        }[];
        meta: {
            total: number;
            unreadCount: number;
            page: number;
            limit: number;
            totalPages: number;
            hasMore: boolean;
        };
    }>;
    /**
     * Get unread notification count for the authenticated user.
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark a single notification as read (strictly ensuring ownership).
     */
    markAsRead(userId: string, notificationId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        message: string;
        userId: string;
        isRead: boolean;
        relatedId: string | null;
        relatedType: string | null;
    } | {
        id: string;
        isRead: boolean;
    }>;
    /**
     * Mark all unread notifications for the authenticated user as read.
     */
    markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    /**
     * Delete a single notification (strictly ensuring ownership).
     */
    deleteNotification(userId: string, notificationId: string): Promise<{
        success: boolean;
    }>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map