import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';

// Dashboards
import { AdminDashboard } from '@/features/dashboard/admin/AdminDashboard';
import { StudentDashboard } from '@/features/dashboard/student/StudentDashboard';
import { WardenDashboard } from '@/features/dashboard/warden/WardenDashboard';
import { AccountantDashboard } from '@/features/dashboard/accountant/AccountantDashboard';
import { SecurityDashboard } from '@/features/dashboard/security/SecurityDashboard';

// Features
import { HostelListPage } from '@/features/hostel/pages/HostelListPage';
import { DemoModulePage, type DemoModuleConfig } from '@/components/shared/DemoModulePage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
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
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'hostels', element: <HostelListPage /> },
      { path: 'rooms', element: <PlaceholderPage title="Room Management" /> },
      { path: 'students', element: <PlaceholderPage title="Student Management" /> },
      { path: 'allocations', element: <PlaceholderPage title="Room Allocations" /> },
      { path: 'fees', element: <PlaceholderPage title="Fee Management" /> },
      { path: 'leaves', element: <PlaceholderPage title="Leave Requests" /> },
      { path: 'complaints', element: <PlaceholderPage title="Complaints" /> },
      { path: 'visitors', element: <PlaceholderPage title="Visitor Management" /> },
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
      { path: 'profile', element: <PlaceholderPage title="My Profile" /> },
      { path: 'rooms', element: <PlaceholderPage title="Browse Rooms" /> },
      { path: 'fees', element: <PlaceholderPage title="My Fees" /> },
      { path: 'leaves', element: <PlaceholderPage title="Leave Management" /> },
      { path: 'complaints', element: <PlaceholderPage title="My Complaints" /> },
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
      { path: 'students', element: <PlaceholderPage title="Students" /> },
      { path: 'leaves', element: <PlaceholderPage title="Leave Approvals" /> },
      { path: 'complaints', element: <PlaceholderPage title="Complaints" /> },
      { path: 'verify', element: <PlaceholderPage title="QR Verification" /> },
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
      { path: 'fees', element: <PlaceholderPage title="Fee Collection" /> },
      { path: 'receipts', element: <PlaceholderPage title="Receipts" /> },
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
      { path: 'verify', element: <PlaceholderPage title="QR Scanner" /> },
      { path: 'leaves', element: <PlaceholderPage title="Leave Verification" /> },
      { path: 'visitors', element: <PlaceholderPage title="Visitor Management" /> },
      { path: 'logs', element: <PlaceholderPage title="Security Logs" /> },
    ],
  },

  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

const modulePreviews: Record<string, DemoModuleConfig> = {
  'Room Management': { title: 'Room Management', description: 'Review room availability and occupancy', entityLabel: 'Room', columns: ['Room', 'Hostel', 'Capacity', 'Status'], sample: ['A-204', 'BMSCE Boys Hostel', '2 beds', 'Available'] },
  'Student Management': { title: 'Student Management', description: 'Manage hostel resident profiles', entityLabel: 'Student', columns: ['USN', 'Student', 'Programme', 'Status'], sample: ['1BM24CS001', 'Aarav Mehta', 'B.E. Computer Science', 'Active'] },
  'Room Allocations': { title: 'Room Allocations', description: 'Assign students to hostel rooms', entityLabel: 'Allocation', columns: ['Allocation', 'Student', 'Room', 'Status'], sample: ['ALC-DEMO-001', 'Aarav Mehta', 'A-204', 'Active'] },
  'Fee Management': { title: 'Fee Management', description: 'Generate and track hostel fee payments', entityLabel: 'Fee record', columns: ['Receipt', 'Student', 'Amount', 'Status'], sample: ['FEE-DEMO-001', 'Aarav Mehta', '₹ 48,000', 'Pending'] },
  'Leave Requests': { title: 'Leave Requests', description: 'Review student leave applications', entityLabel: 'Leave request', columns: ['Request', 'Student', 'Dates', 'Status'], sample: ['LEV-DEMO-001', 'Aarav Mehta', '12–15 Aug 2026', 'Pending'] },
  'Complaints': { title: 'Complaints', description: 'Track resident issues and resolutions', entityLabel: 'Complaint', columns: ['Ticket', 'Student', 'Category', 'Status'], sample: ['CMP-DEMO-001', 'Aarav Mehta', 'Maintenance', 'Open'] },
  'Visitor Management': { title: 'Visitor Management', description: 'Record visitor entries and exits', entityLabel: 'Visitor entry', columns: ['Entry', 'Visitor', 'Visiting', 'Status'], sample: ['VIS-DEMO-001', 'Meera Mehta', 'Aarav Mehta', 'Checked in'] },
  'My Profile': { title: 'My Profile', description: 'View and manage your hostel profile', entityLabel: 'Profile', columns: ['USN', 'Student', 'Programme', 'Profile status'], sample: ['1BM24CS001', 'Aarav Mehta', 'B.E. Computer Science', 'Complete'] },
  'Browse Rooms': { title: 'Browse Rooms', description: 'Find rooms that are currently available', entityLabel: 'Room option', columns: ['Room', 'Hostel', 'Beds available', 'Type'], sample: ['A-204', 'BMSCE Boys Hostel', '1 of 2', 'Double'] },
  'My Fees': { title: 'My Fees', description: 'Review your hostel fee records', entityLabel: 'Fee record', columns: ['Receipt', 'Fee type', 'Amount', 'Status'], sample: ['FEE-DEMO-001', 'Hostel fee', '₹ 48,000', 'Pending'] },
  'Leave Management': { title: 'Leave Management', description: 'Submit and track your leave requests', entityLabel: 'Leave request', columns: ['Request', 'Dates', 'Reason', 'Status'], sample: ['LEV-DEMO-001', '12–15 Aug 2026', 'Home visit', 'Pending'] },
  'My Complaints': { title: 'My Complaints', description: 'Track issues you have raised', entityLabel: 'Complaint', columns: ['Ticket', 'Category', 'Raised on', 'Status'], sample: ['CMP-DEMO-001', 'Maintenance', '05 Aug 2026', 'Open'] },
  'Students': { title: 'Students', description: 'View hostel residents under your care', entityLabel: 'Student', columns: ['USN', 'Student', 'Room', 'Status'], sample: ['1BM24CS001', 'Aarav Mehta', 'A-204', 'Active'] },
  'Leave Approvals': { title: 'Leave Approvals', description: 'Approve or reject student leave requests', entityLabel: 'Leave request', columns: ['Request', 'Student', 'Dates', 'Status'], sample: ['LEV-DEMO-001', 'Aarav Mehta', '12–15 Aug 2026', 'Pending'] },
  'QR Verification': { title: 'QR Verification', description: 'Verify a digital hostel identity', entityLabel: 'Verification', columns: ['Verification', 'Student', 'Hostel', 'Result'], sample: ['QR-DEMO-001', 'Aarav Mehta', 'BMSCE Boys Hostel', 'Verified'] },
  'Fee Collection': { title: 'Fee Collection', description: 'Track incoming hostel fee payments', entityLabel: 'Payment', columns: ['Receipt', 'Student', 'Amount', 'Status'], sample: ['FEE-DEMO-001', 'Aarav Mehta', '₹ 48,000', 'Pending'] },
  'Receipts': { title: 'Receipts', description: 'View issued hostel payment receipts', entityLabel: 'Receipt', columns: ['Receipt', 'Student', 'Amount', 'Status'], sample: ['RCP-DEMO-001', 'Aarav Mehta', '₹ 48,000', 'Issued'] },
  'QR Scanner': { title: 'QR Scanner', description: 'Scan and verify student digital IDs', entityLabel: 'Verification', columns: ['Verification', 'Student', 'Hostel', 'Result'], sample: ['QR-DEMO-001', 'Aarav Mehta', 'BMSCE Boys Hostel', 'Verified'] },
  'Leave Verification': { title: 'Leave Verification', description: 'Confirm approved leave exit and return', entityLabel: 'Leave movement', columns: ['Movement', 'Student', 'Date', 'Status'], sample: ['MOV-DEMO-001', 'Aarav Mehta', '12 Aug 2026', 'Approved'] },
  'Security Logs': { title: 'Security Logs', description: 'Review QR, leave, and visitor activity', entityLabel: 'Security log', columns: ['Log', 'Activity', 'Person', 'Status'], sample: ['LOG-DEMO-001', 'QR verification', 'Aarav Mehta', 'Verified'] },
};

function PlaceholderPage({ title }: { title: string }) {
  const config = modulePreviews[title] ?? {
    title,
    description: `Manage ${title.toLowerCase()} records`,
    entityLabel: 'Record',
    columns: ['Reference', 'Description', 'Updated', 'Status'],
    sample: ['DEMO-001', title, '05 Aug 2026', 'Active'],
  };

  return <DemoModulePage config={config} />;
}
