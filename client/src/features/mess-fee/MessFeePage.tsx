import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { messFeeApi } from '@/api/messFee.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { operationsApi } from '@/api/operations.api';
import { loadRazorpayScript } from '@/lib/razorpay';
import {
  UtensilsCrossed, CheckCircle2, Clock, IndianRupee,
  CreditCard, Calendar, AlertCircle, Receipt, Download,
} from 'lucide-react';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = (v?: number | string | null) => {
  if (v == null) return '—';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return `₹${n.toLocaleString('en-IN')}`;
};

export function MessFeePage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; reused?: boolean } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadReceipt = async (feeId: string, receiptNumber?: string) => {
    try {
      setDownloadingId(feeId);
      const res = await operationsApi.downloadReceipt(feeId);
      const blob = new Blob([res.data as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mess_Fee_Receipt_${receiptNumber || feeId}.pdf`;
      a.target = '_blank';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      alert('Failed to download receipt PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  // ─── Data queries ───
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['mess-fee-status'],
    queryFn: messFeeApi.getMyStatus,
    enabled: !isAdmin,
  });
  const status = (statusData?.data as any)?.data;

  const { data: amountData } = useQuery({
    queryKey: ['mess-fee-amount'],
    queryFn: messFeeApi.getAmount,
  });
  const currentAmount = (amountData?.data as any)?.data?.amount || 78000;

  // ─── Admin: update amount ───
  const [editAmount, setEditAmount] = useState<string>('');
  const [editing, setEditing] = useState(false);
  const updateAmount = useMutation({
    mutationFn: (amt: number) => messFeeApi.updateAmount(amt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess-fee-amount'] });
      setEditing(false);
      setMessage('Mess fee amount updated successfully.');
      setMessageType('success');
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.message || 'Failed to update amount.');
      setMessageType('error');
    },
  });

  // ─── Payment flow ───
  const pay = async () => {
    try {
      setMessage('');
      const res = await messFeeApi.createOrder();
      const order = (res.data as any)?.data;
      if (!order) throw new Error('Could not create payment order.');
      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Please check your internet connection and try again.');
      }

      const checkout = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BMSCE Hostel',
        description: 'Annual Mess Fee',
        order_id: order.orderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email,
        },
        modal: {
          ondismiss: () =>
            setMessage('Payment window closed. You can retry the payment.'),
        },
        handler: async (response: any) => {
          try {
            await messFeeApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ['mess-fee-status'] });
            setMessage('Payment verified! Your mess fee has been paid.');
            setMessageType('success');
            setOrderInfo(null);
          } catch (error: any) {
            setMessage(error.response?.data?.message || 'Payment received but verification failed. Contact admin.');
            setMessageType('error');
          }
        },
      });
      checkout.on('payment.failed', () => {
        setMessage('Payment failed. Please try again.');
        setMessageType('error');
      });
      checkout.open();
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.message || 'Unable to start payment.');
      setMessageType('error');
    }
  };

  // ─── Styles ───
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  // ═══════════════════════════════════════
  // ADMIN VIEW: Mess Fee Settings
  // ═══════════════════════════════════════
  if (isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Mess Fee Settings"
          description="Configure the annual mess fee amount for all students"
          breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Mess Fee Settings' }]}
        />

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: messageType === 'success'
                ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                : (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2'),
              color: messageType === 'success'
                ? (isDark ? '#4ade80' : '#15803d')
                : (isDark ? '#fca5a5' : '#dc2626'),
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {message}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UtensilsCrossed style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Annual Mess Fee
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                This amount applies to all students
              </p>
            </div>
          </div>

          <div style={{
            padding: '1.25rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb',
            border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`,
            marginBottom: '1.5rem',
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Current Amount
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {money(currentAmount)}
            </p>
          </div>

          {editing ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Enter new amount"
                style={{
                  flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem',
                  border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit',
                }}
              />
              <button
                disabled={updateAmount.isPending || !editAmount || parseFloat(editAmount) < 1}
                onClick={() => updateAmount.mutate(parseFloat(editAmount))}
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                  fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                  opacity: updateAmount.isPending ? 0.5 : 1,
                }}
              >
                {updateAmount.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
                  border: '1px solid var(--border-primary)', backgroundColor: 'transparent',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditAmount(String(currentAmount)); setEditing(true); }}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Edit Amount
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STUDENT VIEW
  // ═══════════════════════════════════════
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Mess Fees" description="Loading..." breadcrumbs={[{ label: 'Dashboard' }, { label: 'Mess Fees' }]} />
        <div style={{ ...cardStyle, height: '12rem', animation: 'pulse 2s ease-in-out infinite', opacity: 0.5 }} />
      </div>
    );
  }

  const isPaid = status?.isPaid;
  const history: any[] = status?.history || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Mess Fees"
        description="Annual mess fee payment"
        breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Mess Fees' }]}
      />

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.875rem 1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: messageType === 'success'
              ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
              : (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2'),
            color: messageType === 'success'
              ? (isDark ? '#4ade80' : '#15803d')
              : (isDark ? '#fca5a5' : '#dc2626'),
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {message}
        </motion.div>
      )}

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          ...cardStyle,
          background: isPaid
            ? (isDark ? 'linear-gradient(135deg, rgba(22,163,74,0.1), rgba(13,148,136,0.08))' : 'linear-gradient(135deg, #f0fdf4, #f0fdfa)')
            : (isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))' : 'linear-gradient(135deg, #fffbeb, #fff7ed)'),
          border: `1px solid ${isPaid ? (isDark ? 'rgba(22,163,74,0.3)' : '#86efac') : (isDark ? 'rgba(245,158,11,0.3)' : '#fde68a')}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              background: isPaid ? 'linear-gradient(135deg, #16a34a, #0d9488)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UtensilsCrossed style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Annual Mess Fee
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Academic Year {new Date().getFullYear()}-{new Date().getFullYear() + 1}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: 700,
            backgroundColor: isPaid
              ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
              : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
            color: isPaid
              ? (isDark ? '#4ade80' : '#15803d')
              : (isDark ? '#fbbf24' : '#b45309'),
          }}>
            {isPaid ? <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} /> : <Clock style={{ width: '0.875rem', height: '0.875rem' }} />}
            {isPaid ? 'PAID' : 'UNPAID'}
          </span>
        </div>

        {/* Amount & Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
              <IndianRupee style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{money(currentAmount)}</p>
          </div>
          {isPaid && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <Calendar style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid On</span>
                </div>
                <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fmt(status?.paidAt)}</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <CreditCard style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Method</span>
                </div>
                <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{status?.paymentMethod || '—'}</p>
              </div>
              {status?.transactionId && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                    <Receipt style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transaction ID</span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{status.transactionId}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pay Button (only if not paid) */}
        {!isPaid && (
          <div>
            {orderInfo && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Order: <code style={{ fontSize: '0.75rem' }}>{orderInfo.orderId}</code>
                {orderInfo.reused ? ' · reopened for retry' : ''}
              </p>
            )}
            <button
              onClick={pay}
              style={{
                padding: '0.875rem 2rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
              }}
            >
              Pay Mess Fee {money(currentAmount)}
            </button>
          </div>
        )}

        {/* Download Receipt Button (when paid) */}
        {isPaid && (
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${isDark ? 'rgba(22,163,74,0.2)' : '#dcfce7'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Official Electronic Receipt Generated & Verified
            </span>
            {history.find((f: any) => f.status === 'PAID') && (
              <button
                type="button"
                onClick={() => {
                  const paidFee = history.find((f: any) => f.status === 'PAID');
                  if (paidFee) handleDownloadReceipt(paidFee.id, paidFee.receiptNumber);
                }}
                disabled={!!downloadingId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1.125rem',
                  borderRadius: '0.625rem',
                  background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: downloadingId ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                }}
              >
                <Download style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>{downloadingId ? 'Generating PDF...' : 'Download Official Receipt (PDF)'}</span>
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Payment History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={cardStyle}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle style={{ width: '1rem', height: '1rem' }} />
            Payment History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((fee: any) => (
              <div
                key={fee.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid var(--border-primary)',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {money(fee.amount)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {fmt(fee.createdAt)} {fee.transactionId ? `· ${fee.transactionId}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {fee.status === 'PAID' && (
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(fee.id, fee.receiptNumber)}
                      disabled={downloadingId === fee.id}
                      title="Download Receipt"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '0.375rem',
                        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff',
                        border: '1px solid rgba(59,130,246,0.25)',
                        color: isDark ? '#93c5fd' : '#2563eb',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        cursor: downloadingId === fee.id ? 'wait' : 'pointer',
                      }}
                    >
                      <Download style={{ width: '0.6875rem', height: '0.6875rem' }} />
                      <span>Receipt</span>
                    </button>
                  )}
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '9999px',
                    backgroundColor: fee.status === 'PAID'
                      ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                      : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                    color: fee.status === 'PAID'
                      ? (isDark ? '#4ade80' : '#15803d')
                      : (isDark ? '#fbbf24' : '#b45309'),
                  }}>
                    {fee.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
