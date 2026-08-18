import api from './axios';
import type { ApiResponse, RoomAllocation } from '@/types';

export const bookingApi = {
  active: () => api.get<ApiResponse<any>>('/booking/my-reservation'),
  reserve: (roomId: string) => api.post<ApiResponse<any>>('/booking/reserve', { roomId }),
  createOrder: (reservationId: string) => api.post<ApiResponse<{ reservationId: string; orderId: string; amount: number; currency: string; keyId: string; reused?: boolean }>>('/booking/create-order', { reservationId }),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => api.post<ApiResponse<RoomAllocation>>('/booking/verify-payment', data),
  cancel: (reservationId: string) => api.post<ApiResponse>('/booking/cancel-reservation', { reservationId }),
};
