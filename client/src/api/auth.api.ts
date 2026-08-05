import api from './axios';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data),

  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) =>
    api.post<ApiResponse<User>>('/auth/register', data),

  refresh: () =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  logout: () =>
    api.post<ApiResponse>('/auth/logout'),

  resetPassword: (data: { email: string; newPassword: string }) =>
    api.post<ApiResponse>('/auth/reset-password', data),

  getProfile: () =>
    api.get<ApiResponse<User>>('/auth/profile'),
};
