import api from './axios';
import type { ApiResponse } from '@/types';

export interface MessFeeAmounts {
  amount?: number;
  veg: number;
  nonVeg: number;
  amounts?: { veg: number; nonVeg: number };
}

export interface MessFeeStatus {
  annualAmount: number;
  amounts?: { veg: number; nonVeg: number };
  isPaid: boolean;
  paidAt: string | null;
  mealPlan?: 'VEG' | 'NON_VEG' | null;
  transactionId?: string | null;
  paymentMethod?: string | null;
  history?: any[];
}

export const messFeeApi = {
  getAmount: () => api.get<ApiResponse<MessFeeAmounts>>('/mess-fee/amount'),
  updateAmount: (params: { veg: number; nonVeg: number } | { amount: number }) =>
    api.put<ApiResponse<MessFeeAmounts>>('/mess-fee/amount', params),
  getMyStatus: () => api.get<ApiResponse<MessFeeStatus>>('/mess-fee/my-status'),
  createOrder: (mealPlan: 'VEG' | 'NON_VEG' = 'VEG') =>
    api.post<ApiResponse<{ orderId: string; amount: number; currency: string; keyId: string; reused?: boolean; mealPlan?: string }>>(
      '/mess-fee/create-order',
      { mealPlan }
    ),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post<ApiResponse<any>>('/mess-fee/verify-payment', data),
};
