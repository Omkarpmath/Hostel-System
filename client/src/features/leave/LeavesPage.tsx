import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { operationsApi } from '@/api/operations.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  ClipboardList, Plus, X, Calendar, Clock, User, MessageSquare,
  CheckCircle2, XCircle, Loader2, AlertCircle, ChevronRight,
  Search, Home, HeartPulse, AlertTriangle, FileText,
  BedDouble, ArrowRight, ShieldCheck, Building2,
} from 'lucide-react';
import { hostelApi } from '@/api/hostel.api';

const formatDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatTime = (d?: string | Date) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

const calculateDuration = (from?: string, to?: string) => {
  if (!from || !to) return null;
  const start = new Date(from);
  const end = new Date(to);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return null;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays === 1 ? '1 Day' : `${diffDays} Days`;
};

const LEAVE_TYPES = [
  { id: 'HOME_LEAVE', label: 'Home Leave', icon: Home, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', desc: 'Visiting home / hometown' },
  { id: 'MEDICAL', label: 'Medical Leave', icon: HeartPulse, color: '#ec4899', bg: 'rgba(236,72,153,0.12)', desc: 'Doctor visit or recovery' },
  { id: 'EMERGENCY', label: 'Emergency Leave', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Urgent family / personal matter' },
  { id: 'OTHER', label: 'Other Leave', icon: FileText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', desc: 'Academic, event or other reasons' },
];

export function LeavesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedHostel, setSelectedHostel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingLeave, setRejectingLeave] = useState<any | null>(null);

  const canFilterHostel = user?.role === 'ADMIN' || user?.role === 'WARDEN';

  // Fetch available hostels for filter
  const { data: hostelsData } = useQuery({
    queryKey: ['hostels-list'],
    queryFn: () => hostelApi.getAll(),
    enabled: canFilterHostel,
  });
  const availableHostels: any[] = (hostelsData?.data as any)?.data || [];

  const { data, isLoading, isError, error } = useQuery<any>({
    queryKey: ['leaves', selectedHostel],
    queryFn: () => operationsApi.leaves({ hostelId: selectedHostel !== 'ALL' ? selectedHostel : undefined }),
    retry: 1,
  });
  const leaves: any[] = (data?.data as any)?.data || [];

  const canAdd = user?.role === 'STUDENT';
  const canDecide = user?.role === 'WARDEN' || user?.role === 'ADMIN';

  const decide = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: ({ id, data }) => operationsApi.decideLeave(id, data) as any,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      setRejectingLeave(null);
    },
  });

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // Status filter
      if (statusFilter !== 'ALL' && leave.status !== statusFilter) return false;
      // Type filter
      if (typeFilter !== 'ALL' && leave.type !== typeFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const studentName = `${leave.student?.user?.firstName || ''} ${leave.student?.user?.lastName || ''}`.toLowerCase();
        const usn = (leave.student?.usn || '').toLowerCase();
        const reason = (leave.reason || '').toLowerCase();
        const typeStr = (leave.type || '').toLowerCase();
        return (
          studentName.includes(query) ||
          usn.includes(query) ||
          reason.includes(query) ||
          typeStr.includes(query)
        );
      }
      return true;
    });
  }, [leaves, statusFilter, typeFilter, searchQuery]);

  // Counts
  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  };

  const btnPrimary: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
  };

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Leave Requests" description="" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Leave Requests' }]} />
        <EmptyState
          icon={ClipboardList}
          title="Profile Required"
          description={(error as any)?.response?.data?.message || 'Complete your student profile before submitting leave requests.'}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <PageHeader
        title="Leave Requests"
        description={`${leaves.length} request${leaves.length !== 1 ? 's' : ''} total · ${pendingCount} pending`}
        breadcrumbs={[{ label: 'Dashboard', href: user?.role === 'STUDENT' ? '/student/dashboard' : '/warden/dashboard' }, { label: 'Leave Requests' }]}
        actions={canAdd ? (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus style={{ width: '1.125rem', height: '1.125rem' }} /> New Request
          </button>
        ) : undefined}
      />

      {/* ─── Interactive Stat Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { key: 'ALL' as const, label: 'All Requests', count: leaves.length, icon: ClipboardList, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff' },
          { key: 'PENDING' as const, label: 'Pending Review', count: pendingCount, icon: Clock, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb' },
          { key: 'APPROVED' as const, label: 'Approved', count: approvedCount, icon: CheckCircle2, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4' },
          { key: 'REJECTED' as const, label: 'Rejected', count: rejectedCount, icon: XCircle, color: '#dc2626', bg: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2' },
        ].map((s) => {
          const isActive = statusFilter === s.key;
          const Icon = s.icon;
          return (
            <motion.div
              key={s.key}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              onClick={() => setStatusFilter(s.key)}
              style={{
                padding: '1.125rem 1.25rem',
                borderRadius: '1rem',
                backgroundColor: 'var(--bg-card)',
                border: `1.5px solid ${isActive ? s.color : 'var(--border-primary)'}`,
                boxShadow: isActive ? `0 4px 14px ${s.color}22` : '0 1px 3px rgba(0,0,0,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{s.label}</p>
                <p style={{ fontSize: '1.625rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</p>
              </div>
              <div style={{
                width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
                backgroundColor: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color,
              }}>
                <Icon style={{ width: '1.375rem', height: '1.375rem' }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.875rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flex: '1 1 240px',
          padding: '0.5rem 0.875rem',
          borderRadius: '0.625rem',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-primary)',
        }}>
          <Search style={{ width: '1rem', height: '1rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={canDecide ? "Search by student name, USN, reason..." : "Search leave reason or type..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              <X style={{ width: '0.875rem', height: '0.875rem' }} />
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: '0.625rem',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="HOME_LEAVE">Home Leave</option>
            <option value="MEDICAL">Medical Leave</option>
            <option value="EMERGENCY">Emergency Leave</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Hostel Filter (Admin/Warden) */}
          {canFilterHostel && availableHostels.length > 0 && (
            <select
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="ALL">All Hostels ({availableHostels.length})</option>
              {availableHostels.map((h: any) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || selectedHostel !== 'ALL' || searchQuery) && (
            <button
              onClick={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); setSelectedHostel('ALL'); setSearchQuery(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X style={{ width: '0.75rem', height: '0.75rem' }} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ─── Leave Requests List ─── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ ...cardStyle, height: '5.5rem', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filteredLeaves.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={leaves.length === 0 ? "No Leave Requests Yet" : "No Matching Leave Requests"}
          description={
            leaves.length === 0
              ? canAdd
                ? "You haven't submitted any leave requests yet. Apply using the button above."
                : "No student leave requests have been filed yet."
              : "Try adjusting your search query or filters to find what you're looking for."
          }
          action={
            leaves.length === 0 && canAdd
              ? { label: 'New Request', onClick: () => setShowForm(true) }
              : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filteredLeaves.map((leave, i) => {
            const isExpanded = expandedId === leave.id;
            const studentName = `${leave.student?.user?.firstName || ''} ${leave.student?.user?.lastName || ''}`.trim() || 'Unknown';
            const studentEmail = leave.student?.user?.email;
            const usn = leave.student?.usn;
            const activeRoom = leave.student?.roomAllocations?.find((r: any) => r.status === 'ACTIVE')?.room;
            const roomNumber = activeRoom?.roomNumber;
            const hostelName = activeRoom?.floor?.block?.hostel?.name;
            const duration = calculateDuration(leave.fromDate, leave.toDate);

            // Leave type metadata
            const typeMeta = LEAVE_TYPES.find((t) => t.id === leave.type) || LEAVE_TYPES[3];
            const TypeIcon = typeMeta.icon;

            return (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  ...cardStyle,
                  borderColor: isExpanded ? 'rgba(59,130,246,0.4)' : 'var(--border-primary)',
                  boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                  style={{
                    width: '100%',
                    padding: '1.125rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Category Squircle Icon */}
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.875rem',
                    flexShrink: 0,
                    backgroundColor: typeMeta.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: typeMeta.color,
                  }}>
                    <TypeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  </div>

                  {/* Main Information */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {typeMeta.label}
                      </span>
                      {duration && (
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                          color: 'var(--text-secondary)',
                        }}>
                          {duration}
                        </span>
                      )}
                      <StatusBadge status={leave.status} />
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginTop: '0.375rem',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      flexWrap: 'wrap',
                    }}>
                      {/* Dates */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
                        <Calendar style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                        <span>{formatDate(leave.fromDate)}</span>
                        <ArrowRight style={{ width: '0.75rem', height: '0.75rem', color: 'var(--text-muted)' }} />
                        <span>{formatDate(leave.toDate)}</span>
                      </span>

                      {/* Student (Warden/Admin view) */}
                      {canDecide && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <User style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                          {studentName} {usn ? `(${usn})` : ''}
                        </span>
                      )}

                      {/* Room info if available */}
                      {roomNumber && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <BedDouble style={{ width: '0.75rem', height: '0.75rem' }} />
                          Room {roomNumber}
                        </span>
                      )}

                      {/* Hostel info badge */}
                      {hostelName && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                          color: isDark ? '#93c5fd' : '#1d4ed8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}>
                          <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />
                          {hostelName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action / Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Quick Warden Action if Pending */}
                    {canDecide && leave.status === 'PENDING' && !isExpanded && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          decide.mutate({ id: leave.id, data: { status: 'APPROVED' } });
                        }}
                        disabled={decide.isPending}
                        title="Quick Approve"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.5rem',
                          backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
                          color: isDark ? '#4ade80' : '#15803d',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid rgba(22,163,74,0.3)',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem' }} /> Approve
                      </button>
                    )}

                    <ChevronRight style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }} />
                  </div>
                </button>

                {/* ─── Expanded Details Section ─── */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '0 1.25rem 1.25rem',
                        borderTop: '1px solid var(--border-primary)',
                        paddingTop: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                      }}>
                        {/* Student Profile Card (Warden/Admin View) */}
                        {canDecide && leave.student && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.06)' : '#f8fafc',
                            border: '1px solid var(--border-primary)',
                            flexWrap: 'wrap',
                          }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1e40af, #0d9488)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                            }}>
                              {(leave.student?.user?.firstName?.[0] || '?')}{(leave.student?.user?.lastName?.[0] || '')}
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{studentName}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{studentEmail || '—'}</p>
                            </div>
                            {usn && (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                                color: isDark ? '#93c5fd' : '#2563eb',
                              }}>
                                USN: {usn}
                              </span>
                            )}
                            {hostelName && roomNumber && (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                color: 'var(--text-secondary)',
                              }}>
                                {hostelName} · Room {roomNumber}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Reason Box */}
                        <div style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: '1px solid var(--border-primary)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                            <MessageSquare style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Purpose / Reason for Leave
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {leave.reason || 'No detailed reason provided.'}
                          </p>
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.875rem' }}>
                          <InfoBlock label="From Date" value={formatDate(leave.fromDate)} icon={Calendar} />
                          <InfoBlock label="To Date" value={formatDate(leave.toDate)} icon={Calendar} />
                          <InfoBlock label="Duration" value={duration || '—'} icon={Clock} />
                          <InfoBlock label="Applied On" value={`${formatDate(leave.createdAt)} ${formatTime(leave.createdAt)}`} icon={Calendar} />
                          {leave.approvedAt && (
                            <InfoBlock label="Decided On" value={`${formatDate(leave.approvedAt)} ${formatTime(leave.approvedAt)}`} icon={ShieldCheck} />
                          )}
                        </div>

                        {/* Status Message / Resolution Banner */}
                        {leave.status === 'APPROVED' && (
                          <div style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(13,148,136,0.08))'
                              : 'linear-gradient(135deg, #f0fdf4, #f0fdfa)',
                            border: `1px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#bbf7d0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}>
                            <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a', flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16a34a' }}>Leave Approved</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                This leave request has been officially sanctioned by the hostel administration.
                              </p>
                            </div>
                          </div>
                        )}

                        {leave.status === 'REJECTED' && (
                          <div style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(220,38,38,0.08)' : '#fef2f2',
                            border: `1px solid ${isDark ? 'rgba(220,38,38,0.25)' : '#fecaca'}`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                          }}>
                            <XCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} />
                            <div>
                              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#dc2626' }}>Leave Request Rejected</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                {leave.rejectionReason ? `Reason: ${leave.rejectionReason}` : 'No specific rejection reason provided.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {leave.status === 'PENDING' && (
                          <div style={{
                            padding: '0.875rem 1rem',
                            borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb',
                            border: `1px solid ${isDark ? 'rgba(245,158,11,0.25)' : '#fde68a'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                          }}>
                            <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b', flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f59e0b' }}>Pending Verification</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                Awaiting warden review and approval before departure.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Warden Action Buttons */}
                        {canDecide && leave.status === 'PENDING' && (
                          <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            justifyContent: 'flex-end',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border-primary)',
                          }}>
                            <button
                              onClick={() => setRejectingLeave(leave)}
                              disabled={decide.isPending}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1.125rem',
                                borderRadius: '0.625rem',
                                border: '1px solid rgba(220,38,38,0.3)',
                                backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fee2e2',
                                color: isDark ? '#fca5a5' : '#dc2626',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              <XCircle style={{ width: '0.875rem', height: '0.875rem' }} /> Reject Request
                            </button>

                            <button
                              onClick={() => decide.mutate({ id: leave.id, data: { status: 'APPROVED' } })}
                              disabled={decide.isPending}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '0.625rem',
                                border: 'none',
                                background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                                color: 'white',
                                fontSize: '0.8125rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
                              }}
                            >
                              {decide.isPending ? (
                                <Loader2 style={{ width: '0.875rem', height: '0.875rem', animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} />
                              )}
                              Approve Leave
                            </button>
                          </div>
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

      {/* ─── Rejection Reason Modal (for Warden) ─── */}
      <AnimatePresence>
        {rejectingLeave && (
          <RejectionModal
            leave={rejectingLeave}
            isPending={decide.isPending}
            onClose={() => setRejectingLeave(null)}
            onConfirm={(reason) => {
              decide.mutate({
                id: rejectingLeave.id,
                data: { status: 'REJECTED', rejectionReason: reason },
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Create Leave Modal (for Student) ─── */}
      <AnimatePresence>
        {showForm && <LeaveFormModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: '0.625rem',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
        <Icon style={{ width: '0.75rem', height: '0.75rem', color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
}

function RejectionModal({
  leave,
  isPending,
  onClose,
  onConfirm,
}: {
  leave: any;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reason, setReason] = useState('');

  const PRESETS = [
    'Insufficient reason provided',
    'Upcoming examinations / classes',
    'Parental confirmation required',
    'Attendance quota constraint',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '28rem', borderRadius: '1rem',
          border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
          boxShadow: '0 20px 25px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>Reject {leave?.type?.replace('_', ' ') || 'Leave'} Request</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Specify the reason for declining this application
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X style={{ width: '1.125rem', height: '1.125rem' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Presets */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
              Quick Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setReason(p)}
                  style={{
                    padding: '0.3125rem 0.625rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-primary)',
                    backgroundColor: reason === p ? (isDark ? 'rgba(220,38,38,0.2)' : '#fee2e2') : 'var(--bg-secondary)',
                    color: reason === p ? '#dc2626' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem', display: 'block' }}>
              Rejection Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason explaining why this leave is rejected..."
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(reason || 'Request rejected by warden')}
              disabled={isPending || !reason.trim()}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.625rem',
                border: 'none', backgroundColor: '#dc2626', color: 'white',
                fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                opacity: isPending || !reason.trim() ? 0.5 : 1,
              }}
            >
              {isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LeaveFormModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('HOME_LEAVE');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const duration = calculateDuration(fromDate, toDate);

  const mutation = useMutation({
    mutationFn: (data: any) => operationsApi.createLeave(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] });
      onClose();
    },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to submit leave request.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      setError('Please select both from and to dates.');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setError('To date cannot be earlier than From date.');
      return;
    }
    mutation.mutate({
      type: selectedType,
      fromDate,
      toDate,
      reason,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(5px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '32rem',
          borderRadius: '1.25rem',
          border: '1px solid var(--border-primary)',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '0 25px 35px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-primary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #1e40af, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <Calendar style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>New Leave Application</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fill in the details for warden approval</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2',
              color: isDark ? '#fca5a5' : '#dc2626',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Leave Type Selector Grid */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
              Select Leave Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              {LEAVE_TYPES.map((t) => {
                const isSelected = selectedType === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      border: `1.5px solid ${isSelected ? t.color : 'var(--border-primary)'}`,
                      backgroundColor: isSelected ? (isDark ? `${t.color}22` : t.bg) : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '0.5rem',
                      backgroundColor: t.bg, color: t.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon style={{ width: '1rem', height: '1rem' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? t.color : 'var(--text-primary)' }}>{t.label}</p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem', lineHeight: 1.2 }}>{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Duration Indicator */}
          {duration && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              fontSize: '0.8125rem',
              fontWeight: 700,
            }}>
              <Clock style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>Calculated Duration: {duration}</span>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
              Reason & Destination Address
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the purpose of your leave and where you will be staying..."
              style={{ ...inputStyle, resize: 'none' }}
              required
            />
          </div>

          {/* Actions */}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              style={{
                flex: 1.5, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
                color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                opacity: mutation.isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
