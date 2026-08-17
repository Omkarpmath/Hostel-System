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
} from 'lucide-react';

export function StudentsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const { data } = useQuery<any>({
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

  const students = allStudents.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.user?.firstName?.toLowerCase().includes(q) ||
      s.user?.lastName?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.usn?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  const canAdd = user?.role === 'ADMIN';
  const completeProfile = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => userApi.createStudentProfile(userId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); setProfileUserId(null); },
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem', border: 'none',
    background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
    color: 'white', fontSize: '0.875rem', fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  const total = allStudents.length;
  const allocated = allStudents.filter((s) => s.roomAllocations?.length > 0).length;
  const withProfile = allStudents.filter((s) => s.usn).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Student Management"
        description={`${total} student${total !== 1 ? 's' : ''} registered`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Students' }]}
        actions={canAdd ? (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus style={{ width: '1rem', height: '1rem' }} /> Add Student
          </button>
        ) : undefined}
      />

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Students', count: total, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', icon: GraduationCap },
          { label: 'Profile Complete', count: withProfile, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', icon: UserCheck },
          { label: 'Room Allocated', count: allocated, color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.1)' : '#f5f3ff', icon: BedDouble },
          { label: 'Unallocated', count: total - allocated, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', icon: UserX },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
            padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: s.bg,
            border: `1px solid ${isDark ? `${s.color}33` : `${s.color}22`}`,
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <s.icon style={{ width: '1.5rem', height: '1.5rem', color: s.color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color }}>{s.count}</p>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '24rem' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, USN..."
          style={{
            width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem',
            border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Student Cards */}
      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title={search ? 'No matching students' : 'No students yet'} description={search ? 'Try a different search term.' : 'Students will appear here once they register.'} />
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

            return (
              <motion.div key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} style={cardStyle}>
                <button onClick={() => setExpandedId(isExpanded ? null : student.id)}
                  style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '50%', flexShrink: 0,
                    background: hasProfile ? 'linear-gradient(135deg, #1e40af, #0d9488)' : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: hasProfile ? 'white' : '#f59e0b', fontSize: '0.8125rem', fontWeight: 800,
                  }}>
                    {initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {fName} {lName}
                      </span>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail style={{ width: '0.75rem', height: '0.75rem' }} />{student.user?.email || '—'}
                      </span>
                      {student.usn && <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{student.usn}</span>}
                      {hostel && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <BedDouble style={{ width: '0.75rem', height: '0.75rem' }} />Room {roomNum}
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
                          <InfoBlock label="Department" value={student.department || '—'} icon={Building2} />
                          <InfoBlock label="Year / Semester" value={student.usn ? `${student.year} / ${student.semester}` : '—'} icon={GraduationCap} />
                          <InfoBlock label="Guardian" value={student.guardianName || '—'} icon={UserCheck} />
                          <InfoBlock label="Hostel" value={hostel || 'Not allocated'} icon={Building2} />
                          <InfoBlock label="Room" value={roomNum || '—'} icon={BedDouble} />
                        </div>

                        {canAdd && !hasProfile && (
                          <button onClick={() => setProfileUserId(student.user?.id)} style={{
                            marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                            padding: '0.5rem 1rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                            color: isDark ? '#60a5fa' : '#1d4ed8', fontSize: '0.8125rem', fontWeight: 700,
                          }}>
                            <UserCheck style={{ width: '0.875rem', height: '0.875rem' }} /> Complete Profile
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
            <div><label style={labelStyle}>Guardian Name</label><input name="guardianName" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Guardian Phone</label><input name="guardianPhone" type="tel" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Gender</label><select name="gender" style={inputStyle} required><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
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
            <div><label style={labelStyle}>Gender</label><select name="gender" style={inputStyle} required><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
            <div><label style={labelStyle}>Guardian Name</label><input name="guardianName" style={inputStyle} required /></div>
            <div><label style={labelStyle}>Guardian Phone</label><input name="guardianPhone" type="tel" style={inputStyle} required /></div>
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
