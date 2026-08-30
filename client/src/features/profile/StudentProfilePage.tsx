import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/api/user.api';
import { attendanceApi } from '@/api/attendance.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  User, Mail, Phone, Building2, BedDouble, BookOpen,
  GraduationCap, Calendar, Shield, Edit3, Save, X,
  ChevronLeft, ChevronRight, MapPin, Heart, AlertCircle,
  CheckCircle2, Loader2, Sparkles, Lock,
} from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Machine Learning',
  'Artificial Intelligence & Data Science',
  'Biotechnology',
  'Chemical Engineering',
  'Industrial Engineering & Management',
  'Aerospace Engineering',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for Editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    usn: '',
    department: 'Computer Science & Engineering',
    year: 1,
    semester: 1,
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    bloodGroup: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    permanentAddress: '',
  });

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

  // Sync form state when profile data or modal opens
  useEffect(() => {
    if (profile || user) {
      const u = profile?.user || user;
      setFormData({
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        phone: u?.phone || '',
        usn: profile?.usn || '',
        department: profile?.department || 'Computer Science & Engineering',
        year: profile?.year || 1,
        semester: profile?.semester || 1,
        gender: profile?.gender || 'MALE',
        bloodGroup: profile?.bloodGroup || '',
        dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        guardianName: profile?.guardianName || '',
        guardianPhone: profile?.guardianPhone || '',
        permanentAddress: profile?.permanentAddress || '',
      });
    }
  }, [profile, user, isEditModalOpen]);

  // Fetch attendance history
  const { data: attendanceData } = useQuery({
    queryKey: ['my-attendance', calYear, calMonth],
    queryFn: () => attendanceApi.getMyHistory(calYear, calMonth),
    enabled: !!user,
  });
  const attendance: any = (attendanceData?.data as any)?.data;

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => userApi.updateCurrentStudent(data),
    onSuccess: () => {
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['current-student'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      setIsEditModalOpen(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to update profile. Please try again.');
    },
  });

  const handleOpenEdit = () => {
    setErrorMessage(null);
    setIsEditModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    updateMutation.mutate(formData);
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

  // Display variables with safe fallbacks
  const u = profile?.user || user;
  const firstName = u?.firstName || '';
  const lastName = u?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';
  const email = u?.email || '—';
  const phone = u?.phone || 'Not set';
  const usn = profile?.usn || 'Not assigned';
  const department = profile?.department || 'Not set';
  const yearSem = profile?.year && profile?.semester ? `Year ${profile.year} • Semester ${profile.semester}` : 'Not set';
  const guardian = profile?.guardianName || '—';
  const guardianPhone = profile?.guardianPhone || '—';
  const address = profile?.permanentAddress || '—';
  const gender = profile?.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : '—';
  const bloodGroup = profile?.bloodGroup || '—';
  const dob = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const allocation = profile?.roomAllocations?.[0];
  const hostelName = allocation?.room?.floor?.block?.hostel?.name;
  const roomNumber = allocation?.room?.roomNumber;
  const isProfileIncomplete = !profile?.usn || profile?.isProfileIncomplete;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  const initials = `${firstName?.[0] || 'S'}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="My Profile"
        description="Your personal details, academic information, and night attendance records"
        breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Profile' }]}
        actions={
          <button
            onClick={handleOpenEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white',
              fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Edit3 style={{ width: '0.875rem', height: '0.875rem' }} />
            Edit Profile
          </button>
        }
      />

      {/* Success Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.875rem 1.25rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
              border: '1px solid #16a34a', color: isDark ? '#4ade80' : '#15803d',
              fontSize: '0.875rem', fontWeight: 600,
            }}
          >
            <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0 }} />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incomplete Profile Prompt Banner */}
      {isProfileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            padding: '1rem 1.25rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#fef3c7',
            border: '1px solid #f59e0b', color: isDark ? '#fbbf24' : '#92400e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Complete Your Student Profile</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '0.125rem' }}>
                Please fill in your USN, academic branch, year, semester, and guardian contact details.
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenEdit}
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              border: 'none', backgroundColor: '#d97706', color: 'white',
              fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Fill Details
          </button>
        </motion.div>
      )}

      {/* Profile Card Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #0d9488)',
          padding: '2rem 2rem 2.5rem',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '5rem', height: '5rem', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 800, color: 'white',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                {fullName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em',
                }}>
                  {usn}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
                  • {department}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {[
            { icon: User, label: 'Full Name', value: fullName },
            { icon: GraduationCap, label: 'USN / Roll No', value: usn },
            { icon: Mail, label: 'Email', value: email },
            { icon: Phone, label: 'Phone', value: phone },
            { icon: BookOpen, label: 'Department', value: department },
            { icon: Calendar, label: 'Year / Semester', value: yearSem },
            { icon: User, label: 'Gender', value: gender },
            { icon: Heart, label: 'Blood Group', value: bloodGroup },
            { icon: Calendar, label: 'Date of Birth', value: dob },
            { icon: Shield, label: 'Guardian', value: guardian },
            { icon: Phone, label: 'Guardian Phone', value: guardianPhone },
            { icon: MapPin, label: 'Permanent Address', value: address },
            { icon: Building2, label: 'Hostel', value: hostelName || 'Not allocated' },
            { icon: BedDouble, label: 'Room', value: roomNumber ? `Room ${roomNumber}` : '—' },
          ].map((field, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.875rem 1rem', borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                transition: 'background-color 0.15s',
              }}
            >
              <field.icon style={{ width: '1.125rem', height: '1.125rem', color: '#3b82f6', flexShrink: 0, marginTop: '0.125rem' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.125rem', wordBreak: 'break-word' }}>
                  {field.value}
                </div>
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

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1rem',
            }}
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '1.25rem',
                width: '100%', maxWidth: '640px',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 10,
              }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Edit Student Profile
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    Update your academic, personal, and guardian contact details
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '0.375rem', borderRadius: '0.375rem',
                  }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {errorMessage && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2',
                    border: '1px solid #dc2626', color: isDark ? '#f87171' : '#b91c1c',
                    fontSize: '0.8125rem', fontWeight: 600,
                  }}>
                    <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Section: Personal Info */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Personal Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Blood Group
                      </label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      >
                        <option value="">Select Blood Group</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Academic Details */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Academic Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        USN / Roll Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1BM21CS001"
                        value={formData.usn}
                        onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                          textTransform: 'uppercase',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Department / Branch *
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Year of Study
                      </label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Semester
                      </label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Guardian & Address */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                    Guardian & Permanent Address
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                        style={{
                          width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.875rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Permanent Address
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter full residential address"
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                        border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>

                {/* Non-editable notice */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                }}>
                  <Lock style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0, color: '#3b82f6' }} />
                  <span>Hostel block and room allocations are managed by your hostel warden & room booking engine.</span>
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
                      border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                      color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.625rem 1.5rem', borderRadius: '0.5rem',
                      border: 'none', background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                      color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                    }}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save style={{ width: '1rem', height: '1rem' }} />
                        Save Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

