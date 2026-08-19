import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { operationsApi } from '@/api/operations.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  CreditCard, ChevronRight, User, Calendar, Building2,
  BedDouble, Receipt, IndianRupee, Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = (v?: number | string) => {
  if (v == null) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return `₹${n.toLocaleString('en-IN')}`;
};

export function FeesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isStudent = user?.role === 'STUDENT';

  const { data, isLoading, isError, error } = useQuery<any>({
    queryKey: ['fees'],
    queryFn: operationsApi.fees,
    retry: 1,
  });
  const fees: any[] = (data?.data as any)?.data || [];

  const totalPaid = fees.filter((f) => f.status === 'PAID').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const totalPending = fees.filter((f) => f.status === 'PENDING').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const paidCount = fees.filter((f) => f.status === 'PAID').length;
  const pendingCount = fees.filter((f) => f.status === 'PENDING').length;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  };

  if (isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Fee Records" description="" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Fees' }]} />
        <EmptyState icon={CreditCard} title="Profile required" description={(error as any)?.response?.data?.message || 'Complete your profile to view fee records.'} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Fee Records"
        description={`${fees.length} record${fees.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Fees' }]}
      />

      {/* Summary Cards */}
      {fees.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Collected', value: money(totalPaid), sub: `${paidCount} payment${paidCount !== 1 ? 's' : ''}`, color: '#16a34a', bg: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', icon: CheckCircle2 },
            { label: 'Pending Amount', value: money(totalPending), sub: `${pendingCount} pending`, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', icon: Clock },
            { label: 'Total Records', value: String(fees.length), sub: 'all fee entries', color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', icon: CreditCard },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
              padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: s.bg,
              border: `1px solid ${isDark ? `${s.color}33` : `${s.color}22`}`,
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <s.icon style={{ width: '1.5rem', height: '1.5rem', color: s.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: s.color, opacity: 0.8, marginTop: '0.125rem' }}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Fee Records */}
      {fees.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No fee records"
          description={isStudent ? 'Your fee records will appear here once generated.' : 'No fee records found in the system.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {fees.map((fee, i) => {
            const isExpanded = expandedId === fee.id;
            const studentName = `${fee.student?.user?.firstName || ''} ${fee.student?.user?.lastName || ''}`.trim() || 'Unknown';
            const studentEmail = fee.student?.user?.email || '—';
            const isPaid = fee.status === 'PAID';
            const hostel = fee.allocation?.room?.floor?.block?.hostel?.name;
            const roomNum = fee.allocation?.room?.roomNumber;

            return (
              <motion.div
                key={fee.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={cardStyle}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : fee.id)}
                  style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {/* Status Icon */}
                  <div style={{
                    width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', flexShrink: 0,
                    backgroundColor: isPaid
                      ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                      : fee.status === 'FAILED'
                        ? (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2')
                        : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isPaid
                      ? <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                      : fee.status === 'FAILED'
                        ? <XCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626' }} />
                        : <Clock style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />}
                  </div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {money(fee.amount)}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        textTransform: 'uppercase',
                      }}>
                        {fee.type?.replace('_', ' ') || 'FEE'}
                      </span>
                      <StatusBadge status={fee.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {!isStudent && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <User style={{ width: '0.75rem', height: '0.75rem' }} />{studentName}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar style={{ width: '0.75rem', height: '0.75rem' }} />
                        Due: {fmt(fee.dueDate)}
                      </span>
                      {isPaid && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isDark ? '#4ade80' : '#15803d', fontWeight: 600 }}>
                          <CheckCircle2 style={{ width: '0.75rem', height: '0.75rem' }} />
                          Paid: {fmt(fee.paidAt)}
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
                        {/* Student Info Card (for admin/warden/accountant) */}
                        {!isStudent && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                            borderRadius: '0.75rem', marginBottom: '1.25rem',
                            backgroundColor: isDark ? 'rgba(59,130,246,0.05)' : '#f8fafc',
                            border: '1px solid var(--border-primary)',
                          }}>
                            <div style={{
                              width: '2.75rem', height: '2.75rem', borderRadius: '50%', flexShrink: 0,
                              background: 'linear-gradient(135deg, #1e40af, #0d9488)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: '0.75rem', fontWeight: 800,
                            }}>
                              {(fee.student?.user?.firstName?.[0] || '?')}{(fee.student?.user?.lastName?.[0] || '')}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{studentName}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{studentEmail}</p>
                            </div>
                            {fee.student?.usn && (
                              <span style={{
                                fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace',
                                padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                                backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                                color: isDark ? '#60a5fa' : '#2563eb',
                              }}>{fee.student.usn}</span>
                            )}
                          </div>
                        )}

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                          <InfoBlock label="Fee Type" value={fee.type?.replace('_', ' ') || '—'} icon={CreditCard} />
                          <InfoBlock label="Amount" value={money(fee.amount)} icon={IndianRupee} />
                          <InfoBlock label="Status" value={fee.status} icon={isPaid ? CheckCircle2 : Clock} />
                          <InfoBlock label="Due Date" value={fmt(fee.dueDate)} icon={Calendar} />
                          {fee.paidAt && <InfoBlock label="Paid Date" value={fmt(fee.paidAt)} icon={Calendar} />}
                          {fee.paymentMethod && <InfoBlock label="Payment Method" value={fee.paymentMethod} icon={CreditCard} />}
                          {fee.transactionId && <InfoBlock label="Transaction ID" value={fee.transactionId} icon={Receipt} />}
                          {fee.receiptNumber && <InfoBlock label="Receipt No." value={fee.receiptNumber} icon={Receipt} />}
                          {hostel && <InfoBlock label="Hostel" value={hostel} icon={Building2} />}
                          {roomNum && <InfoBlock label="Room" value={roomNum} icon={BedDouble} />}
                        </div>

                        {/* Payment Timeline */}
                        {isPaid && (
                          <div style={{
                            marginTop: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(22,163,74,0.05), rgba(13,148,136,0.05))'
                              : 'linear-gradient(135deg, #f0fdf4, #f0fdfa)',
                            border: `1px solid ${isDark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16a34a' }}>Payment Confirmed</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                              {money(fee.amount)} was paid on {fmt(fee.paidAt)}
                              {fee.paymentMethod ? ` via ${fee.paymentMethod}` : ''}
                              {fee.transactionId ? `. Transaction: ${fee.transactionId}` : ''}
                              {!isStudent ? ` by ${studentName}` : ''}
                            </p>
                          </div>
                        )}

                        {fee.status === 'PENDING' && (
                          <div style={{
                            marginTop: '1.25rem', padding: '1rem', borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(245,158,11,0.05)' : '#fffbeb',
                            border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <AlertCircle style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f59e0b' }}>Payment Pending</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
                              {money(fee.amount)} due by {fmt(fee.dueDate)}
                            </p>
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
