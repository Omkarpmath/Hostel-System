import api from './axios';
import type { ApiResponse } from '@/types';

export const messFeeApi = {
  getAmount: () => api.get<ApiResponse<{ amount: number }>>('/mess-fee/amount'),
  updateAmount: (amount: number) => api.put<ApiResponse<{ amount: number }>>('/mess-fee/amount', { amount }),
  getMyStatus: () => api.get<ApiResponse<any>>('/mess-fee/my-status'),
  createOrder: () => api.post<ApiResponse<{ orderId: string; amount: number; currency: string; keyId: string; reused?: boolean }>>('/mess-fee/create-order'),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post<ApiResponse<any>>('/mess-fee/verify-payment', data),
};
