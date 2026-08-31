import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { operationsApi } from '@/api/operations.api';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  CreditCard, CircleDollarSign, IndianRupee, Clock,
  CheckCircle2, AlertCircle, ArrowRight, Building2,
  UtensilsCrossed, ArrowUpRight,
} from 'lucide-react';

const formatINR = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export function AccountantDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fetch all fees
  const { data: feesData } = useQuery({
    queryKey: ['fees'],
    queryFn: () => operationsApi.fees(),
    retry: 1,
  });

  const fees: any[] = (feesData?.data as any)?.data || [];

  // Calculate financial statistics
  const totalPaid = fees
    .filter((f) => f.status === 'PAID')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const totalPending = fees
    .filter((f) => f.status === 'PENDING')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const paidCount = fees.filter((f) => f.status === 'PAID').length;
  const pendingCount = fees.filter((f) => f.status === 'PENDING').length;
  const totalRecords = fees.length;
  const collectionRate = totalRecords > 0 ? Math.round((paidCount / totalRecords) * 100) : 0;

  const hostelFeePaid = fees
    .filter((f) => f.type === 'HOSTEL_FEE' && f.status === 'PAID')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const messFeePaid = fees
    .filter((f) => f.type === 'MESS_FEE' && f.status === 'PAID')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.875rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Accountant Dashboard"
        description="Fee collection tracking, outstanding student dues, and financial summaries"
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <Link
            to="/accountant/fees"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.55rem 1.125rem', borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #1e40af, #2563eb)', color: 'white',
              fontSize: '0.8125rem', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            }}
          >
            <CreditCard style={{ width: '0.875rem', height: '0.875rem' }} />
            Fee Management
          </Link>
        }
      />

      {/* Modern Compact Financial Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {/* Card 1: Total Collected */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Fee Collected
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.375rem', lineHeight: 1.2 }}>
                {formatINR(totalPaid)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                {collectionRate}% clearance rate
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CircleDollarSign style={{ width: '1.125rem', height: '1.125rem', color: '#16a34a' }} />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Outstanding Dues */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Outstanding Dues
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '0.375rem', lineHeight: 1.2 }}>
                {formatINR(totalPending)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                Unpaid student records
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Clock style={{ width: '1.125rem', height: '1.125rem', color: '#d97706' }} />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Cleared Payments Count */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cleared Payments
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.375rem', lineHeight: 1.2 }}>
                {paidCount} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {totalRecords}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.375rem', fontWeight: 600 }}>
                Verified transactions
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <CheckCircle2 style={{ width: '1.125rem', height: '1.125rem', color: '#2563eb' }} />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Pending Clearances Count */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Clearances
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: pendingCount > 0 ? '#dc2626' : 'var(--text-primary)', marginTop: '0.375rem', lineHeight: 1.2 }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
                Awaiting student payment
              </div>
            </div>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AlertCircle style={{ width: '1.125rem', height: '1.125rem', color: '#dc2626' }} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fee Category Breakdown Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Hostel Fee Collection Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 style={{ width: '1.375rem', height: '1.375rem', color: '#2563eb' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Hostel Fee Collected
              </div>
              <div style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                {formatINR(hostelFeePaid)}
              </div>
            </div>
            <Link
              to="/accountant/fees"
              style={{
                color: '#2563eb', fontSize: '0.75rem', fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.125rem',
              }}
            >
              <span>View</span>
              <ArrowUpRight style={{ width: '0.875rem', height: '0.875rem' }} />
            </Link>
          </div>
        </motion.div>

        {/* Mess Fee Collection Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={cardStyle}>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(13,148,136,0.15)' : '#f0fdfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <UtensilsCrossed style={{ width: '1.375rem', height: '1.375rem', color: '#0d9488' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Mess Fee Collected
              </div>
              <div style={{ fontSize: '1.1875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                {formatINR(messFeePaid)}
              </div>
            </div>
            <Link
              to="/accountant/fees"
              style={{
                color: '#0d9488', fontSize: '0.75rem', fontWeight: 700,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.125rem',
              }}
            >
              <span>View</span>
              <ArrowUpRight style={{ width: '0.875rem', height: '0.875rem' }} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={cardStyle}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Recent Payment Transactions
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Latest fee collection records across all hostels
            </p>
          </div>
          <Link
            to="/accountant/fees"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <span>View All Records</span>
            <ArrowRight style={{ width: '0.75rem', height: '0.75rem' }} />
          </Link>
        </div>

        {fees.length > 0 ? (
          <div style={{ padding: 0 }}>
            {fees.slice(0, 8).map((f: any, i: number) => {
              const studentName = f.student?.user ? `${f.student.user.firstName} ${f.student.user.lastName}` : 'Student';
              const usn = f.student?.usn || 'N/A';
              const isPaid = f.status === 'PAID';

              return (
                <div
                  key={f.id || i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1.25rem', flexWrap: 'wrap', gap: '0.75rem',
                    borderBottom: i < Math.min(fees.length, 8) - 1 ? '1px solid var(--border-primary)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '2rem', height: '2rem', borderRadius: '50%',
                      backgroundColor: isPaid
                        ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                        : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isPaid ? '#16a34a' : '#f59e0b',
                    }}>
                      <IndianRupee style={{ width: '0.875rem', height: '0.875rem' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {studentName}
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: '0.0625rem 0 0' }}>
                        USN: {usn} · {f.type === 'HOSTEL_FEE' ? 'Hostel Fee' : 'Mess Fee'} · Due: {new Date(f.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatINR(parseFloat(f.amount || 0))}
                      </div>
                      <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                        {f.paymentMethod ? f.paymentMethod.toUpperCase() : 'ONLINE'}
                      </div>
                    </div>
                    <StatusBadge status={f.status || 'PENDING'} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={CreditCard}
            title="No payment records yet"
            description="Student fee records and payments will appear here."
          />
        )}
      </motion.div>
    </div>
  );
}


