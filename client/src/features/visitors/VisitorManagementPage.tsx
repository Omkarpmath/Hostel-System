import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { operationsApi } from '@/api/operations.api';
import { hostelApi } from '@/api/hostel.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Users, Building2, Calendar, Search, UserPlus, X,
} from 'lucide-react';

const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Relative',
  'Friend',
  'Other',
];

export function VisitorManagementPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'ADMIN';
  const isWarden = user?.role === 'WARDEN';
  const isSecurity = user?.role === 'SECURITY';

  // Filters
  const [selectedHostel, setSelectedHostel] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Security Form State
  const [visitorName, setVisitorName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Father');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch hostels based on role
  const { data: hostelsData } = useQuery({
    queryKey: ['hostels'],
    queryFn: () => hostelApi.getAll(),
    enabled: isAdmin,
    retry: 1,
  });
  const allHostels: any[] = (hostelsData?.data as any)?.data || [];

  const availableHostels = useMemo(() => {
    if (isAdmin) return allHostels;
    if (isWarden && (user as any)?.wardenHostels?.length) {
      return (user as any).wardenHostels; // [{ id, name }]
    }
    if (isSecurity && (user as any)?.assignedHostel) {
      return [(user as any).assignedHostel]; // { id, name }
    }
    return [];
  }, [isAdmin, isWarden, isSecurity, user, allHostels]);

  // Set default hostel
  useEffect(() => {
    if (isSecurity && (user as any)?.assignedHostel?.id) {
      setSelectedHostel((user as any).assignedHostel.id);
    } else if (isWarden && availableHostels.length === 1 && !selectedHostel) {
      setSelectedHostel(availableHostels[0].id);
    } else if (isAdmin && !selectedHostel) {
      setSelectedHostel('ALL');
    }
  }, [isSecurity, isWarden, isAdmin, availableHostels, selectedHostel, user]);

  // 2. Fetch hostel students for the Visiting Student dropdown (for Security)
  const activeHostelId = isSecurity ? ((user as any)?.assignedHostel?.id || '') : selectedHostel;
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['hostel-students', activeHostelId],
    queryFn: () => operationsApi.hostelStudents(activeHostelId && activeHostelId !== 'ALL' ? { hostelId: activeHostelId } : undefined),
    enabled: isSecurity ? !!activeHostelId : true,
    retry: 1,
  });
  const hostelStudents: any[] = (studentsData?.data as any)?.data || [];

  // Selected student details for preview
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return hostelStudents.find((s: any) => s.id === selectedStudentId) || null;
  }, [selectedStudentId, hostelStudents]);

  // 3. Fetch visitor records
  const { data: visitorsData, isLoading: isLoadingVisitors } = useQuery({
    queryKey: ['visitors', selectedHostel, selectedDate],
    queryFn: () => operationsApi.visitors({
      hostelId: selectedHostel && selectedHostel !== 'ALL' ? selectedHostel : undefined,
      date: selectedDate || undefined,
    }),
    retry: 1,
  });
  const visitors: any[] = (visitorsData?.data as any)?.data || [];

  // Filter visitors by local search term
  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return visitors;
    const q = searchQuery.toLowerCase();
    return visitors.filter((v: any) => {
      const vName = (v.visitorName || '').toLowerCase();
      const sName = `${v.student?.user?.firstName || ''} ${v.student?.user?.lastName || ''}`.toLowerCase();
      const usn = (v.student?.usn || '').toLowerCase();
      const room = (v.student?.roomAllocations?.[0]?.room?.roomNumber || '').toLowerCase();
      const rel = (v.relationship || '').toLowerCase();
      return vName.includes(q) || sName.includes(q) || usn.includes(q) || room.includes(q) || rel.includes(q);
    });
  }, [visitors, searchQuery]);

  // 4. Create visitor mutation
  const createMutation = useMutation({
    mutationFn: operationsApi.createVisitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      setVisitorName('');
      setSelectedStudentId('');
      setRelationship('Father');
      setFormMessage({ type: 'success', text: 'Visitor registered successfully!' });
      setTimeout(() => setFormMessage(null), 4000);
    },
    onError: (err: any) => {
      setFormMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to register visitor. Please try again.',
      });
      setTimeout(() => setFormMessage(null), 4000);
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      setFormMessage({ type: 'error', text: 'Please enter visitor name.' });
      return;
    }
    if (!selectedStudentId) {
      setFormMessage({ type: 'error', text: 'Please select a visiting student.' });
      return;
    }

    createMutation.mutate({
      visitorName: visitorName.trim(),
      relationship,
      studentId: selectedStudentId,
      purpose: 'Campus Visit',
    });
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.875rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title={isSecurity ? 'Visitor Management' : 'Visitor Register'}
        description={
          isSecurity
            ? 'Register incoming campus visitors and maintain gate entry records'
            : isWarden
              ? 'View and filter visitor entries for your assigned hostel(s)'
              : 'Complete campus visitor entries and gate access logs'
        }
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Visitors' }]}
        actions={
          isSecurity && (user as any)?.assignedHostel?.name ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.45rem 0.875rem', borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              border: '1px solid rgba(59,130,246,0.25)',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              fontSize: '0.8125rem', fontWeight: 600,
            }}>
              <Building2 style={{ width: '0.9375rem', height: '0.9375rem' }} />
              <span>Assigned: <strong>{(user as any).assignedHostel.name}</strong></span>
            </div>
          ) : undefined
        }
      />

      {/* ─── 1. SECURITY VISITOR ENTRY FORM ─── */}
      {isSecurity && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UserPlus style={{ width: '1.125rem', height: '1.125rem', color: '#8b5cf6' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Register Visitor Entry
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.125rem 0 0' }}>
                  Enter visitor details and select student to automatically fetch room and hostel
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {/* Field 1: Visitor Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Visitor Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Field 2: Relationship */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Relationship with Student <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  style={inputStyle}
                >
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              {/* Field 3: Visiting Student (Searchable Dropdown) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Visiting Student <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  style={inputStyle}
                  disabled={isLoadingStudents || hostelStudents.length === 0}
                >
                  <option value="">
                    {isLoadingStudents
                      ? 'Loading hostel students...'
                      : hostelStudents.length === 0
                        ? 'No active students in assigned hostel'
                        : 'Select Visiting Student'}
                  </option>
                  {hostelStudents.map((s: any) => {
                    const fullName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Student';
                    const roomNo = s.roomAllocations?.[0]?.room?.roomNumber ? ` (Room ${s.roomAllocations[0].room.roomNumber})` : '';
                    const usn = s.usn ? ` [${s.usn}]` : '';
                    return (
                      <option key={s.id} value={s.id}>
                        {fullName}{usn}{roomNo}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Auto-populated Student & Location Details Preview Card */}
            {selectedStudent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '0.625rem',
                  backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase' }}>
                    Student Name
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                    {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    USN: {selectedStudent.usn || 'N/A'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase' }}>
                    Allocated Room
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                    {selectedStudent.roomAllocations?.[0]?.room?.roomNumber
                      ? `Room ${selectedStudent.roomAllocations[0].room.roomNumber}`
                      : 'No Room Allocated'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Bed #{selectedStudent.roomAllocations?.[0]?.bedNumber || '—'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase' }}>
                    Hostel Location
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                    {selectedStudent.roomAllocations?.[0]?.room?.floor?.block?.hostel?.name || (user as any)?.assignedHostel?.name || 'Assigned Block'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {selectedStudent.roomAllocations?.[0]?.room?.floor?.block?.name || 'Main Block'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: isDark ? '#93c5fd' : '#2563eb', textTransform: 'uppercase' }}>
                    Check-in Time
                  </span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#16a34a', marginTop: '0.125rem' }}>
                    Auto-Timestamp (Now)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Alert / Feedback message */}
            {formMessage && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                backgroundColor: formMessage.type === 'success' ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2'),
                color: formMessage.type === 'success' ? '#16a34a' : '#dc2626',
                border: formMessage.type === 'success' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)',
              }}>
                {formMessage.text}
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={createMutation.isPending || !selectedStudentId || !visitorName.trim()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.375rem', borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #1e40af, #2563eb)',
                  color: 'white', fontSize: '0.875rem', fontWeight: 700,
                  border: 'none', cursor: createMutation.isPending || !selectedStudentId ? 'not-allowed' : 'pointer',
                  opacity: createMutation.isPending || !selectedStudentId || !visitorName.trim() ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                }}
              >
                <UserPlus style={{ width: '1rem', height: '1rem' }} />
                <span>{createMutation.isPending ? 'Registering...' : 'Register Visitor'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ─── 2. FILTER CONTROLS BAR (For All Roles) ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'center', flex: 1 }}>
            {/* Hostel Selector (Admin & Warden) */}
            {(isAdmin || (isWarden && availableHostels.length > 1)) && (
              <div style={{ minWidth: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Hostel
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                  <select
                    value={selectedHostel}
                    onChange={(e) => setSelectedHostel(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '2.125rem' }}
                  >
                    {isAdmin && <option value="ALL">All Hostels</option>}
                    {availableHostels.map((h: any) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date Filter */}
            <div style={{ minWidth: '160px' }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Filter by Date
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Calendar style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.125rem' }}
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('')}
                    title="Clear date filter"
                    style={{
                      position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    <X style={{ width: '0.875rem', height: '0.875rem' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: '220px', flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Search
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search visitor, student, USN, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '2.125rem' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}
                  >
                    <X style={{ width: '0.875rem', height: '0.875rem' }} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', alignSelf: 'flex-end', paddingBottom: '0.25rem' }}>
            {filteredVisitors.length} record{filteredVisitors.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </motion.div>

      {/* ─── 3. VISITOR REGISTER TABLE ─── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={cardStyle}>
        <div style={{
          padding: '1.125rem 1.5rem',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Visitor Register
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Official record of campus visitors and entry timestamps
            </p>
          </div>
        </div>

        {isLoadingVisitors ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading visitor records...
          </div>
        ) : filteredVisitors.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Visitor Name</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Relationship</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Visiting Student</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Room No.</th>
                  {isAdmin && (
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Hostel</th>
                  )}
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Entry Time</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((v: any, i: number) => {
                  const studentName = v.student?.user ? `${v.student.user.firstName} ${v.student.user.lastName}` : 'Student';
                  const usn = v.student?.usn || '—';
                  const roomNo = v.student?.roomAllocations?.[0]?.room?.roomNumber
                    ? `Room ${v.student.roomAllocations[0].room.roomNumber}`
                    : '—';
                  const hostelName = v.student?.roomAllocations?.[0]?.room?.floor?.block?.hostel?.name || '—';
                  const entryDate = v.checkInTime || v.createdAt;

                  return (
                    <tr
                      key={v.id || i}
                      style={{
                        borderBottom: i < filteredVisitors.length - 1 ? '1px solid var(--border-primary)' : 'none',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Visitor Name */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{
                            width: '2rem', height: '2rem', borderRadius: '50%',
                            backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff',
                            color: isDark ? '#a78bfa' : '#7c3aed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                          }}>
                            {(v.visitorName?.[0] || 'V').toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {v.visitorName}
                          </span>
                        </div>
                      </td>

                      {/* Relationship */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem', borderRadius: '0.375rem',
                          backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
                          color: isDark ? '#93c5fd' : '#1d4ed8',
                          fontSize: '0.75rem', fontWeight: 600,
                        }}>
                          {v.relationship || 'Visitor'}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {studentName}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            USN: {usn}
                          </div>
                        </div>
                      </td>

                      {/* Room No. */}
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {roomNo}
                      </td>

                      {/* Hostel (Admin only) */}
                      {isAdmin && (
                        <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                          {hostelName}
                        </td>
                      )}

                      {/* Date */}
                      <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {entryDate ? new Date(entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      {/* Entry Time */}
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {entryDate ? new Date(entryDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <StatusBadge status={v.status || 'CHECKED_IN'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No visitor records found"
            description={
              searchQuery || selectedDate
                ? 'No visitor entries match your current search or date filter.'
                : 'No visitors have been registered for this hostel yet.'
            }
          />
        )}
      </motion.div>
    </div>
  );
}
