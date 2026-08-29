import api from './axios';
import type { ApiResponse, Complaint, Fee, LeaveRequest, RoomAllocation, Visitor } from '@/types';

export const operationsApi = {
  overview: () => api.get<ApiResponse<{ profile: any; fees: Fee[]; leaves: LeaveRequest[]; complaints: Complaint[]; visitors: Visitor[] }>>('/me/overview'),
  allocations: () => api.get<ApiResponse<RoomAllocation[]>>('/allocations'),
  allocate: (data: { studentId: string; roomId: string; bedNumber?: number }) => api.post<ApiResponse<RoomAllocation>>('/allocations', data),
  leaves: () => api.get<ApiResponse<LeaveRequest[]>>('/leaves'),
  createLeave: (data: Record<string, unknown>) => api.post<ApiResponse<LeaveRequest>>('/leaves', data),
  decideLeave: (id: string, data: Record<string, unknown>) => api.patch<ApiResponse<LeaveRequest>>(`/leaves/${id}`, data),
  complaints: () => api.get<ApiResponse<Complaint[]>>('/complaints'),
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
  visitors: () => api.get<ApiResponse<Visitor[]>>('/visitors'),
  createVisitor: (data: Record<string, unknown>) => api.post<ApiResponse<Visitor>>('/visitors', data),
  fees: () => api.get<ApiResponse<Fee[]>>('/fees'),
};
