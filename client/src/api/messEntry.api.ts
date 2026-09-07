import api from './axios';

export interface MessVerificationResponse {
  status: 'ENTRY_ALLOWED' | 'NOT_ELIGIBLE' | 'INVALID' | 'EXPIRED' | 'ERROR';
  message: string;
  studentName?: string;
  usn?: string;
  hostelName?: string;
  roomNumber?: string;
  messName?: string;
  todayCount?: number;
  scannedAt?: string;
}

export interface MessRecentEntry {
  id: string;
  scannedAt: string;
  studentName: string;
  usn: string;
  roomNumber: string;
  hostelName: string;
}

export interface MessTodayStats {
  mess: { id: string; name: string };
  todayCount: number;
  recentEntries?: MessRecentEntry[];
}

export interface MessItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export const messEntryApi = {
  verify: (qrToken: string) =>
    api.post<{ data: MessVerificationResponse }>('/mess-entry/verify', { qrToken }),

  getStats: () =>
    api.get<{ data: MessTodayStats }>('/mess-entry/stats'),

  listMesses: () =>
    api.get<{ data: MessItem[] }>('/mess-entry/messes'),

  getEntries: (params?: { messId?: string; date?: string; limit?: number }) =>
    api.get<{ data: any[] }>('/mess-entry/entries', { params }),
};
