import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { operationsApi } from '@/api/operations.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import {
  CreditCard, ChevronRight, User, Calendar, Building2,
  BedDouble, Receipt, IndianRupee, Clock, CheckCircle2,
  Download, Search, UtensilsCrossed, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { hostelApi } from '@/api/hostel.api';

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = (v?: number | string) => {
  if (v == null) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return `₹${n.toLocaleString('en-IN')}`;
};

function InfoBlock({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div style={{
      padding: '0.75rem 1rem', borderRadius: '0.625rem',
      backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        <Icon style={{ width: '0.75rem', height: '0.75rem' }} />
        <span>{label}</span>
      </div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

export function FeesPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'HOSTEL_FEE' | 'MESS_FEE'>('HOSTEL_FEE');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isStudent = user?.role === 'STUDENT';
  const canFilterHostel = !isStudent;
  const [selectedHostel, setSelectedHostel] = useState<string>('ALL');

  const { data: hostelsData } = useQuery({
    queryKey: ['hostels-list'],
    queryFn: () => hostelApi.getAll(),
    enabled: canFilterHostel,
  });
  const availableHostels: any[] = (hostelsData?.data as any)?.data || [];

  const handleDownloadReceipt = async (feeId: string, receiptNumber?: string) => {
    try {
      setDownloadingId(feeId);
      const res = await operationsApi.downloadReceipt(feeId);
      const blob = new Blob([res.data as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fee_Receipt_${receiptNumber || feeId}.pdf`;
      a.target = '_blank';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      alert('Failed to download receipt PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const { data, isError, error } = useQuery<any>({
    queryKey: ['fees', selectedHostel],
    queryFn: () => operationsApi.fees({ hostelId: selectedHostel !== 'ALL' ? selectedHostel : undefined }),
    retry: 1,
  });
  const allFees: any[] = (data?.data as any)?.data || [];

  // Filter fees by active tab (for staff)
  const tabFees = isStudent ? allFees : allFees.filter((f) => f.type === activeTab);

  // Search filter
  const fees = tabFees.filter((f) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const studentName = `${f.student?.user?.firstName || ''} ${f.student?.user?.lastName || ''}`.toLowerCase();
    const usn = (f.student?.usn || '').toLowerCase();
    const receipt = (f.receiptNumber || '').toLowerCase();
    const room = (f.allocation?.room?.roomNumber || '').toLowerCase();
    return studentName.includes(term) || usn.includes(term) || receipt.includes(term) || room.includes(term);
  });

  const totalPaid = fees.filter((f) => f.status === 'PAID').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const totalPending = fees.filter((f) => f.status === 'PENDING').reduce((s, f) => s + parseFloat(f.amount || 0), 0);
  const paidCount = fees.filter((f) => f.status === 'PAID').length;
  const pendingCount = fees.filter((f) => f.status === 'PENDING').length;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
        title={isStudent ? 'My Fee Records' : 'Fee Records & Invoices'}
        description={isStudent ? 'Official records of hostel accommodation and mess dining payments' : `${fees.length} verified fee ledger record${fees.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Fees' }]}
      />

      {/* ─── 1. Financial Overview Summary Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Total Collected / Paid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            padding: '1.5rem',
            background: isDark
              ? 'linear-gradient(135deg, rgba(22,163,74,0.15) 0%, rgba(15,23,42,0.6) 100%)'
              : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            border: `1px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#bbf7d0'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#16a34a' }}>
              {isStudent ? 'Total Fees Cleared' : 'Total Amount Collected'}
            </span>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(22,163,74,0.2)' : '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
            {money(totalPaid)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {paidCount} successful transaction{paidCount !== 1 ? 's' : ''} verified
          </p>
        </motion.div>

        {/* Pending Outstanding Dues */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            ...cardStyle,
            padding: '1.5rem',
            background: totalPending > 0
              ? (isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(15,23,42,0.6) 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)')
              : (isDark ? 'rgba(255,255,255,0.02)' : 'white'),
            border: `1px solid ${totalPending > 0 ? (isDark ? 'rgba(245,158,11,0.3)' : '#fde68a') : 'var(--border-primary)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: totalPending > 0 ? '#d97706' : 'var(--text-secondary)' }}>
              {isStudent ? 'Outstanding Balance' : 'Pending Receivables'}
            </span>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', backgroundColor: totalPending > 0 ? (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7') : 'var(--bg-secondary)', color: totalPending > 0 ? '#d97706' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: totalPending > 0 ? '#d97706' : 'var(--text-primary)', lineHeight: 1 }}>
            {money(totalPending)}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {pendingCount > 0 ? `${pendingCount} invoice pending payment` : 'All dues are fully settled'}
          </p>
        </motion.div>

        {/* Total Invoices Count */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ ...cardStyle, padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Fee Records</span>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', color: isDark ? '#60a5fa' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
            {fees.length}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Academic term electronic invoices
          </p>
        </motion.div>
      </div>

      {/* ─── 2. Controls & Filter Bar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Category Tabs (For Staff) */}
        {!isStudent ? (
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', borderRadius: '0.75rem', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
            {[
              { key: 'HOSTEL_FEE' as const, label: 'Hostel Fees', icon: Building2 },
              { key: 'MESS_FEE' as const, label: 'Mess Fees', icon: UtensilsCrossed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.625rem 1.25rem', borderRadius: '0.625rem', border: 'none',
                  fontSize: '0.875rem', fontWeight: activeTab === tab.key ? 700 : 500,
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.key ? (isDark ? 'rgba(59,130,246,0.25)' : 'white') : 'transparent',
                  color: activeTab === tab.key ? (isDark ? '#93c5fd' : '#1d4ed8') : 'var(--text-secondary)',
                  boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <tab.icon style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            All Invoices & Payments
          </div>
        )}

        {/* Search & Hostel Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search student or receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none',
              }}
            />
          </div>

          {/* Hostel Filter Dropdown (Staff only) */}
          {canFilterHostel && availableHostels.length > 0 && (
            <select
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)', fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="ALL">All Hostels ({availableHostels.length})</option>
              {availableHostels.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ─── 3. Fee Records Ledger ─── */}
      {fees.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No fee records found"
          description={isStudent ? 'Your fee records will appear here once generated by the administration.' : 'No fee entries matched your search filters.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {fees.map((fee, i) => {
            const isExpanded = expandedId === fee.id;
            const studentName = `${fee.student?.user?.firstName || ''} ${fee.student?.user?.lastName || ''}`.trim() || 'Student';
            const isPaid = fee.status === 'PAID';
            const hostel = fee.allocation?.room?.floor?.block?.hostel?.name;
            const roomNum = fee.allocation?.room?.roomNumber;

            return (
              <motion.div
                key={fee.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  ...cardStyle,
                  border: isPaid
                    ? (isDark ? '1px solid rgba(22,163,74,0.25)' : '1px solid #dcfce7')
                    : '1px solid var(--border-primary)',
                }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : fee.id)}
                  style={{
                    padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '1rem', cursor: 'pointer',
                  }}
                >
                  {/* Left: Status Icon & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '3rem', height: '3rem', borderRadius: '1rem', flexShrink: 0,
                      backgroundColor: isPaid
                        ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                        : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isPaid ? (
                        <CheckCircle2 style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
                      ) : (
                        <Clock style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                          {money(fee.amount)}
                        </span>
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px',
                          backgroundColor: fee.type === 'MESS_FEE' ? (isDark ? 'rgba(168,85,247,0.2)' : '#faf5ff') : (isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff'),
                          color: fee.type === 'MESS_FEE' ? (isDark ? '#c084fc' : '#9333ea') : (isDark ? '#93c5fd' : '#2563eb'),
                          textTransform: 'uppercase',
                        }}>
                          {fee.type?.replace('_', ' ') || 'FEE'}
                        </span>
                        <StatusBadge status={fee.status} />
                      </div>

                      {/* Sub-details line */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        {!isStudent && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                            <User style={{ width: '0.8125rem', height: '0.8125rem' }} />{studentName}
                          </span>
                        )}
                        {roomNum && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <BedDouble style={{ width: '0.8125rem', height: '0.8125rem' }} />Room {roomNum}
                          </span>
                        )}
                        {hostel && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.1rem 0.5rem', borderRadius: '0.375rem',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                            color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600,
                          }}>
                            <Building2 style={{ width: '0.75rem', height: '0.75rem' }} />{hostel}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar style={{ width: '0.8125rem', height: '0.8125rem' }} />
                          Due: {fmt(fee.dueDate)}
                        </span>
                        {isPaid && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 700 }}>
                            <CheckCircle2 style={{ width: '0.8125rem', height: '0.8125rem' }} />
                            Paid: {fmt(fee.paidAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadReceipt(fee.id, fee.receiptNumber);
                        }}
                        disabled={downloadingId === fee.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.5rem 1rem', borderRadius: '0.625rem',
                          backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
                          border: '1px solid #16a34a', color: isDark ? '#4ade80' : '#15803d',
                          fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        <Download style={{ width: '0.875rem', height: '0.875rem' }} />
                        <span>{downloadingId === fee.id ? 'Generating...' : 'Receipt PDF'}</span>
                      </button>
                    ) : isStudent ? (
                      <Link
                        to={fee.type === 'MESS_FEE' ? '/student/mess-fees' : '/student/rooms'}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.5rem 1rem', borderRadius: '0.625rem',
                          backgroundColor: '#2563eb', color: 'white',
                          fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                        }}
                      >
                        <span>Pay Online</span>
                        <ArrowRight style={{ width: '0.875rem', height: '0.875rem' }} />
                      </Link>
                    ) : null}

                    <ChevronRight style={{
                      width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s',
                    }} />
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div style={{ padding: '1.25rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-primary)', backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#fafafa' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem' }}>
                          <InfoBlock label="Fee Category" value={fee.type?.replace('_', ' ') || '—'} icon={CreditCard} />
                          <InfoBlock label="Total Amount" value={money(fee.amount)} icon={IndianRupee} />
                          <InfoBlock label="Payment Status" value={fee.status} icon={isPaid ? CheckCircle2 : Clock} />
                          <InfoBlock label="Invoice Due Date" value={fmt(fee.dueDate)} icon={Calendar} />
                          {fee.paidAt && <InfoBlock label="Payment Settled Date" value={fmt(fee.paidAt)} icon={Calendar} />}
                          {fee.receiptNumber && <InfoBlock label="Official Receipt No" value={fee.receiptNumber} icon={Receipt} />}
                          {hostel && <InfoBlock label="Hostel Allocation" value={hostel} icon={Building2} />}
                          {roomNum && <InfoBlock label="Assigned Room" value={`Room ${roomNum}`} icon={BedDouble} />}
                        </div>

                        {isPaid && (
                          <div style={{
                            marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '0.75rem',
                            backgroundColor: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4',
                            border: `1px solid ${isDark ? 'rgba(22,163,74,0.25)' : '#bbf7d0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                              <ShieldCheck style={{ width: '1.25rem', height: '1.25rem', color: '#16a34a' }} />
                              <div>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#16a34a' }}>
                                  Electronic Payment Receipt Verified
                                </span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                                  Official BMSCE Hostel Administration transaction record
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(fee.id, fee.receiptNumber)}
                              disabled={downloadingId === fee.id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                padding: '0.5rem 1.125rem', borderRadius: '0.625rem',
                                backgroundColor: '#16a34a', color: 'white', border: 'none',
                                fontSize: '0.8125rem', fontWeight: 800, cursor: 'pointer',
                              }}
                            >
                              <Download style={{ width: '0.875rem', height: '0.875rem' }} />
                              Download Official PDF
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
    </div>
  );
}
