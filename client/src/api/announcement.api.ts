import api from './axios';
import type { ApiResponse, Announcement, AnnouncementStats } from '@/types';

export const announcementApi = {
  /**
   * Fetch announcements for Admin/Warden with filters
   */
  getAll: (params?: {
    status?: string;
    priority?: string;
    hostelId?: string;
    search?: string;
  }) => api.get<ApiResponse<Announcement[]>>('/announcements', { params }),

  /**
   * Fetch student's eligible announcements
   */
  getMy: (params?: { unreadOnly?: boolean; priority?: string }) =>
    api.get<ApiResponse<Announcement[]>>('/announcements/my', { params }),

  /**
   * Fetch aggregate stats
   */
  getStats: () => api.get<ApiResponse<AnnouncementStats>>('/announcements/stats'),

  /**
   * Fetch single announcement by ID
   */
  getById: (id: string) => api.get<ApiResponse<Announcement>>(`/announcements/${id}`),

  /**
   * Create new announcement
   */
  create: (data: Partial<Announcement>) =>
    api.post<ApiResponse<Announcement>>('/announcements', data),

  /**
   * Update announcement
   */
  update: (id: string, data: Partial<Announcement>) =>
    api.patch<ApiResponse<Announcement>>(`/announcements/${id}`, data),

  /**
   * Delete announcement
   */
  delete: (id: string) => api.delete<ApiResponse<null>>(`/announcements/${id}`),

  /**
   * Mark single announcement as read (Student)
   */
  markRead: (id: string) =>
    api.post<ApiResponse<{ success: boolean }>>(`/announcements/${id}/read`),

  /**
   * Mark all eligible active announcements as read (Student)
   */
  markAllRead: () =>
    api.post<ApiResponse<{ count: number }>>('/announcements/read-all'),
};
