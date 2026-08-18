import { useState } from 'react';
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
} from 'lucide-react';

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function LeavesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isError, error } = useQuery<any>({
    queryKey: ['leaves'],
    queryFn: operationsApi.leaves,
    retry: 1,
  });
  const leaves: any[] = (data?.data as any)?.data || [];

  const canAdd = user?.role === 'STUDENT';
  const canDecide = user?.role === 'WARDEN' || user?.role === 'ADMIN';

  const decide = useMutation<any, Error, { id: string; data: any }>({
    mutationFn: ({ id, data }) => operationsApi.decideLeave(id, data) as any,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
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

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Leave Requests" description="" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Leave Requests' }]} />
        <EmptyState icon={ClipboardList} title="Profile required" description={(error as any)?.response?.data?.message || 'Complete your student profile before submitting leave requests.'} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Leave Requests"
        description={`${leaves.length} request${leaves.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Leave Requests' }]}
        actions={canAdd ? (
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus style={{ width: '1rem', height: '1rem' }} /> New Request
          </button>
        ) : undefined}
      />

      {/* Summary Cards */}
      {leaves.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Pending', count: leaves.filter((l) => l.status === 'PENDING').length, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb' },
            { label: 'Approved', count: leaves.filter((l) => l.status === 'APPROVED').length, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4' },
            { label: 'Rejected', count: leaves.filter((l) => l.status === 'REJECTED').length, color: '#dc2626', bg: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '1rem 1.25rem', borderRadius: '0.875rem', backgroundColor: s.bg,
              border: `1px solid ${isDark ? `${s.color}33` : `${s.color}22`}`,
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.count}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, opacity: 0.8, marginTop: '0.125rem' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave Cards */}
      {leaves.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No leave requests"
          description={canAdd ? 'Submit your first leave request using the button above.' : 'No leave requests have been submitted yet.'}
          action={canAdd ? { label: 'New Request', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {leaves.map((leave, i) => {
            const isExpanded = expandedId === leave.id;
            const studentName = `${leave.student?.user?.firstName || ''} ${leave.student?.user?.lastName || ''}`.trim() || 'Unknown';
            return (
              <motion.div
                key={leave.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={cardStyle}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : leave.id)}
                  style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', flexShrink: 0,
                    backgroundColor: leave.status === 'APPROVED' ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                      : leave.status === 'REJECTED' ? (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2')
                      : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {leave.status === 'APPROVED' ? <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                      : leave.status === 'REJECTED' ? <XCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
                      : <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {leave.type?.replace('_', ' ') || 'Leave'}
                      </span>
                      <StatusBadge status={leave.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {canDecide && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User style={{ width: '0.75rem', height: '0.75rem' }} />{studentName}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar style={{ width: '0.75rem', height: '0.75rem' }} />
                        {formatDate(leave.fromDate)} → {formatDate(leave.toDate)}
                      </span>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <InfoBlock label="Reason" value={leave.reason || '—'} icon={MessageSquare} />
                          <InfoBlock label="From" value={formatDate(leave.fromDate)} icon={Calendar} />
                          <InfoBlock label="To" value={formatDate(leave.toDate)} icon={Calendar} />
                          <InfoBlock label="Status" value={leave.status} icon={Clock} />
                          {leave.rejectionReason && <InfoBlock label="Rejection Reason" value={leave.rejectionReason} icon={XCircle} />}
                        </div>

                        {/* Warden/Admin actions */}
                        {canDecide && leave.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => decide.mutate({ id: leave.id, data: { status: 'APPROVED' } })}
                              disabled={decide.isPending}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem',
                                borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
                                color: isDark ? '#4ade80' : '#15803d', fontSize: '0.8125rem', fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) decide.mutate({ id: leave.id, data: { status: 'REJECTED', rejectionReason: reason } });
                              }}
                              disabled={decide.isPending}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem',
                                borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2',
                                color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.8125rem', fontWeight: 700,
                              }}
                            >
                              <XCircle style={{ width: '0.875rem', height: '0.875rem' }} /> Reject
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

      {/* Create Leave Modal */}
      <AnimatePresence>
        {showForm && <LeaveFormModal onClose={() => setShowForm(false)} />}
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

function LeaveFormModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const qc = useQueryClient();
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (form: FormData) => {
      const body = Object.fromEntries(form.entries());
      return operationsApi.createLeave(body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaves'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Failed to submit leave request.'),
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--overlay)' }}
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '28rem', borderRadius: '1rem', border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>New Leave Request</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Submit a leave application</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }} />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}
          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '0.875rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem' }} />{error}
            </div>
          )}
          <div>
            <label style={labelStyle}>Leave Type</label>
            <select name="type" style={inputStyle} required>
              <option value="HOME_LEAVE">Home Leave</option>
              <option value="MEDICAL">Medical</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={labelStyle}>From Date</label><input type="date" name="fromDate" style={inputStyle} required /></div>
            <div><label style={labelStyle}>To Date</label><input type="date" name="toDate" style={inputStyle} required /></div>
          </div>
          <div><label style={labelStyle}>Reason</label><textarea name="reason" rows={3} placeholder="Why do you need leave?" style={{ ...inputStyle, resize: 'none' }} required /></div>
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-primary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={mutation.isPending} style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
              color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              opacity: mutation.isPending ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: 'inherit',
            }}>
              {mutation.isPending ? <><Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />Submitting...</> : 'Submit Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
