import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { SecurityDutyRoute } from './SecurityDutyRoute';
import { PageLoadingSpinner } from '@/components/shared/PageLoadingSpinner';

// Helper for top-level Suspense boundaries
const fullScreenFallback = <PageLoadingSpinner fullScreen />;
const pageFallback = <PageLoadingSpinner />;

// ============================================
// Lazy Loaded Route Components
// ============================================

// Auth
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

// Dashboards
const AdminDashboard = lazy(() =>
  import('@/features/dashboard/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const StudentDashboard = lazy(() =>
  import('@/features/dashboard/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const WardenDashboard = lazy(() =>
  import('@/features/dashboard/warden/WardenDashboard').then((m) => ({ default: m.WardenDashboard }))
);
const AccountantDashboard = lazy(() =>
  import('@/features/dashboard/accountant/AccountantDashboard').then((m) => ({ default: m.AccountantDashboard }))
);
const SecurityDashboard = lazy(() =>
  import('@/features/dashboard/security/SecurityDashboard').then((m) => ({ default: m.SecurityDashboard || m.default }))
);

// Features
const HostelListPage = lazy(() =>
  import('@/features/hostel/pages/HostelListPage').then((m) => ({ default: m.HostelListPage }))
);
const RoomBookingPage = lazy(() =>
  import('@/features/hostel/pages/RoomBookingPage').then((m) => ({ default: m.RoomBookingPage }))
);
const LeavesPage = lazy(() =>
  import('@/features/leave/LeavesPage').then((m) => ({ default: m.LeavesPage }))
);
const ComplaintsPage = lazy(() =>
  import('@/features/complaints/ComplaintsPage').then((m) => ({ default: m.ComplaintsPage }))
);
const StudentsPage = lazy(() =>
  import('@/features/students/StudentsPage').then((m) => ({ default: m.StudentsPage }))
);
const AllocationsPage = lazy(() =>
  import('@/features/room-allocation/AllocationsPage').then((m) => ({ default: m.AllocationsPage }))
);
const FeesPage = lazy(() =>
  import('@/features/fees/FeesPage').then((m) => ({ default: m.FeesPage }))
);
const MessFeePage = lazy(() =>
  import('@/features/mess-fee/MessFeePage').then((m) => ({ default: m.MessFeePage }))
);
const StudentVerifyPage = lazy(() =>
  import('@/features/verify/StudentVerifyPage').then((m) => ({ default: m.StudentVerifyPage }))
);
const NightAttendancePage = lazy(() =>
  import('@/features/attendance/NightAttendancePage').then((m) => ({ default: m.NightAttendancePage }))
);
const AttendanceRegisterPage = lazy(() =>
  import('@/features/attendance/AttendanceRegisterPage').then((m) => ({ default: m.AttendanceRegisterPage }))
);
const StudentProfilePage = lazy(() =>
  import('@/features/profile/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage }))
);
const VisitorManagementPage = lazy(() =>
  import('@/features/visitors/VisitorManagementPage').then((m) => ({ default: m.VisitorManagementPage }))
);
const AnnouncementsPage = lazy(() =>
  import('@/features/announcements/pages/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage }))
);
const StudentAnnouncementsPage = lazy(() =>
  import('@/features/announcements/pages/StudentAnnouncementsPage').then((m) => ({ default: m.StudentAnnouncementsPage }))
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const MessEntryPage = lazy(() =>
  import('@/features/mess-entry/MessEntryPage').then((m) => ({ default: m.MessEntryPage || m.default }))
);
const MessHistoryPage = lazy(() =>
  import('@/features/mess-entry/MessHistoryPage').then((m) => ({ default: m.MessHistoryPage || m.default }))
);

// ============================================
// Router Configuration
// ============================================

export const router = createBrowserRouter([
  // Public & Auth Routes
  {
    path: '/login',
    element: (
      <Suspense fallback={fullScreenFallback}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={fullScreenFallback}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={fullScreenFallback}>
        <RegisterPage />
      </Suspense>
    ),
  },

  // Admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={pageFallback}><AdminDashboard /></Suspense> },
      { path: 'hostels', element: <Suspense fallback={pageFallback}><HostelListPage /></Suspense> },
      { path: 'rooms', element: <Suspense fallback={pageFallback}><RoomBookingPage /></Suspense> },
      { path: 'students', element: <Suspense fallback={pageFallback}><StudentsPage /></Suspense> },
      { path: 'allocations', element: <Suspense fallback={pageFallback}><AllocationsPage /></Suspense> },
      { path: 'fees', element: <Suspense fallback={pageFallback}><FeesPage /></Suspense> },
      { path: 'mess-fee-settings', element: <Suspense fallback={pageFallback}><MessFeePage /></Suspense> },
      { path: 'leaves', element: <Suspense fallback={pageFallback}><LeavesPage /></Suspense> },
      { path: 'complaints', element: <Suspense fallback={pageFallback}><ComplaintsPage /></Suspense> },
      { path: 'announcements', element: <Suspense fallback={pageFallback}><AnnouncementsPage /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={pageFallback}><NotificationsPage /></Suspense> },
      { path: 'visitors', element: <Suspense fallback={pageFallback}><VisitorManagementPage /></Suspense> },
      { path: 'attendance', element: <Suspense fallback={pageFallback}><AttendanceRegisterPage /></Suspense> },
    ],
  },

  // Student routes
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={pageFallback}><StudentDashboard /></Suspense> },
      { path: 'profile', element: <Suspense fallback={pageFallback}><StudentProfilePage /></Suspense> },
      { path: 'rooms', element: <Suspense fallback={pageFallback}><RoomBookingPage /></Suspense> },
      { path: 'fees', element: <Suspense fallback={pageFallback}><FeesPage /></Suspense> },
      { path: 'mess-fees', element: <Suspense fallback={pageFallback}><MessFeePage /></Suspense> },
      { path: 'announcements', element: <Suspense fallback={pageFallback}><StudentAnnouncementsPage /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={pageFallback}><NotificationsPage /></Suspense> },
      { path: 'leaves', element: <Suspense fallback={pageFallback}><LeavesPage /></Suspense> },
      { path: 'complaints', element: <Suspense fallback={pageFallback}><ComplaintsPage /></Suspense> },
    ],
  },

  // Warden routes
  {
    path: '/warden',
    element: (
      <ProtectedRoute allowedRoles={['WARDEN']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={pageFallback}><WardenDashboard /></Suspense> },
      { path: 'students', element: <Suspense fallback={pageFallback}><StudentsPage /></Suspense> },
      { path: 'leaves', element: <Suspense fallback={pageFallback}><LeavesPage /></Suspense> },
      { path: 'complaints', element: <Suspense fallback={pageFallback}><ComplaintsPage /></Suspense> },
      { path: 'announcements', element: <Suspense fallback={pageFallback}><AnnouncementsPage /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={pageFallback}><NotificationsPage /></Suspense> },
      { path: 'visitors', element: <Suspense fallback={pageFallback}><VisitorManagementPage /></Suspense> },
      { path: 'attendance', element: <Suspense fallback={pageFallback}><AttendanceRegisterPage /></Suspense> },
    ],
  },

  // Accountant routes
  {
    path: '/accountant',
    element: (
      <ProtectedRoute allowedRoles={['ACCOUNTANT']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={pageFallback}><AccountantDashboard /></Suspense> },
      { path: 'fees', element: <Suspense fallback={pageFallback}><FeesPage /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={pageFallback}><NotificationsPage /></Suspense> },
    ],
  },

  // Security routes
  {
    path: '/security',
    element: (
      <ProtectedRoute allowedRoles={['SECURITY']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Suspense fallback={pageFallback}><SecurityDashboard /></Suspense> },
      {
        path: 'visitors',
        element: (
          <SecurityDutyRoute allowedDuty="HOSTEL">
            <Suspense fallback={pageFallback}>
              <VisitorManagementPage />
            </Suspense>
          </SecurityDutyRoute>
        ),
      },
      {
        path: 'attendance',
        element: (
          <SecurityDutyRoute allowedDuty="HOSTEL">
            <Suspense fallback={pageFallback}>
              <NightAttendancePage />
            </Suspense>
          </SecurityDutyRoute>
        ),
      },
      {
        path: 'attendance-log',
        element: (
          <SecurityDutyRoute allowedDuty="HOSTEL">
            <Suspense fallback={pageFallback}>
              <AttendanceRegisterPage />
            </Suspense>
          </SecurityDutyRoute>
        ),
      },
      {
        path: 'mess-entry',
        element: (
          <SecurityDutyRoute allowedDuty="MESS">
            <Suspense fallback={pageFallback}>
              <MessEntryPage />
            </Suspense>
          </SecurityDutyRoute>
        ),
      },
      {
        path: 'mess-history',
        element: (
          <SecurityDutyRoute allowedDuty="MESS">
            <Suspense fallback={pageFallback}>
              <MessHistoryPage />
            </Suspense>
          </SecurityDutyRoute>
        ),
      },
      { path: 'notifications', element: <Suspense fallback={pageFallback}><NotificationsPage /></Suspense> },
    ],
  },

  // Public verification (QR scan — no auth required)
  {
    path: '/verify/student/:token',
    element: (
      <Suspense fallback={fullScreenFallback}>
        <StudentVerifyPage />
      </Suspense>
    ),
  },

  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
