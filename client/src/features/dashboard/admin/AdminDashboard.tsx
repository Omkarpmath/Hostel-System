import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { hostelApi } from '@/api/hostel.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Building2,
  BedDouble,
  CreditCard,
  ClipboardList,
  MessageSquareWarning,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import type { DashboardStats, ApiResponse } from '@/types';

const CHART_COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#0d9488', '#14b8a6'];
const PIE_COLORS = ['#16a34a', '#f59e0b', '#dc2626']; // Available=green, Partial=amber, Full=red

export function AdminDashboard() {
  const { data, isLoading } = useQuery<ApiResponse<DashboardStats>>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await hostelApi.getDashboardStats()).data,
  });

  if (isLoading) return <PageSkeleton />;

  const stats = data?.data as any;

  const occupancyData = stats
    ? [
      { name: 'Available', value: stats.availableRooms || 0 },
      { name: 'Partially Occupied', value: stats.partiallyOccupiedRooms || 0 },
      { name: 'Fully Occupied', value: stats.fullyOccupiedRooms || 0 },
    ]
    : [];

  const overviewData = stats
    ? [
      { name: 'Students', value: stats.totalStudents },
      { name: 'Hostels', value: stats.totalHostels },
      { name: 'Rooms', value: stats.totalRooms },
      { name: 'Pending Fees', value: stats.pendingFees },
      { name: 'Leaves', value: stats.pendingLeaves },
      { name: 'Complaints', value: stats.openComplaints },
    ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your hostel management system"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={Users}
          color="blue"
          delay={0}
        />
        <StatCard
          title="Total Hostels"
          value={stats?.totalHostels || 0}
          icon={Building2}
          color="teal"
          delay={1}
        />
        <StatCard
          title="Occupied Beds"
          value={`${stats?.occupiedBeds || 0} / ${stats?.totalBeds || 0}`}
          icon={BedDouble}
          color="amber"
          delay={2}
        />
        <StatCard
          title="Available Rooms"
          value={stats?.availableRooms || 0}
          icon={BedDouble}
          color="green"
          delay={3}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Fees"
          value={stats?.pendingFees || 0}
          icon={CreditCard}
          color="red"
          delay={4}
        />
        <StatCard
          title="Leave Requests"
          value={stats?.pendingLeaves || 0}
          icon={ClipboardList}
          color="purple"
          delay={5}
        />
        <StatCard
          title="Open Complaints"
          value={stats?.openComplaints || 0}
          icon={MessageSquareWarning}
          color="amber"
          delay={6}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats?.occupancyRate || 0}%`}
          icon={BarChart3}
          color="teal"
          delay={7}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            System Overview
          </h3>
          {overviewData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data to display yet</p>
            </div>
          )}
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
            Room Occupancy
          </h3>
          {occupancyData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {occupancyData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No rooms created yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Allocations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Allocations
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Latest room allocations in the system
          </p>
        </div>
        {stats?.recentAllocations && stats.recentAllocations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                {stats.recentAllocations.map((alloc: any) => (
                  <tr key={alloc.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                      {alloc.student?.user?.firstName} {alloc.student?.user?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {alloc.room?.roomNumber}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {alloc.room?.floor?.block?.hostel?.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={alloc.status} />
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(alloc.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={LayoutDashboard}
            title="No allocations yet"
            description="Room allocations will appear here once students are assigned rooms."
          />
        )}
      </motion.div>
    </div>
  );
}
