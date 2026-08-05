import api from './axios';
import type { ApiResponse, User, StudentProfile } from '@/types';

export const userApi = {
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<User[]>>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<User>) => api.patch<ApiResponse<User>>(`/users/${id}`, data),

  getStudents: (params?: Record<string, string>) =>
    api.get<ApiResponse<StudentProfile[]>>('/students', { params }),
  createStudentProfile: (userId: string, data: Partial<StudentProfile>) =>
    api.post<ApiResponse<StudentProfile>>(`/students/${userId}/profile`, data),

  getWardens: () => api.get<ApiResponse<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>[]>>('/wardens'),
};
