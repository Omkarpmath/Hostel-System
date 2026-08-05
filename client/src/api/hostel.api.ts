import api from './axios';
import type { ApiResponse, Hostel, Block, Floor, Room, DashboardStats } from '@/types';

export const hostelApi = {
  // Hostels
  create: (data: Partial<Hostel>) => api.post<ApiResponse<Hostel>>('/hostels', data),
  getAll: (params?: Record<string, string>) => api.get<ApiResponse<Hostel[]>>('/hostels', { params }),
  getById: (id: string) => api.get<ApiResponse<Hostel>>(`/hostels/${id}`),
  update: (id: string, data: Partial<Hostel>) => api.patch<ApiResponse<Hostel>>(`/hostels/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/hostels/${id}`),

  // Blocks
  createBlock: (hostelId: string, data: Partial<Block>) =>
    api.post<ApiResponse<Block>>(`/hostels/${hostelId}/blocks`, data),
  getBlocks: (hostelId: string) => api.get<ApiResponse<Block[]>>(`/hostels/${hostelId}/blocks`),

  // Floors
  createFloor: (blockId: string, data: Partial<Floor>) =>
    api.post<ApiResponse<Floor>>(`/blocks/${blockId}/floors`, data),
  getFloors: (blockId: string) => api.get<ApiResponse<Floor[]>>(`/blocks/${blockId}/floors`),

  // Rooms
  createRoom: (floorId: string, data: Partial<Room>) =>
    api.post<ApiResponse<Room>>(`/floors/${floorId}/rooms`, data),
  getRooms: (params?: Record<string, string>) => api.get<ApiResponse<Room[]>>('/rooms', { params }),
  getAvailableRooms: (hostelId?: string) =>
    api.get<ApiResponse<Room[]>>('/rooms/available', { params: { hostelId } }),
  getRoomById: (id: string) => api.get<ApiResponse<Room>>(`/rooms/${id}`),
  updateRoom: (id: string, data: Partial<Room>) => api.patch<ApiResponse<Room>>(`/rooms/${id}`, data),

  // Dashboard
  getDashboardStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};
