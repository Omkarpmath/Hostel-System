import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { attendanceApi } from '@/api/attendance.api';
import { hostelApi } from '@/api/hostel.api';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import {
  ClipboardCheck, Download, Search, Users, UserCheck,
  CalendarOff, UserX, Shield, Building2, CalendarDays,
} from 'lucide-react';

const statusColors: Record<string, { color: string; bg: string }> = {
  PRESENT: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  ON_LEAVE: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  ABSENT: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
};

export function AttendanceRegisterPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedHostel, setSelectedHostel] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Admin: show security assignment section
  const [showAssignment, setShowAssignment] = useState(false);
  const [assignHostelId, setAssignHostelId] = useState('');
  const [assignSecurityId, setAssignSecurityId] = useState('');

  // Fetch hostels
  const { data: hostelsData } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll(),
    retry: 1,
  });
  const hostels: any[] = (hostelsData?.data as any)?.data || [];

  // Fetch security users (admin only)
  const { data: securityData } = useQuery({
    queryKey: ['security-users'],
    queryFn: () => attendanceApi.listSecurityUsers(),
    enabled: isAdmin,
    retry: 1,
  });
  const securityUsers: any[] = (securityData?.data as any)?.data || [];

  // Fetch register
  const { data: registerData, isLoading: registerLoading } = useQuery({
    queryKey: ['attendance-register', selectedHostel, selectedDate],
    queryFn: () => attendanceApi.getRegister(selectedHostel, selectedDate),
    enabled: !!selectedHostel,
    retry: 1,
  });
  const register = (registerData?.data as any)?.data;

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: () => attendanceApi.assignSecurity(assignSecurityId, assignHostelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-users'] });
      setAssignSecurityId('');
      setAssignHostelId('');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (id: string) => attendanceApi.unassignSecurity(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['security-users'] }),
  });

  // Filter register entries
  const filteredRegister = useMemo(() => {
    if (!register?.register) return [];
    return register.register.filter((r: any) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.studentName.toLowerCase().includes(q) || r.usn.toLowerCase().includes(q);
      }
      return true;
    });
  }, [register, statusFilter, searchQuery]);

  const handleExport = async () => {
    try {
      const res = await attendanceApi.exportCSV(selectedHostel, selectedDate);
      const blob = new Blob([res.data as any], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV');
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
  };

  const dashboardHref = isAdmin ? '/admin/dashboard' : user?.role === 'SECURITY' ? '/security/dashboard' : '/warden/dashboard';
  const breadcrumbs = [{ label: 'Dashboard', href: dashboardHref }, { label: 'Attendance Log' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Attendance Register"
        description="View and export night attendance records"
        breadcrumbs={breadcrumbs}
        actions={
          isAdmin ? (
            <button
              onClick={() => setShowAssignment(!showAssignment)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
                color: 'white', fontSize: '0.875rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Shield style={{ width: '1rem', height: '1rem' }} />
              {showAssignment ? 'Hide' : 'Manage'} Security
            </button>
          ) : undefined
        }
      />

      {/* Admin: Security Assignment Panel */}
      {isAdmin && showAssignment && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={cardStyle}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Security Hostel Assignments
            </h3>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {/* Assign form */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <select
                value={assignSecurityId}
                onChange={(e) => setAssignSecurityId(e.target.value)}
                style={{ ...inputStyle, flex: '1', minWidth: '180px' }}
              >
                <option value="">Select Security User</option>
                {securityUsers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
              <select
                value={assignHostelId}
                onChange={(e) => setAssignHostelId(e.target.value)}
                style={{ ...inputStyle, flex: '1', minWidth: '180px' }}
              >
                <option value="">Select Hostel</option>
                {hostels.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              <button
                onClick={() => assignMutation.mutate()}
                disabled={!assignSecurityId || !assignHostelId || assignMutation.isPending}
                style={{
                  padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none',
                  background: '#16a34a', color: 'white', fontSize: '0.8125rem',
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: (!assignSecurityId || !assignHostelId) ? 0.5 : 1,
                }}
              >
                Assign
              </button>
            </div>

            {/* Current assignments */}
            {securityUsers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {securityUsers.map((s: any) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Shield style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {s.firstName} {s.lastName}
                      </span>
                      {s.assignedHostel ? (
                        <span style={{
                          padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.6875rem',
                          fontWeight: 700, backgroundColor: 'rgba(22, 163, 74, 0.12)', color: '#16a34a',
                        }}>
                          {s.assignedHostel.name}
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.6875rem',
                          fontWeight: 700, backgroundColor: 'rgba(220, 38, 38, 0.12)', color: '#dc2626',
                        }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                    {s.assignedHostel && (
                      <button
                        onClick={() => unassignMutation.mutate(s.id)}
                        style={{
                          padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: 'none',
                          backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
                No security users found. Create users with the SECURITY role first.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '180px' }}>
            <Building2 style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)', flexShrink: 0 }} />
            <select value={selectedHostel} onChange={(e) => setSelectedHostel(e.target.value)} style={inputStyle}>
              <option value="">Select Hostel</option>
              {hostels.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '180px' }}>
            <CalendarDays style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '180px' }}>
            <Search style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={inputStyle}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '160px' }}>
            <option value="ALL">All Status</option>
            <option value="PRESENT">Present</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
          {selectedHostel && (
            <button
              onClick={handleExport}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 1rem', borderRadius: '0.5rem', border: 'none',
                background: '#0d9488', color: 'white', fontSize: '0.8125rem',
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Download style={{ width: '0.875rem', height: '0.875rem' }} />
              CSV
            </button>
          )}
        </div>
      </motion.div>

      {/* Summary cards */}
      {register?.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Total', value: register.summary.total, icon: Users, color: '#3b82f6' },
            { label: 'Present', value: register.summary.present, icon: UserCheck, color: '#16a34a' },
            { label: 'On Leave', value: register.summary.onLeave, icon: CalendarOff, color: '#f59e0b' },
            { label: 'Absent', value: register.summary.absent, icon: UserX, color: '#dc2626' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ ...cardStyle, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <s.icon style={{ width: '1.25rem', height: '1.25rem', color: s.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Session info */}
      {register?.session && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            ...cardStyle,
            padding: '0.75rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Conducted by <strong style={{ color: 'var(--text-primary)' }}>{register.session.securityName}</strong>
          </span>
          <span style={{
            padding: '0.2rem 0.75rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: 700,
            backgroundColor: register.session.status === 'COMPLETED' ? 'rgba(22,163,74,0.12)' : 'rgba(59,130,246,0.12)',
            color: register.session.status === 'COMPLETED' ? '#16a34a' : '#3b82f6',
          }}>
            {register.session.status}
          </span>
        </motion.div>
      )}

      {/* Register table */}
      {!selectedHostel ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Select a Hostel"
          description="Choose a hostel and date to view the attendance register."
        />
      ) : registerLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : !register || filteredRegister.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Records Found"
          description={register?.register?.length === 0 ? "No students allocated to this hostel yet." : "No records match your filters."}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                  {['#', 'USN', 'Student Name', 'Room', 'Status', 'Time'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: 'var(--text-muted)', borderBottom: '1px solid var(--border-primary)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRegister.map((r: any, i: number) => (
                  <tr
                    key={r.studentId}
                    style={{
                      borderBottom: i < filteredRegister.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {r.usn}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.studentName}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {r.roomNumber}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.625rem', borderRadius: '1rem',
                        fontSize: '0.6875rem', fontWeight: 700,
                        backgroundColor: statusColors[r.status]?.bg || 'transparent',
                        color: statusColors[r.status]?.color || 'var(--text-secondary)',
                      }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {r.scannedAt ? new Date(r.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
