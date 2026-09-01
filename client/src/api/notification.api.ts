import api from './axios';
import type { ApiResponse, NotificationListResponse, NotificationType } from '@/types';

export const notificationApi = {
  /**
   * Fetch current user's notifications with pagination & filtering
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  }) => api.get<ApiResponse<NotificationListResponse>>('/notifications', { params }),

  /**
   * Fetch unread count for the notification bell badge
   */
  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  /**
   * Mark a single notification as read
   */
  markRead: (id: string) =>
    api.patch<ApiResponse<{ id: string; isRead: boolean }>>(`/notifications/${id}/read`),

  /**
   * Mark all notifications for the user as read
   */
  markAllRead: () =>
    api.patch<ApiResponse<{ count: number }>>('/notifications/read-all'),

  /**
   * Delete a notification
   */
  delete: (id: string) =>
    api.delete<ApiResponse<{ success: boolean }>>(`/notifications/${id}`),
};
