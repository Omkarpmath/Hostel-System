import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { hostelApi } from '@/api/hostel.api';
import { announcementApi } from '@/api/announcement.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Building2,
  BedDouble,
  CreditCard,
  ClipboardList,
  MessageSquareWarning,
  Megaphone,
  Plus,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import type { DashboardStats, ApiResponse, Announcement } from '@/types';

export function AdminDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fetch Dashboard Stats
  const { data, isLoading } = useQuery<ApiResponse<DashboardStats>>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await hostelApi.getDashboardStats()).data,
  });

  // Fetch Recent Announcements
  const { data: announcementsData } = useQuery({
    queryKey: ['admin-dashboard-announcements'],
    queryFn: () => announcementApi.getAll({ status: 'PUBLISHED' }),
  });
  const recentAnnouncements: Announcement[] = ((announcementsData?.data as any)?.data || []).slice(0, 3);

  if (isLoading) return <PageSkeleton />;

  const stats = data?.data as any;

  const occupancyData = stats
    ? [
        { name: 'Available', value: stats.availableRooms || 0, color: '#10b981' },
        { name: 'Partially Occupied', value: stats.partiallyOccupiedRooms || 0, color: '#f59e0b' },
        { name: 'Fully Occupied', value: stats.fullyOccupiedRooms || 0, color: '#ef4444' },
      ]
    : [];

  const totalActionItems = (stats?.pendingLeaves || 0) + (stats?.openComplaints || 0) + (stats?.pendingFees || 0);

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ─── 1. Welcome & Quick Action Header ─── */}
      <div style={{
        ...cardStyle,
        padding: '1.75rem 2rem',
        background: isDark
          ? 'linear-gradient(135deg, rgba(30,58,138,0.25) 0%, rgba(15,23,42,0.6) 100%)'
          : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7',
              color: isDark ? '#4ade80' : '#16a34a',
            }}>
              <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '9999px', backgroundColor: '#16a34a' }} />
              Campus Active • 2026 Term
            </span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.firstName || 'Admin'} 👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Live overview of campus occupancy, student operations, and maintenance queue.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/announcements"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.125rem',
              borderRadius: '0.625rem',
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              transition: 'all 0.15s',
            }}
          >
            <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
            <span>New Announcement</span>
          </Link>

          <Link
            to="/admin/leaves"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.125rem',
              borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'white',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <ClipboardList style={{ width: '0.875rem', height: '0.875rem', color: '#f59e0b' }} />
            <span>Review Leaves</span>
            {(stats?.pendingLeaves || 0) > 0 && (
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                backgroundColor: '#f59e0b',
                color: 'white',
              }}>
                {stats.pendingLeaves}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ─── 2. Master KPI Stats Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Total Residents */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ ...cardStyle, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Residents</span>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              color: isDark ? '#60a5fa' : '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats?.totalStudents || 0}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Active registered student profiles
          </p>
          <Link
            to="/admin/students"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb',
              marginTop: '0.75rem', textDecoration: 'none',
            }}
          >
            View student directory <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
          </Link>
        </motion.div>

        {/* Campus Occupancy */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ ...cardStyle, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Campus Bed Occupancy</span>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : '#f0fdfa',
              color: isDark ? '#2dd4bf' : '#0d9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BedDouble style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stats?.occupancyRate || 0}%
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              ({stats?.occupiedBeds || 0} / {stats?.totalBeds || 0} beds)
            </span>
          </div>
          {/* Progress Bar */}
          <div style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, stats?.occupancyRate || 0)}%`,
              height: '100%',
              backgroundColor: (stats?.occupancyRate || 0) > 85 ? '#ef4444' : (stats?.occupancyRate || 0) > 60 ? '#10b981' : '#3b82f6',
              borderRadius: '9999px',
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {stats?.availableRooms || 0} rooms currently available
          </p>
        </motion.div>

        {/* Action Items Queue */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ ...cardStyle, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Action Queue</span>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
              color: isDark ? '#fbbf24' : '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: totalActionItems > 0 ? '#d97706' : '#16a34a', lineHeight: 1 }}>
            {totalActionItems}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {stats?.pendingLeaves || 0} leaves · {stats?.openComplaints || 0} complaints · {stats?.pendingFees || 0} unpaid fees
          </p>
          <Link
            to="/admin/leaves"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#d97706',
              marginTop: '0.75rem', textDecoration: 'none',
            }}
          >
            Review pending queue <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
          </Link>
        </motion.div>

        {/* Hostels & Blocks */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ ...cardStyle, padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Hostels</span>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : '#faf5ff',
              color: isDark ? '#c084fc' : '#9333ea',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {stats?.totalHostels || 0}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {stats?.totalRooms || 0} total rooms across all blocks
          </p>
          <Link
            to="/admin/hostels"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
              fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#c084fc' : '#9333ea',
              marginTop: '0.75rem', textDecoration: 'none',
            }}
          >
            Manage hostel blocks <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
          </Link>
        </motion.div>
      </div>

      {/* ─── 3. Visual Analytics & Operational Workflow Queue Row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Room Occupancy Donut Chart (Fixed & Modernized) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ ...cardStyle, padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Room Occupancy Distribution
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {stats?.totalRooms || 0} Total Rooms
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Current allocation distribution across all campus rooms
            </p>
          </div>

          {/* Donut Chart Container */}
          {occupancyData.some((d) => d.value > 0) ? (
            <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} Rooms`, name]}
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '0.8125rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Metric Label */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', lineHeight: 1 }}>
                  {stats?.occupancyRate || 0}%
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Occupied
                </span>
              </div>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No room data available.
            </div>
          )}

          {/* Clean Custom Badges Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#10b981' }} />
                <span>Available</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#10b981', marginTop: '0.125rem', display: 'block' }}>
                {stats?.availableRooms || 0}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#f59e0b' }} />
                <span>Partial</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.125rem', display: 'block' }}>
                {stats?.partiallyOccupiedRooms || 0}
              </span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#ef4444' }} />
                <span>Full</span>
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ef4444', marginTop: '0.125rem', display: 'block' }}>
                {stats?.fullyOccupiedRooms || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Operational Workflow Status & Action Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ ...cardStyle, padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Operations & Workflows
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Live Action Items
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Pending items that require administrative review or action
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Row 1: Leave Requests */}
            <Link
              to="/admin/leaves"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: '1px solid var(--border-primary)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                  backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
                  color: isDark ? '#fbbf24' : '#d97706',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ClipboardList style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Leave Requests</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student leave applications</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                  backgroundColor: (stats?.pendingLeaves || 0) > 0 ? (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7'),
                  color: (stats?.pendingLeaves || 0) > 0 ? '#d97706' : '#16a34a',
                }}>
                  {(stats?.pendingLeaves || 0) > 0 ? `${stats.pendingLeaves} Pending` : 'All Clear'}
                </span>
                <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
              </div>
            </Link>

            {/* Row 2: Maintenance Complaints */}
            <Link
              to="/admin/complaints"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: '1px solid var(--border-primary)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                  backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                  color: isDark ? '#f87171' : '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquareWarning style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Complaints & Maintenance</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hostel facility issue reports</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                  backgroundColor: (stats?.openComplaints || 0) > 0 ? (isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2') : (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7'),
                  color: (stats?.openComplaints || 0) > 0 ? '#dc2626' : '#16a34a',
                }}>
                  {(stats?.openComplaints || 0) > 0 ? `${stats.openComplaints} Open` : 'Resolved'}
                </span>
                <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
              </div>
            </Link>

            {/* Row 3: Fee Records */}
            <Link
              to="/admin/fees"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: '1px solid var(--border-primary)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                  backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                  color: isDark ? '#60a5fa' : '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CreditCard style={{ width: '1.125rem', height: '1.125rem' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hostel & Mess Fees</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payment dues and receipts</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.625rem', borderRadius: '9999px',
                  backgroundColor: (stats?.pendingFees || 0) > 0 ? (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7'),
                  color: (stats?.pendingFees || 0) > 0 ? '#d97706' : '#16a34a',
                }}>
                  {(stats?.pendingFees || 0) > 0 ? `${stats.pendingFees} Pending` : 'Paid'}
                </span>
                <ArrowRight style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
              </div>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ─── 4. Live Activity Section (Recent Allocations & Announcements) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Allocations Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ ...cardStyle, overflow: 'hidden' }}
        >
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Allocations
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Latest resident room assignments
              </p>
            </div>
            <Link
              to="/admin/allocations"
              style={{
                fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}
            >
              View All <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
            </Link>
          </div>

          {stats?.recentAllocations && stats.recentAllocations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stats.recentAllocations.map((alloc: any, idx: number) => {
                const residentName = `${alloc.student?.user?.firstName || ''} ${alloc.student?.user?.lastName || ''}`.trim() || 'Student';
                const initials = residentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                const roomNumber = alloc.room?.roomNumber || '—';
                const hostelName = alloc.room?.floor?.block?.hostel?.name || 'Hostel';

                return (
                  <div
                    key={alloc.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1.5rem',
                      borderBottom: idx !== stats.recentAllocations.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      backgroundColor: isDark ? (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)') : (idx % 2 === 0 ? 'white' : '#fafafa'),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2rem', height: '2rem', borderRadius: '0.5rem',
                        backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        fontSize: '0.75rem', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {initials}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {residentName}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {hostelName}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700,
                        padding: '0.15rem 0.5rem', borderRadius: '0.375rem',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                      }}>
                        Room {roomNumber}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {formatDate(alloc.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No room allocations made yet.
            </div>
          )}
        </motion.div>

        {/* Live Announcements Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ ...cardStyle, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Campus Broadcasts
                  </h3>
                </div>
              </div>
              <Link
                to="/admin/announcements"
                style={{
                  fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}
              >
                Manage All <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
              </Link>
            </div>

            {recentAnnouncements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem 1rem', gap: '0.5rem' }}>
                {recentAnnouncements.map((a) => {
                  const isUrgent = a.priority === 'URGENT';
                  const isImportant = a.priority === 'IMPORTANT';

                  return (
                    <Link
                      key={a.id}
                      to="/admin/announcements"
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                        border: '1px solid var(--border-primary)',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                        display: 'block',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 800, padding: '0.1rem 0.375rem', borderRadius: '0.25rem',
                          backgroundColor: isUrgent ? (isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2') : isImportant ? (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : (isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe'),
                          color: isUrgent ? '#dc2626' : isImportant ? '#d97706' : '#2563eb',
                          textTransform: 'uppercase',
                        }}>
                          {a.priority}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {a.publishAt ? new Date(a.publishAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
                        {a.title}
                      </h4>
                      <p style={{
                        fontSize: '0.75rem', color: 'var(--text-secondary)',
                        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {a.message}
                      </p>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No active announcements published yet.
              </div>
            )}
          </div>

          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-primary)', backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#f8fafc' }}>
            <Link
              to="/admin/announcements"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                width: '100%', padding: '0.5rem', borderRadius: '0.5rem',
                backgroundColor: 'transparent', border: '1px dashed var(--border-primary)',
                color: isDark ? '#93c5fd' : '#2563eb', fontSize: '0.75rem', fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Plus style={{ width: '0.875rem', height: '0.875rem' }} /> Create New Notice
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
