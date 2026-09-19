import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/api/user.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  GraduationCap, Plus, X, Loader2, AlertCircle, Mail, Phone,
  Building2, BedDouble, Search, ChevronRight, UserCheck, UserX,
  Upload, Download, CheckCircle2, Users, Filter
} from 'lucide-react';

export function StudentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>('ALL');
  const [allocFilter, setAllocFilter] = useState<'ALL' | 'ALLOCATED' | 'UNALLOCATED'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['students'],
    queryFn: () => userApi.getStudents({ limit: '1000' }),
    retry: 1,
  });
  const allStudents: any[] = (() => {
    const d = (data?.data as any)?.data;
    if (Array.isArray(d)) return d;
    if (d?.students && Array.isArray(d.students)) return d.students;
    return [];
  })();

  // Counts for KPI tabs
  const total = allStudents.length;
  const boysCount = allStudents.filter((s) => s.gender === 'MALE' || s.gender === 'BOYS').length;
  const girlsCount = allStudents.filter((s) => s.gender === 'FEMALE' || s.gender === 'GIRLS').length;
  const allocated = allStudents.filter((s) => s.roomAllocations && s.roomAllocations.length > 0).length;
  const unallocated = total - allocated;
  const withProfile = allStudents.filter((s) => s.usn).length;

  const students = allStudents.filter((s) => {
    // Gender filter
    if (genderFilter === 'MALE' && s.gender !== 'MALE' && s.gender !== 'BOYS') return false;
    if (genderFilter === 'FEMALE' && s.gender !== 'FEMALE' && s.gender !== 'GIRLS') return false;

    // Year filter
    if (yearFilter !== 'ALL' && s.year !== yearFilter) return false;

    // Allocation filter
    const isAlloc = s.roomAllocations && s.roomAllocations.length > 0;
    if (allocFilter === 'ALLOCATED' && !isAlloc) return false;
    if (allocFilter === 'UNALLOCATED' && isAlloc) return false;

    // Search query
    if (!search) return true;
    const q = search.toLowerCase();
    const room = s.roomAllocations?.[0];
    const hostelName = room?.room?.floor?.block?.hostel?.name?.toLowerCase() || '';
    const roomNum = room?.room?.roomNumber?.toLowerCase() || '';

    return (
      s.user?.firstName?.toLowerCase().includes(q) ||
      s.user?.lastName?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.usn?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      hostelName.includes(q) ||
      roomNum.includes(q)
    );
  });

  const canAdd = user?.role === 'ADMIN';

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  };

  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem', border: 'none',
    background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
    color: 'white', fontSize: '0.875rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  };

  const btnSecondary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.125rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Student Management"
        description={`${total} enrolled student${total !== 1 ? 's' : ''} across all batches and hostels`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Students' }]}
        actions={canAdd ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowBulkModal(true)} style={btnSecondary}>
              <Upload style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
              <span>Import CSV</span>
            </button>
            <button onClick={() => setShowForm(true)} style={btnPrimary}>
              <Plus style={{ width: '1rem', height: '1rem' }} />
              <span>Add Student</span>
            </button>
          </div>
        ) : undefined}
      />

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Enrolled', count: total, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', icon: GraduationCap },
          { label: 'Room Allocated', count: allocated, color: '#10b981', bg: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', icon: BedDouble },
          { label: 'Awaiting Room', count: unallocated, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', icon: UserX },
          { label: 'Profile Verified', count: withProfile, color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.1)' : '#f5f3ff', icon: UserCheck },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
            padding: '1.125rem 1.25rem', borderRadius: '1rem', backgroundColor: s.bg,
            border: `1px solid ${isDark ? `${s.color}33` : `${s.color}22`}`,
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <s.icon style={{ width: '1.375rem', height: '1.375rem', color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.count}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: s.color, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '1rem',
        padding: '1.25rem', borderRadius: '1rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
      }}>
        {/* Row 1: Gender Tabs & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Gender Filter Segmented Control */}
          <div style={{
            display: 'inline-flex', padding: '0.25rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
            border: '1px solid var(--border-primary)',
          }}>
            {[
              { key: 'ALL', label: `All Students (${total})`, icon: Users },
              { key: 'MALE', label: `Boys (${boysCount})`, icon: GraduationCap },
              { key: 'FEMALE', label: `Girls (${girlsCount})`, icon: GraduationCap },
            ].map((tab) => {
              const active = genderFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setGenderFilter(tab.key as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: 'none',
                    backgroundColor: active ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                    color: active ? (tab.key === 'FEMALE' ? '#db2777' : tab.key === 'MALE' ? '#2563eb' : 'var(--text-primary)') : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500, fontSize: '0.8125rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <tab.icon style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '22rem' }}>
            <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, USN, dept, room..."
              style={{
                width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.75rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none', fontFamily: 'inherit',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Year Selector & Allocation Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-primary)', paddingTop: '0.875rem' }}>
          {/* Year Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter style={{ width: '0.75rem', height: '0.75rem' }} /> Year:
            </span>
            {[
              { key: 'ALL', label: 'All Years' },
              { key: 1, label: '1st Year' },
              { key: 2, label: '2nd Year' },
              { key: 3, label: '3rd Year' },
              { key: 4, label: '4th Year' },
            ].map((y) => {
              const active = yearFilter === y.key;
              return (
                <button
                  key={String(y.key)}
                  onClick={() => setYearFilter(y.key as any)}
                  style={{
                    padding: '0.375rem 0.75rem', borderRadius: '9999px',
                    border: `1px solid ${active ? '#3b82f6' : 'var(--border-primary)'}`,
                    backgroundColor: active ? (isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff') : 'transparent',
                    color: active ? '#2563eb' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500, fontSize: '0.75rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {y.label}
                </button>
              );
            })}
          </div>

          {/* Allocation Status Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status:
            </span>
            {[
              { key: 'ALL', label: 'All Status' },
              { key: 'ALLOCATED', label: 'Allocated' },
              { key: 'UNALLOCATED', label: 'Unallocated' },
            ].map((status) => {
              const active = allocFilter === status.key;
              return (
                <button
                  key={status.key}
                  onClick={() => setAllocFilter(status.key as any)}
                  style={{
                    padding: '0.375rem 0.75rem', borderRadius: '9999px',
                    border: `1px solid ${active ? (status.key === 'ALLOCATED' ? '#10b981' : status.key === 'UNALLOCATED' ? '#f59e0b' : '#6366f1') : 'var(--border-primary)'}`,
                    backgroundColor: active ? (isDark ? 'rgba(99,102,241,0.2)' : '#eef2ff') : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500, fontSize: '0.75rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Student Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <Loader2 style={{ width: '2rem', height: '2rem', animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={search || genderFilter !== 'ALL' || yearFilter !== 'ALL' || allocFilter !== 'ALL' ? 'No matching students' : 'No students registered'}
          description={search ? 'Try adjusting your filters or search query.' : 'Students will appear here once they register or are imported via CSV.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {students.map((student, i) => {
            const isExpanded = expandedId === student.id;
            const fName = student.user?.firstName || '';
            const lName = student.user?.lastName || '';
            const initials = `${fName[0] || '?'}${lName[0] || ''}`;
            const hasProfile = Boolean(student.usn);
            const room = student.roomAllocations?.[0];
            const hostel = room?.room?.floor?.block?.hostel?.name;
            const roomNum = room?.room?.roomNumber;
            const isFemale = student.gender === 'FEMALE' || student.gender === 'GIRLS';

            return (
              <motion.div key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} style={cardStyle}>
                <button onClick={() => setExpandedId(isExpanded ? null : student.id)}
                  style={{ width: '100%', padding: '1.125rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '3.25rem', height: '3.25rem', borderRadius: '1rem', flexShrink: 0,
                    background: isFemale
                      ? 'linear-gradient(135deg, #ec4899, #db2777)'
                      : 'linear-gradient(135deg, #2563eb, #0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.9375rem', fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    {initials}
                  </div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fName} {lName}
                      </span>
                      {/* Gender Badge */}
                      <span style={{
                        padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
                        backgroundColor: isFemale ? (isDark ? 'rgba(236,72,153,0.15)' : '#fdf2f8') : (isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff'),
                        color: isFemale ? '#db2777' : '#2563eb',
                      }}>
                        {isFemale ? 'Female 👩‍🎓' : 'Male 👨‍🎓'}
                      </span>

                      {/* Year / Dept Pill */}
                      {student.year && (
                        <span style={{
                          padding: '0.125rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 600,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                          color: 'var(--text-secondary)',
                        }}>
                          Year {student.year} · Sem {student.semester || 1}
                        </span>
                      )}

                      {hasProfile ? (
                        <StatusBadge status="ACTIVE" />
                      ) : (
                        <span style={{
                          padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: 800,
                          backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
                          color: isDark ? '#fbbf24' : '#d97706', textTransform: 'uppercase',
                        }}>Profile Incomplete</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail style={{ width: '0.75rem', height: '0.75rem' }} />{student.user?.email || '—'}
                      </span>
                      {student.usn && (
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                          {student.usn}
                        </span>
                      )}
                      {student.department && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />{student.department}
                        </span>
                      )}
                      {hostel ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 600 }}>
                          <BedDouble style={{ width: '0.75rem', height: '0.75rem' }} />{hostel} · Rm {roomNum}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          No Room Allocated
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight style={{
                    width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s',
                  }} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                          <InfoBlock label="Email" value={student.user?.email || '—'} icon={Mail} />
                          <InfoBlock label="Phone" value={student.user?.phone || '—'} icon={Phone} />
                          <InfoBlock label="USN" value={student.usn || '—'} icon={GraduationCap} />
                          <InfoBlock label="Gender" value={student.gender || '—'} icon={Users} />
                          <InfoBlock label="Department" value={student.department || '—'} icon={Building2} />
                          <InfoBlock label="Year / Semester" value={student.usn ? `Year ${student.year} / Semester ${student.semester}` : '—'} icon={GraduationCap} />
                          <InfoBlock label="Guardian Name" value={student.guardianName || '—'} icon={UserCheck} />
                          <InfoBlock label="Guardian Phone" value={student.guardianPhone || '—'} icon={Phone} />
                          <InfoBlock label="Hostel" value={hostel || 'Not allocated'} icon={Building2} />
                          <InfoBlock label="Room Number" value={roomNum ? `Room ${roomNum}` : '—'} icon={BedDouble} />
                          <InfoBlock label="Permanent Address" value={student.permanentAddress || '—'} icon={Building2} />
                        </div>

                        {canAdd && !hasProfile && (
                          <button onClick={() => setProfileUserId(student.user?.id)} style={{
                            marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                            color: isDark ? '#60a5fa' : '#1d4ed8', fontSize: '0.8125rem', fontWeight: 700,
                          }}>
                            <UserCheck style={{ width: '0.875rem', height: '0.875rem' }} /> Complete Student Profile
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && <AddStudentModal onClose={() => setShowForm(false)} />}
        {showBulkModal && <BulkImportStudentsModal onClose={() => setShowBulkModal(false)} />}
        {profileUserId && <ProfileCompletionModal userId={profileUserId} onClose={() => setProfileUserId(null)} />}
      </AnimatePresence>
    </div>
  );
}

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
        <Icon style={{ width: '0.75rem', height: '0.75rem', color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function AddStudentModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (form: FormData) => {
      const body = Object.fromEntries(form.entries());
      return userApi.createStudent({ ...body, year: Number(body.year), semester: Number(body.semester) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to add student.'),
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '32rem', borderRadius: '1rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Add Student</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Create a new student account with full profile</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}><AlertCircle style={{ width: '1rem', height: '1rem' }} />{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>First Name</label><input name="firstName" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Last Name</label><input name="lastName" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Email</label><input name="email" type="email" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Phone</label><input name="phone" type="tel" style={inputStyle} /></div>
            <div><label style={labelStyle}>Password</label><input name="password" type="password" style={inputStyle} required /></div>
            <div><label style={labelStyle}>USN</label><input name="usn" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Department</label><input name="department" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Year</label><input name="year" type="number" min="1" max="5" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Semester</label><input name="semester" type="number" min="1" max="10" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Date of Birth</label><input name="dateOfBirth" type="date" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Guardian Name (Optional)</label><input name="guardianName" style={inputStyle} /></div>
            <div><label style={labelStyle}>Guardian Phone (Optional)</label><input name="guardianPhone" type="tel" style={inputStyle} /></div>
            <div><label style={labelStyle}>Gender</label><select name="gender" style={inputStyle} required defaultValue=""><option value="" disabled>Select Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
            <div><label style={labelStyle}>Permanent Address</label><input name="permanentAddress" style={inputStyle} required /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: mutation.isPending ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit' }}>
              {mutation.isPending ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />Adding...</> : 'Add Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function ProfileCompletionModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => userApi.createStudentProfile(userId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to complete profile.'),
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '32rem', borderRadius: '1rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Complete Student Profile</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Fill in the academic details</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.currentTarget).entries()); mutation.mutate({ ...v, year: Number(v.year), semester: Number(v.semester) }); }}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}><AlertCircle style={{ width: '1rem', height: '1rem' }} />{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><label style={labelStyle}>USN</label><input name="usn" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Department</label><input name="department" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Year</label><input name="year" type="number" min="1" max="5" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Semester</label><input name="semester" type="number" min="1" max="10" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Date of Birth</label><input name="dateOfBirth" type="date" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Gender</label><select name="gender" style={inputStyle} required defaultValue=""><option value="" disabled>Select Gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
            <div><label style={labelStyle}>Guardian Name (Optional)</label><input name="guardianName" style={inputStyle} /></div>
            <div><label style={labelStyle}>Guardian Phone (Optional)</label><input name="guardianPhone" type="tel" style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Permanent Address</label><input name="permanentAddress" style={inputStyle} required /></div>
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', opacity: mutation.isPending ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit' }}>
              {mutation.isPending ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />Saving...</> : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function BulkImportStudentsModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ processed: number; created: number; skipped: number; errors: string[] } | null>(null);

  const mutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const fd = new FormData();
      fd.append('file', fileToUpload);
      const res = await userApi.bulkImportStudents(fd);
      return res.data?.data;
    },
    onSuccess: (data) => {
      setResult(data || null);
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e: any) => {
      setError(e.response?.data?.message || 'Failed to import CSV file. Please verify format.');
    },
  });

  const downloadSampleCsv = () => {
    const csvContent =
      'USN,FirstName,LastName,Email,Phone,Gender,Department,Year,Semester,GuardianName,GuardianPhone,PermanentAddress,DateOfBirth,Password\n' +
      '1MS24CS001,Aarav,Sharma,aarav.sharma@campus.edu,9876543210,MALE,Computer Science,1,1,Rajesh Sharma,9876543200,123 MG Road Bangalore,2004-05-15,Student@123\n' +
      '1MS24CS002,Ananya,Iyer,ananya.iyer@campus.edu,9876543211,FEMALE,Computer Science,1,1,Sundar Iyer,9876543201,45 Palace Road Mysore,2004-08-20,Student@123\n' +
      '1MS24EC003,Rohan,Verma,rohan.verma@campus.edu,9876543212,MALE,Electronics,1,1,Kishore Verma,9876543202,78 Ring Road Hubli,2004-03-10,Student@123\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_students_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setError('');
    mutation.mutate(file);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '34rem', borderRadius: '1rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload style={{ width: '1.25rem', height: '1.25rem', color: '#2563eb' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bulk Student Onboarding</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Import batches of students via structured CSV</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success summary */}
          {result && (
            <div style={{
              padding: '1rem', borderRadius: '0.875rem',
              backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5',
              border: '1px solid rgba(16,185,129,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem' }} />
                <span>Import Process Completed!</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center', marginTop: '0.75rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6' }}>{result.processed}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Processed</p>
                </div>
                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>{result.created}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created</p>
                </div>
                <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff' }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>{result.skipped}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Skipped</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: '0.875rem', maxHeight: '100px', overflowY: 'auto', fontSize: '0.75rem', color: '#dc2626', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fff1f2', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                  {result.errors.map((err, idx) => (
                    <p key={idx}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Download Section */}
          <div style={{
            padding: '1rem', borderRadius: '0.875rem',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            border: '1px solid var(--border-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Download Sample Template</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes USN, Name, Email, Gender, Dept, Year, Guardian & Address</p>
            </div>
            <button
              type="button"
              onClick={downloadSampleCsv}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 0.875rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Download style={{ width: '0.875rem', height: '0.875rem', color: '#2563eb' }} />
              <span>Sample CSV</span>
            </button>
          </div>

          {/* File Picker / Dropzone */}
          <div style={{
            padding: '1.5rem', borderRadius: '0.875rem',
            border: '2px dashed var(--border-primary)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            textAlign: 'center', cursor: 'pointer',
          }}
            onClick={() => document.getElementById('student-csv-input')?.click()}
          >
            <input
              id="student-csv-input"
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setError('');
                }
              }}
            />
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            </div>
            <div>
              {file ? (
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#10b981' }}>
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Click or drag a CSV file here</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Supports standard comma-delimited .csv files</p>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.75rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || mutation.isPending}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
                color: 'white', fontSize: '0.875rem', fontWeight: 700,
                cursor: !file || mutation.isPending ? 'not-allowed' : 'pointer',
                opacity: !file || mutation.isPending ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: 'inherit',
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                  <span>Importing Students...</span>
                </>
              ) : (
                <>
                  <Upload style={{ width: '1rem', height: '1rem' }} />
                  <span>Upload & Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
