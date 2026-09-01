import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { userApi } from '@/api/user.api';
import { attendanceApi } from '@/api/attendance.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  Building2, BedDouble,
  GraduationCap, Shield, Edit3, Save, X,
  ChevronLeft, ChevronRight,
  CheckCircle2, Loader2, Sparkles, ArrowRight,
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

export function StudentProfilePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for Editing (all initialized from backend without fake defaults)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    usn: '',
    department: '',
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

  // Fetch student profile from backend
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['current-student'],
    queryFn: userApi.getCurrentStudent,
  });
  const profile: any = (profileData?.data as any)?.data;

  // Sync form state when profile data loads
  useEffect(() => {
    if (profile || user) {
      const u = profile?.user || user;
      setFormData({
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        phone: u?.phone || '',
        usn: profile?.usn || '',
        department: profile?.department || '',
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

  // Display variables strictly from backend
  const u = profile?.user || user;
  const firstName = u?.firstName || '';
  const lastName = u?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';
  const email = u?.email || '—';
  const phone = u?.phone || 'Not set';
  const usn = profile?.usn || null;
  const department = profile?.department || null;
  const yearSem = profile?.year && profile?.semester ? `Year ${profile.year} • Semester ${profile.semester}` : null;
  const guardian = profile?.guardianName || null;
  const guardianPhone = profile?.guardianPhone || null;
  const address = profile?.permanentAddress || null;
  const gender = profile?.gender ? profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase() : null;
  const bloodGroup = profile?.bloodGroup || null;
  const dob = profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  // Real room allocation details from backend
  const allocation = profile?.roomAllocations?.[0];
  const hasAllocation = Boolean(allocation);
  const hostelName = allocation?.room?.floor?.block?.hostel?.name || null;
  const blockName = allocation?.room?.floor?.block?.name || null;
  const floorNum = allocation?.room?.floor?.floorNumber != null ? `Floor ${allocation.room.floor.floorNumber}` : null;
  const roomNumber = allocation?.room?.roomNumber || null;
  const bedNumber = allocation?.bedNumber || null;

  const isProfileIncomplete = !profile?.usn || !profile?.department;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  const initials = `${firstName?.[0] || 'S'}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Student Profile"
        description="Your verified student credentials, room allocation, and night roll call attendance"
        breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Profile' }]}
        actions={
          <button
            onClick={handleOpenEdit}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem', borderRadius: '0.75rem', border: 'none',
              backgroundColor: '#2563eb', color: 'white',
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

      {/* Success Notification */}
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

      {/* Incomplete Profile Alert Banner */}
      {isProfileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            padding: '1.125rem 1.5rem', borderRadius: '1rem',
            backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#fffbeb',
            border: '1px solid #f59e0b', color: isDark ? '#fbbf24' : '#92400e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>Complete Your Student Profile</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.9, marginTop: '0.125rem' }}>
                Please fill in your USN, academic branch, year, semester, and emergency contact details.
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenEdit}
            style={{
              padding: '0.5rem 1.125rem', borderRadius: '0.5rem',
              border: 'none', backgroundColor: '#d97706', color: 'white',
              fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Fill Details
          </button>
        </motion.div>
      )}

      {/* ─── 1. Digital Student ID Hero Banner ─── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
        <div style={{
          background: isDark
            ? 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%)',
          padding: '2.25rem 2rem',
          position: 'relative',
          color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            {/* Left: Avatar & Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '5.25rem', height: '5.25rem', borderRadius: '1.25rem',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.875rem', fontWeight: 900, color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}>
                {initials}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                  <span style={{
                    padding: '0.2rem 0.625rem', borderRadius: '9999px',
                    backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
                    fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em',
                  }}>
                    {usn ? `USN: ${usn}` : 'USN: Not Assigned'}
                  </span>

                  {hasAllocation ? (
                    <span style={{
                      padding: '0.2rem 0.625rem', borderRadius: '9999px',
                      backgroundColor: 'rgba(34,197,94,0.3)', color: '#86efac',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      ● Active Resident
                    </span>
                  ) : (
                    <span style={{
                      padding: '0.2rem 0.625rem', borderRadius: '9999px',
                      backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      ○ Not Allocated
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {fullName}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {department || 'Academic department not set'}
                </p>
              </div>
            </div>

            {/* Right: Real Hostel Allocation Pill */}
            {hasAllocation ? (
              <div style={{
                padding: '1rem 1.25rem', borderRadius: '1rem',
                backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                minWidth: '220px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)' }}>
                  <Building2 style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>Room Allocation</span>
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  Room {roomNumber} {bedNumber ? `(Bed ${bedNumber})` : ''}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.125rem' }}>
                  {hostelName} {blockName ? `• ${blockName}` : ''}
                </div>
              </div>
            ) : (
              <Link
                to="/student/rooms"
                style={{
                  padding: '1rem 1.25rem', borderRadius: '1rem',
                  backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  minWidth: '220px', textDecoration: 'none', color: 'white',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)' }}>
                  <Building2 style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>Room Allocation</span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  No Active Room
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#93c5fd', marginTop: '0.125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Browse & Book Room <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
                </div>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── 2. Structured 3-Section Information Hub ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Panel 1: Academic & Identification */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ ...cardStyle, padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              color: isDark ? '#60a5fa' : '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GraduationCap style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Academic Details</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>College enrollment & branch</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>USN / Roll Number</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: usn ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem', fontFamily: 'monospace' }}>
                {usn || 'Not assigned'}
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department / Branch</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: department ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                {department || 'Not set'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Level</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: yearSem ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {yearSem || 'Not set'}
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Blood Group</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: bloodGroup ? '#dc2626' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {bloodGroup || '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gender</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: gender ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {gender || '—'}
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date of Birth</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: dob ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {dob || '—'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Panel 2: Hostel & Accommodation */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...cardStyle, padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : '#f0fdfa',
              color: isDark ? '#2dd4bf' : '#0d9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BedDouble style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hostel Stay</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Room assignment & resident status</p>
            </div>
          </div>

          {hasAllocation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hostel Block</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                  {hostelName} {blockName ? `(${blockName})` : ''}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Room Number</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb', marginTop: '0.125rem' }}>
                    Room {roomNumber}
                  </div>
                </div>

                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resident Status</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16a34a', marginTop: '0.125rem' }}>
                    Active Resident
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bed Assignment</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                    {bedNumber ? `Bed #${bedNumber}` : 'Assigned'}
                  </div>
                </div>

                <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Floor</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                    {floorNum || 'Floor 0'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '1.5rem', borderRadius: '0.75rem', textAlign: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
              border: '1px dashed var(--border-primary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
            }}>
              <Building2 style={{ width: '2rem', height: '2rem', color: 'var(--text-muted)', opacity: 0.6 }} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  No Room Allocated
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', maxWidth: '280px' }}>
                  You do not have an active hostel room allocation. Browse available rooms across hostels to book your stay.
                </p>
              </div>
              <Link
                to="/student/rooms"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: '0.5rem',
                  backgroundColor: '#2563eb', color: 'white',
                  fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
                  marginTop: '0.25rem',
                }}
              >
                <span>Browse Available Rooms</span>
                <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
              </Link>
            </div>
          )}
        </motion.div>

        {/* Panel 3: Contact & Emergency */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ ...cardStyle, padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb',
              color: isDark ? '#fbbf24' : '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Contact & Emergency</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered details & guardian</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>{email}</div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Mobile</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: phone !== 'Not set' ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>{phone}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Guardian Name</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: guardian ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {guardian || '—'}
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Guardian Phone</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: guardianPhone ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                  {guardianPhone || '—'}
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', border: '1px solid var(--border-primary)' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Permanent Address</div>
              <div style={{ fontSize: '0.8125rem', color: address ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.125rem' }}>
                {address || '—'}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── 3. Night Attendance Analytics & Calendar ─── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={cardStyle}>
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Night Attendance Record
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {hasAllocation ? `Daily roll call log for ${hostelName}` : 'Biometric and digital roll call log'}
            </p>
          </div>

          {/* Month Switcher */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.25rem 0.5rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
            border: '1px solid var(--border-primary)',
          }}>
            <button
              onClick={prevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
              {MONTHS[calMonth - 1]} {calYear}
            </span>
            <button
              onClick={nextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem', color: 'var(--text-secondary)' }}
            >
              <ChevronRight style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div style={{
          padding: '1.25rem 1.75rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          borderBottom: '1px solid var(--border-primary)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#fafafa',
        }}>
          <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'white', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>{attendance?.summary?.total || 0}</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.125rem' }}>Total Sessions</div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'white', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>{attendance?.summary?.present || 0}</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.125rem' }}>Present</div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'white', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{attendance?.summary?.onLeave || 0}</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.125rem' }}>On Leave</div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'white', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{attendance?.summary?.absent || 0}</div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.125rem' }}>Absent</div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'white', border: '1px solid var(--border-primary)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
              {attendance?.summary?.total > 0 ? Math.round((attendance.summary.present / attendance.summary.total) * 100) : 0}%
            </div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.125rem' }}>Attendance Rate</div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          {/* Day Names Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#93c5fd' : '#2563eb', padding: '0.5rem 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.375rem' }}>
            {calendarDays.map((cell, idx) => {
              if (cell.day == null) {
                return <div key={`empty-${idx}`} style={{ minHeight: '60px', borderRadius: '0.5rem', backgroundColor: 'transparent' }} />;
              }

              const isPresent = cell.status === 'PRESENT';
              const isOnLeave = cell.status === 'ON_LEAVE';
              const isAbsent = cell.status === 'ABSENT';

              let cellBg = isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc';
              let cellBorder = '1px solid var(--border-primary)';
              let badgeColor = '#64748b';
              let badgeBg = 'transparent';
              let statusLabel = '';

              if (isPresent) {
                cellBg = isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7';
                cellBorder = '1px solid #16a34a';
                badgeColor = isDark ? '#4ade80' : '#15803d';
                badgeBg = isDark ? 'rgba(22,163,74,0.3)' : '#bbf7d0';
                statusLabel = 'Present';
              } else if (isOnLeave) {
                cellBg = isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7';
                cellBorder = '1px solid #f59e0b';
                badgeColor = isDark ? '#fbbf24' : '#b45309';
                badgeBg = isDark ? 'rgba(245,158,11,0.3)' : '#fde68a';
                statusLabel = 'Leave';
              } else if (isAbsent) {
                cellBg = isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2';
                cellBorder = '1px solid #dc2626';
                badgeColor = isDark ? '#f87171' : '#b91c1c';
                badgeBg = isDark ? 'rgba(220,38,38,0.3)' : '#fecaca';
                statusLabel = 'Absent';
              }

              return (
                <div
                  key={`day-${cell.day}`}
                  style={{
                    minHeight: '60px',
                    padding: '0.375rem 0.5rem',
                    borderRadius: '0.625rem',
                    backgroundColor: cellBg,
                    border: cellBorder,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {cell.day}
                  </span>

                  {statusLabel && (
                    <span style={{
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.375rem',
                      borderRadius: '0.25rem',
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      alignSelf: 'flex-start',
                      textTransform: 'uppercase',
                    }}>
                      {statusLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: '#16a34a' }} />
              <span>Present</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: '#f59e0b' }} />
              <span>Approved Leave</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span style={{ width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: '#dc2626' }} />
              <span>Absent</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── 4. Edit Profile Modal ─── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', backgroundColor: 'var(--overlay)',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: '640px', maxHeight: '90vh',
                backgroundColor: 'var(--bg-card)', borderRadius: '1.25rem',
                border: '1px solid var(--border-primary)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Edit Student Profile
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X style={{ width: '1.25rem', height: '1.25rem' }} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {errorMessage && (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {errorMessage}
                  </div>
                )}

                {/* Section: Personal */}
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Personal Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>First Name *</label>
                      <input
                        type="text" required value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First Name"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Last Name *</label>
                      <input
                        type="text" required value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last Name"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Blood Group</label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select Blood Group</option>
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Date of Birth</label>
                    <input
                      type="date" value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                {/* Section: Academic */}
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Academic Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>USN / Roll No *</label>
                      <input
                        type="text" required value={formData.usn}
                        onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                        placeholder="e.g. 1BM22CS001"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Department / Branch *</label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select Branch</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Academic Year</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Semester</label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Contact & Emergency */}
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Contact & Guardian Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Student Phone</label>
                      <input
                        type="tel" value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Guardian Name</label>
                      <input
                        type="text" value={formData.guardianName}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        placeholder="Parent / Guardian Name"
                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Guardian Phone</label>
                    <input
                      type="tel" value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      placeholder="Emergency contact number"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Permanent Address</label>
                    <textarea
                      rows={2}
                      value={formData.permanentAddress}
                      onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                      placeholder="House No, Street, City, State, PIN"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button" onClick={() => setIsEditModalOpen(false)}
                    style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={updateMutation.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none',
                      backgroundColor: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {updateMutation.isPending ? <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '1rem', height: '1rem' }} />}
                    Save Changes
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
