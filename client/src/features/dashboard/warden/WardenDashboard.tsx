import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { hostelApi } from '@/api/hostel.api';
import { userApi } from '@/api/user.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Users, ClipboardList, MessageSquareWarning,
  LayoutDashboard, BedDouble, Building2,
} from 'lucide-react';

export function WardenDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fetch dashboard stats from backend
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await hostelApi.getDashboardStats()).data,
    retry: 1,
  });

  const stats = (statsData as any)?.data || (statsData as any) || null;

  // Fetch students list
  const { data: studentsData } = useQuery({
    queryKey: ['students-list'],
    queryFn: () => userApi.getStudents(),
    retry: 1,
  });

  const students: any[] = (() => {
    const d = (studentsData?.data as any)?.data;
    if (Array.isArray(d)) return d;
    if (d?.students && Array.isArray(d.students)) return d.students;
    return [];
  })();

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  if (isStatsLoading) return <PageSkeleton />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Warden Dashboard"
        description="Manage students, room allocations, leave requests, and complaints"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves ?? 0}
          icon={ClipboardList}
          color="amber"
          delay={1}
        />
        <StatCard
          title="Open Complaints"
          value={stats?.openComplaints ?? 0}
          icon={MessageSquareWarning}
          color="red"
          delay={2}
        />
        <StatCard
          title="Total Rooms"
          value={stats?.totalRooms ?? 0}
          icon={BedDouble}
          color="teal"
          delay={3}
        />
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <StatCard
          title="Available Rooms"
          value={stats?.availableRooms ?? 0}
          icon={BedDouble}
          color="green"
          delay={4}
        />
        <StatCard
          title="Total Hostels"
          value={stats?.totalHostels ?? 0}
          icon={Building2}
          color="purple"
          delay={5}
        />
        <StatCard
          title="Occupancy Rate"
          value={stats ? `${stats.occupancyRate}%` : '0%'}
          icon={BedDouble}
          color="blue"
          delay={6}
        />
        <StatCard
          title="Pending Fees"
          value={stats?.pendingFees ?? 0}
          icon={LayoutDashboard}
          color="amber"
          delay={7}
        />
      </div>

      {/* Recent Allocations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={cardStyle}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Allocations
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Latest room allocations in the hostel
          </p>
        </div>
        {stats?.recentAllocations && stats.recentAllocations.length > 0 ? (
          <div style={{ padding: 0 }}>
            {stats.recentAllocations.map((alloc: any, i: number) => (
              <div key={alloc.id || i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: i < stats.recentAllocations.length - 1 ? '1px solid var(--border-primary)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e40af, #0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.6875rem', fontWeight: 800,
                  }}>
                    {(alloc.student?.user?.firstName?.[0] || '?')}{(alloc.student?.user?.lastName?.[0] || '')}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {alloc.student?.user?.firstName || 'Unknown'} {alloc.student?.user?.lastName || ''}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Room {alloc.room?.roomNumber || 'N/A'} · {alloc.room?.floor?.block?.hostel?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={alloc.status || 'ACTIVE'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={LayoutDashboard}
            title="No allocations yet"
            description="Room allocations will appear here once students are assigned rooms."
          />
        )}
      </motion.div>

      {/* Students under warden */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={cardStyle}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Registered Students
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {students.length} student profile{students.length !== 1 ? 's' : ''} in the system
          </p>
        </div>
        {students.length > 0 ? (
          <div style={{ padding: 0 }}>
            {students.slice(0, 10).map((s: any, i: number) => (
              <div key={s.id || i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderBottom: i < Math.min(students.length, 10) - 1 ? '1px solid var(--border-primary)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                    backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDark ? '#60a5fa' : '#2563eb', fontSize: '0.6875rem', fontWeight: 800,
                  }}>
                    {(s.user?.firstName?.[0] || '?')}{(s.user?.lastName?.[0] || '')}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.user?.firstName || 'Unknown'} {s.user?.lastName || ''}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      USN: {s.usn || 'N/A'} · {s.department || 'N/A'} · Year {s.year || 'N/A'}
                    </p>
                  </div>
                </div>
                <StatusBadge status={s.user?.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Student profiles will appear here once students register and complete their profiles."
          />
        )}
      </motion.div>
    </div>
  );
}
