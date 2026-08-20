import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';

// Dashboards
import { AdminDashboard } from '@/features/dashboard/admin/AdminDashboard';
import { StudentDashboard } from '@/features/dashboard/student/StudentDashboard';
import { WardenDashboard } from '@/features/dashboard/warden/WardenDashboard';
import { AccountantDashboard } from '@/features/dashboard/accountant/AccountantDashboard';
import { SecurityDashboard } from '@/features/dashboard/security/SecurityDashboard';

// Features
import { HostelListPage } from '@/features/hostel/pages/HostelListPage';
import { RoomBookingPage } from '@/features/hostel/pages/RoomBookingPage';
import { OperationsPage } from '@/features/operations/OperationsPage';
import { LeavesPage } from '@/features/leave/LeavesPage';
import { ComplaintsPage } from '@/features/complaints/ComplaintsPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { AllocationsPage } from '@/features/room-allocation/AllocationsPage';
import { FeesPage } from '@/features/fees/FeesPage';
import { MessFeePage } from '@/features/mess-fee/MessFeePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  { path: '/register', element: <RegisterPage /> },

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
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'hostels', element: <HostelListPage /> },
      { path: 'rooms', element: <RoomBookingPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'allocations', element: <AllocationsPage /> },
      { path: 'fees', element: <FeesPage /> },
      { path: 'mess-fee-settings', element: <MessFeePage /> },
      { path: 'leaves', element: <LeavesPage /> },
      { path: 'complaints', element: <ComplaintsPage /> },
      { path: 'visitors', element: <OperationsPage kind="visitors" /> },
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
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'profile', element: <OperationsPage kind="profile" /> },
      { path: 'rooms', element: <RoomBookingPage /> },
      { path: 'fees', element: <FeesPage /> },
      { path: 'mess-fees', element: <MessFeePage /> },
      { path: 'leaves', element: <LeavesPage /> },
      { path: 'complaints', element: <ComplaintsPage /> },
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
      { path: 'dashboard', element: <WardenDashboard /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'leaves', element: <LeavesPage /> },
      { path: 'complaints', element: <ComplaintsPage /> },
      { path: 'verify', element: <WardenDashboard /> },
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
      { path: 'dashboard', element: <AccountantDashboard /> },
      { path: 'fees', element: <FeesPage /> },
      { path: 'receipts', element: <FeesPage /> },
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
      { path: 'dashboard', element: <SecurityDashboard /> },
      { path: 'verify', element: <SecurityDashboard /> },
      { path: 'leaves', element: <SecurityDashboard /> },
      { path: 'visitors', element: <OperationsPage kind="visitors" /> },
      { path: 'logs', element: <SecurityDashboard /> },
    ],
  },

  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
