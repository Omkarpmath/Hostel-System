import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { userApi } from '@/api/user.api';
import { attendanceApi } from '@/api/attendance.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  User, Mail, Phone, Building2, BedDouble, BookOpen,
  GraduationCap, Calendar, Shield, Edit3, Save, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const statusColors = {
  PRESENT: { bg: '#16a34a', text: '#ffffff', label: 'Present' },
  ON_LEAVE: { bg: '#f59e0b', text: '#ffffff', label: 'On Leave' },
  ABSENT: { bg: '#dc2626', text: '#ffffff', label: 'Absent' },
};

export function StudentProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  // Fetch student profile
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['current-student'],
    queryFn: userApi.getCurrentStudent,
  });
  const profile: any = (profileData?.data as any)?.data;

  // Fetch attendance history
  const { data: attendanceData } = useQuery({
    queryKey: ['my-attendance', calYear, calMonth],
    queryFn: () => attendanceApi.getMyHistory(calYear, calMonth),
    enabled: !!profile,
  });
  const attendance: any = (attendanceData?.data as any)?.data;

  // Update phone
  const updateMutation = useMutation({
    mutationFn: (data: { phone: string }) => userApi.update(user!.id, data),
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['current-student'] });
      setIsEditing(false);
    },
  });

  const handleEdit = () => {
    setEditPhone(profile?.user?.phone || '');
    setIsEditing(true);
  };
  const handleSave = () => {
    updateMutation.mutate({ phone: editPhone });
  };

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const attendanceMap = new Map<number, { status: string; scannedAt: string | null }>();

    if (attendance?.days) {
      for (const d of attendance.days) {
        const day = parseInt(d.date.split('-')[2]);
        attendanceMap.set(day, d);
      }
    }

    const cells: { day: number | null; status?: string; scannedAt?: string | null }[] = [];
    // Padding for first week
    for (let i = 0; i < firstDay; i++) cells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const entry = attendanceMap.get(d);
      cells.push({ day: d, status: entry?.status, scannedAt: entry?.scannedAt });
    }
    return cells;
  }, [calYear, calMonth, attendance]);

  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  if (isLoading) return <PageSkeleton />;

  const allocation = profile?.roomAllocations?.[0];
  const hostelName = allocation?.room?.floor?.block?.hostel?.name;
  const roomNumber = allocation?.room?.roomNumber;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  const initials = `${profile?.user?.firstName?.[0] || ''}${profile?.user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="My Profile"
        description="Your personal details and attendance records"
        breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Profile' }]}
        actions={
          !isEditing ? (
            <button
              onClick={handleEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white',
                fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Edit3 style={{ width: '0.875rem', height: '0.875rem' }} />
              Edit Profile
            </button>
          ) : undefined
        }
      />

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #0d9488)',
          padding: '2rem 2rem 3rem',
          position: 'relative',
        }}>
          {/* Avatar */}
          <div style={{
            width: '5rem', height: '5rem', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: 'white',
            border: '3px solid rgba(255,255,255,0.3)',
          }}>
            {initials}
          </div>
          <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem' }}>
            {profile?.user?.firstName} {profile?.user?.lastName}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {profile?.usn} • {profile?.department}
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            { icon: User, label: 'Full Name', value: `${profile?.user?.firstName} ${profile?.user?.lastName}` },
            { icon: GraduationCap, label: 'USN', value: profile?.usn },
            { icon: Mail, label: 'Email', value: profile?.user?.email },
            { icon: Phone, label: 'Phone', value: isEditing ? undefined : (profile?.user?.phone || 'Not set'), editable: true },
            { icon: BookOpen, label: 'Department', value: profile?.department },
            { icon: Calendar, label: 'Year / Semester', value: `${profile?.year} / ${profile?.semester}` },
            { icon: Building2, label: 'Hostel', value: hostelName || 'Not allocated' },
            { icon: BedDouble, label: 'Room', value: roomNumber || '—' },
            { icon: Shield, label: 'Guardian', value: profile?.guardianName || '—' },
            { icon: Phone, label: 'Guardian Phone', value: profile?.guardianPhone || '—' },
          ].map((field, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                transition: 'background-color 0.15s',
              }}
            >
              <field.icon style={{ width: '1.125rem', height: '1.125rem', color: '#3b82f6', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </div>
                {field.editable && isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Enter phone number"
                      style={{
                        padding: '0.375rem 0.625rem', borderRadius: '0.375rem',
                        border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        outline: 'none', width: '100%',
                      }}
                    />
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Save style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <X style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {field.value}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Attendance Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Night Attendance
            </h3>
            {attendance?.hostel && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                {attendance.hostel.name}
              </p>
            )}
          </div>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}>
              <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '140px', textAlign: 'center' }}>
              {MONTHS[calMonth - 1]} {calYear}
            </span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}>
              <ChevronRight style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {attendance?.summary && attendance.summary.total > 0 && (
          <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-primary)' }}>
            {[
              { label: 'Sessions', value: attendance.summary.total, color: '#3b82f6' },
              { label: 'Present', value: attendance.summary.present, color: '#16a34a' },
              { label: 'On Leave', value: attendance.summary.onLeave, color: '#f59e0b' },
              { label: 'Absent', value: attendance.summary.absent, color: '#dc2626' },
            ].map((s) => (
              <div key={s.label} style={{
                flex: '1', minWidth: '80px', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.125rem' }}>{s.label}</div>
              </div>
            ))}
            {attendance.summary.total > 0 && (
              <div style={{
                flex: '1', minWidth: '80px', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
                  {Math.round((attendance.summary.present / attendance.summary.total) * 100)}%
                </div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.125rem' }}>Rate</div>
              </div>
            )}
          </div>
        )}

        {/* Calendar Grid */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Day headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderRadius: '0.5rem 0.5rem 0 0', overflow: 'hidden',
            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
          }}>
            {DAYS.map((d) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '0.75rem', fontWeight: 700,
                color: isDark ? '#93c5fd' : '#2563eb',
                padding: '0.625rem 0.25rem',
                letterSpacing: '0.04em',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            borderTop: 'none', borderRadius: '0 0 0.5rem 0.5rem', overflow: 'hidden',
          }}>
            {calendarDays.map((cell, idx) => {
              if (cell.day === null) {
                return (
                  <div key={`empty-${idx}`} style={{
                    height: '3.25rem',
                    borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
                  }} />
                );
              }

              const isToday = cell.day === now.getDate() && calMonth === now.getMonth() + 1 && calYear === now.getFullYear();
              const statusConfig = cell.status ? statusColors[cell.status as keyof typeof statusColors] : null;

              return (
                <div
                  key={cell.day}
                  title={cell.status ? `${statusColors[cell.status as keyof typeof statusColors]?.label}${cell.scannedAt ? ` — ${new Date(cell.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}` : undefined}
                  style={{
                    height: '3.25rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                    fontSize: '0.8125rem', fontWeight: isToday ? 800 : 600,
                    color: statusConfig ? statusConfig.text : 'var(--text-primary)',
                    backgroundColor: statusConfig
                      ? statusConfig.bg
                      : isToday
                        ? (isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)')
                        : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.005)',
                    position: 'relative',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {isToday && (
                    <div style={{
                      position: 'absolute', top: '0.1875rem', right: '0.1875rem',
                      width: '0.375rem', height: '0.375rem', borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                    }} />
                  )}
                  <span>{cell.day}</span>
                  {statusConfig && (
                    <span style={{ fontSize: '0.5625rem', fontWeight: 700, opacity: 0.9, lineHeight: 1, marginTop: '0.0625rem' }}>
                      {cell.status === 'PRESENT' ? '✓' : cell.status === 'ON_LEAVE' ? 'Leave' : '✕'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(statusColors).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '0.25rem', backgroundColor: val.bg }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{val.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Today</span>
            </div>
          </div>

          {/* No data message */}
          {(!attendance?.days || attendance.days.length === 0) && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '1rem' }}>
              No attendance sessions recorded for {MONTHS[calMonth - 1]} {calYear}.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
