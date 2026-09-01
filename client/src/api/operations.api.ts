import api from './axios';
import type { ApiResponse, Complaint, Fee, LeaveRequest, RoomAllocation, Visitor } from '@/types';

export const operationsApi = {
  overview: () => api.get<ApiResponse<{ profile: any; fees: Fee[]; leaves: LeaveRequest[]; complaints: Complaint[]; visitors: Visitor[] }>>('/me/overview'),
  allocations: () => api.get<ApiResponse<RoomAllocation[]>>('/allocations'),
  allocate: (data: { studentId: string; roomId: string; bedNumber?: number }) => api.post<ApiResponse<RoomAllocation>>('/allocations', data),
  leaves: (params?: { hostelId?: string }) => api.get<ApiResponse<LeaveRequest[]>>('/leaves', { params }),
  createLeave: (data: Record<string, unknown>) => api.post<ApiResponse<LeaveRequest>>('/leaves', data),
  decideLeave: (id: string, data: Record<string, unknown>) => api.patch<ApiResponse<LeaveRequest>>(`/leaves/${id}`, data),
  complaints: (params?: { hostelId?: string }) => api.get<ApiResponse<Complaint[]>>('/complaints', { params }),
  createComplaint: (data: FormData | Record<string, unknown>) => {
    if (data instanceof FormData) {
      return api.post<ApiResponse<Complaint>>('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    const form = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) form.append(key, String(val));
    });
    return api.post<ApiResponse<Complaint>>('/complaints', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateComplaint: (id: string, data: Record<string, unknown>) => api.patch<ApiResponse<Complaint>>(`/complaints/${id}`, data),
  visitors: (params?: { hostelId?: string; date?: string }) => api.get<ApiResponse<Visitor[]>>('/visitors', { params }),
  createVisitor: (data: Record<string, unknown>) => api.post<ApiResponse<Visitor>>('/visitors', data),
  hostelStudents: (params?: { hostelId?: string }) => api.get<ApiResponse<any[]>>('/visitors/students', { params }),
  fees: (params?: { hostelId?: string }) => api.get<ApiResponse<Fee[]>>('/fees', { params }),
  downloadReceipt: (feeId: string) => api.get(`/fees/${feeId}/receipt`, { responseType: 'blob' }),
};
