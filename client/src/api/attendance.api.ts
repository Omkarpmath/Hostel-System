import api from './axios';

export const attendanceApi = {
  // Security — session
  startSession: () => api.post('/attendance/start'),
  getActiveSession: () => api.get('/attendance/active'),
  endSession: () => api.post('/attendance/end'),
  scanStudent: (qrToken: string) => api.post('/attendance/scan', { qrToken }),

  // Register viewing
  getRegister: (hostelId: string, date?: string) =>
    api.get('/attendance/register', { params: { hostelId, date } }),
  exportCSV: (hostelId: string, date: string) =>
    api.get('/attendance/register/export', {
      params: { hostelId, date },
      responseType: 'blob',
    }),

  // Admin — security management
  listSecurityUsers: () => api.get('/attendance/security-users'),
  assignSecurity: (securityUserId: string, hostelId: string) =>
    api.post('/attendance/assign-security', { securityUserId, hostelId }),
  unassignSecurity: (securityUserId: string) =>
    api.post('/attendance/unassign-security', { securityUserId }),

  // Session history
  listSessions: (params?: { hostelId?: string; from?: string; to?: string }) =>
    api.get('/attendance/sessions', { params }),
};
