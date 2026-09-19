import api from './axios';
import type { ApiResponse, User, StudentProfile } from '@/types';

export const userApi = {
  getAll: (params?: Record<string, any>) => api.get<ApiResponse<User[]>>('/users', { params }),
  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post<ApiResponse<User>>('/users', data),
  update: (id: string, data: Partial<User>) => api.patch<ApiResponse<User>>(`/users/${id}`, data),

  getStudents: (params?: Record<string, any>) =>
    api.get<ApiResponse<StudentProfile[]>>('/students', { params }),
  getCurrentStudent: () => api.get<ApiResponse<StudentProfile>>('/students/me'),
  updateCurrentStudent: (data: Record<string, unknown>) => api.patch<ApiResponse<StudentProfile>>('/students/me', data),
  createCurrentStudentProfile: (data: Partial<StudentProfile>) => api.post<ApiResponse<StudentProfile>>('/students/me/profile', data),
  createStudentProfile: (userId: string, data: Partial<StudentProfile>) =>
    api.post<ApiResponse<StudentProfile>>(`/students/${userId}/profile`, data),
  createStudent: (data: Record<string, unknown>) => api.post<ApiResponse<StudentProfile>>('/students', data),
  bulkImportStudents: (formData: FormData) =>
    api.post<ApiResponse<{ processed: number; created: number; skipped: number; errors: string[] }>>(
      '/students/bulk-import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),

  getWardens: () => api.get<ApiResponse<Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>[]>>('/wardens'),
};

