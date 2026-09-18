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
  CreditCard, Calendar, AlertCircle, Receipt, Download, Loader2,
  ShieldAlert, Check
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
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'VEG' | 'NON_VEG'>('VEG');

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
  const amounts = (amountData?.data as any)?.data;
  const vegAmount = amounts?.veg ?? amounts?.amounts?.veg ?? 73000;
  const nonVegAmount = amounts?.nonVeg ?? amounts?.amounts?.nonVeg ?? 80000;

  // ─── Admin: update amounts ───
  const [editVegAmount, setEditVegAmount] = useState<string>('');
  const [editNonVegAmount, setEditNonVegAmount] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const updateAmounts = useMutation({
    mutationFn: (params: { veg: number; nonVeg: number }) => messFeeApi.updateAmount(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess-fee-amount'] });
      setEditing(false);
      setMessage('Mess fee amounts updated successfully.');
      setMessageType('success');
    },
    onError: (error: any) => {
      setMessage(error.response?.data?.message || 'Failed to update amounts.');
      setMessageType('error');
    },
  });

  // ─── Payment flow ───
  const pay = async () => {
    try {
      setIsPaymentLoading(true);
      setMessage('');
      const res = await messFeeApi.createOrder(selectedPlan);
      const order = (res.data as any)?.data;
      if (!order) throw new Error('Could not create payment order.');
      setOrderInfo({ orderId: order.orderId, reused: !!order.reused });
      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Please check your internet connection and try again.');
      }

      const planLabel = selectedPlan === 'NON_VEG' ? 'Non-Vegetarian' : 'Vegetarian';

      const checkout = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BMSET Hostels',
        description: `Annual Mess Fee (${planLabel})`,
        order_id: order.orderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email,
        },
        modal: {
          ondismiss: () => {
            setIsPaymentLoading(false);
            setMessage('Payment window closed. You can retry the payment.');
            setMessageType('error');
          },
        },
        handler: async (response: any) => {
          try {
            await messFeeApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ['mess-fee-status'] });
            setMessage(`Payment verified! Your ${planLabel} mess fee has been paid.`);
            setMessageType('success');
            setOrderInfo(null);
          } catch (error: any) {
            setMessage(error.response?.data?.message || 'Payment received but verification failed. Contact admin.');
            setMessageType('error');
          } finally {
            setIsPaymentLoading(false);
          }
        },
      });
      checkout.on('payment.failed', () => {
        setIsPaymentLoading(false);
        setMessage('Payment failed. Please try again.');
        setMessageType('error');
      });
      checkout.open();
      setIsPaymentLoading(false);
    } catch (error: any) {
      setIsPaymentLoading(false);
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
          description="Configure annual mess fee amounts for Vegetarian and Non-Vegetarian meal plans"
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
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UtensilsCrossed style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Annual Meal Plan Pricing
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Configure separate pricing for Vegetarian and Non-Vegetarian dining options
              </p>
            </div>
          </div>

          {/* Pricing Cards Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Veg Pricing Card */}
            <div style={{
              padding: '1.25rem', borderRadius: '0.875rem',
              backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4',
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.25)' : '#bbf7d0'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🥬</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isDark ? '#34d399' : '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Vegetarian Plan
                </span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {money(vegAmount)}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
                Annual pure vegetarian mess access
              </p>
            </div>

            {/* Non-Veg Pricing Card */}
            <div style={{
              padding: '1.25rem', borderRadius: '0.875rem',
              backgroundColor: isDark ? 'rgba(249,115,22,0.08)' : '#fff7ed',
              border: `1px solid ${isDark ? 'rgba(249,115,22,0.25)' : '#fed7aa'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🍗</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isDark ? '#fb923c' : '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Non-Vegetarian Plan
                </span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {money(nonVegAmount)}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
                Annual non-veg + veg dining access
              </p>
            </div>
          </div>

          {/* Admin Edit Section */}
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                    Vegetarian Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={editVegAmount}
                    onChange={(e) => setEditVegAmount(e.target.value)}
                    placeholder="e.g. 73000"
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                    Non-Vegetarian Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={editNonVegAmount}
                    onChange={(e) => setEditNonVegAmount(e.target.value)}
                    placeholder="e.g. 80000"
                    style={{
                      width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  disabled={
                    updateAmounts.isPending ||
                    !editVegAmount || parseFloat(editVegAmount) < 1 ||
                    !editNonVegAmount || parseFloat(editNonVegAmount) < 1
                  }
                  onClick={() =>
                    updateAmounts.mutate({
                      veg: parseFloat(editVegAmount),
                      nonVeg: parseFloat(editNonVegAmount),
                    })
                  }
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                    fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                    opacity: updateAmounts.isPending ? 0.5 : 1,
                  }}
                >
                  {updateAmounts.isPending ? 'Saving…' : 'Save Changes'}
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
            </div>
          ) : (
            <button
              onClick={() => {
                setEditVegAmount(String(vegAmount));
                setEditNonVegAmount(String(nonVegAmount));
                setEditing(true);
              }}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Edit Pricing
            </button>
          )}

          {/* Admin Policy Notice */}
          <div style={{
            marginTop: '1.5rem', padding: '0.875rem 1rem', borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: '1px dashed var(--border-primary)',
            fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5,
          }}>
            <strong>Policy Notice:</strong> Students choose their meal plan when paying the annual mess fee. Once paid, the plan is permanently locked. Students cannot self-switch between Veg and Non-Veg after payment.
          </div>
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
  const mealPlan = status?.mealPlan;
  const isNonVegPaid = mealPlan === 'NON_VEG';
  const history: any[] = status?.history || [];
  const currentPlanAmount = selectedPlan === 'NON_VEG' ? nonVegAmount : vegAmount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title="Mess Fees"
        description="Annual mess fee payment and meal plan status"
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
            ? isNonVegPaid
              ? (isDark ? 'linear-gradient(135deg, rgba(234,88,12,0.12), rgba(180,83,9,0.08))' : 'linear-gradient(135deg, #fff7ed, #fffbeb)')
              : (isDark ? 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(13,148,136,0.08))' : 'linear-gradient(135deg, #f0fdf4, #f0fdfa)')
            : (isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.06))' : 'linear-gradient(135deg, #fffbeb, #fff7ed)'),
          border: `1px solid ${
            isPaid
              ? isNonVegPaid
                ? (isDark ? 'rgba(249,115,22,0.35)' : '#fed7aa')
                : (isDark ? 'rgba(22,163,74,0.35)' : '#86efac')
              : (isDark ? 'rgba(245,158,11,0.3)' : '#fde68a')
          }`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem',
              background: isPaid
                ? isNonVegPaid
                  ? 'linear-gradient(135deg, #ea580c, #c2410c)'
                  : 'linear-gradient(135deg, #16a34a, #0d9488)'
                : 'linear-gradient(135deg, #f59e0b, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UtensilsCrossed style={{ width: '1.625rem', height: '1.625rem', color: 'white' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Annual Mess Fee
                </h3>
                {isPaid && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.2rem 0.625rem', borderRadius: '9999px',
                    fontSize: '0.6875rem', fontWeight: 800,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    backgroundColor: isNonVegPaid
                      ? (isDark ? 'rgba(234,88,12,0.25)' : '#ffedd5')
                      : (isDark ? 'rgba(22,163,74,0.25)' : '#dcfce7'),
                    color: isNonVegPaid
                      ? (isDark ? '#fdba74' : '#c2410c')
                      : (isDark ? '#86efac' : '#15803d'),
                    border: `1px solid ${isNonVegPaid ? (isDark ? 'rgba(249,115,22,0.4)' : '#fdba74') : (isDark ? 'rgba(34,197,94,0.4)' : '#86efac')}`,
                  }}>
                    {isNonVegPaid ? '🍗 Non-Vegetarian Plan' : '🥬 Vegetarian Plan'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
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

        {/* ─── UNPAID: Interactive Meal Plan Selection ─── */}
        {!isPaid && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Select Your Meal Plan
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Option 1: Vegetarian */}
              <div
                onClick={() => setSelectedPlan('VEG')}
                style={{
                  cursor: 'pointer',
                  padding: '1.25rem',
                  borderRadius: '0.875rem',
                  backgroundColor: selectedPlan === 'VEG'
                    ? (isDark ? 'rgba(16,185,129,0.12)' : '#f0fdf4')
                    : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                  border: selectedPlan === 'VEG'
                    ? `2px solid ${isDark ? '#10b981' : '#059669'}`
                    : '1px solid var(--border-primary)',
                  boxShadow: selectedPlan === 'VEG' ? '0 0 0 1px rgba(16,185,129,0.2)' : 'none',
                  transition: 'all 0.15s ease-in-out',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🥬</span>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Vegetarian Plan
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>
                        Pure Veg Dining Access
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                    border: `2px solid ${selectedPlan === 'VEG' ? '#059669' : 'var(--border-primary)'}`,
                    backgroundColor: selectedPlan === 'VEG' ? '#059669' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selectedPlan === 'VEG' && <Check style={{ width: '0.75rem', height: '0.75rem', color: 'white' }} />}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {money(vegAmount)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>/ academic year</span>
                </div>

                <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.125rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>Daily breakfast, lunch, snacks & dinner</li>
                  <li>Pure vegetarian dining hall access</li>
                  <li>Special festive holiday meals</li>
                </ul>
              </div>

              {/* Option 2: Non-Vegetarian */}
              <div
                onClick={() => setSelectedPlan('NON_VEG')}
                style={{
                  cursor: 'pointer',
                  padding: '1.25rem',
                  borderRadius: '0.875rem',
                  backgroundColor: selectedPlan === 'NON_VEG'
                    ? (isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed')
                    : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                  border: selectedPlan === 'NON_VEG'
                    ? `2px solid ${isDark ? '#f97316' : '#ea580c'}`
                    : '1px solid var(--border-primary)',
                  boxShadow: selectedPlan === 'NON_VEG' ? '0 0 0 1px rgba(249,115,22,0.2)' : 'none',
                  transition: 'all 0.15s ease-in-out',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🍗</span>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        Non-Vegetarian Plan
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.125rem 0 0' }}>
                        Non-Veg + Veg Dining Access
                      </p>
                    </div>
                  </div>
                  <div style={{
                    width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                    border: `2px solid ${selectedPlan === 'NON_VEG' ? '#ea580c' : 'var(--border-primary)'}`,
                    backgroundColor: selectedPlan === 'NON_VEG' ? '#ea580c' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selectedPlan === 'NON_VEG' && <Check style={{ width: '0.75rem', height: '0.75rem', color: 'white' }} />}
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {money(nonVegAmount)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>/ academic year</span>
                </div>

                <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.125rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <li>All vegetarian menu items included</li>
                  <li>Weekly non-veg dishes & specials</li>
                  <li>Separate non-veg serving counter</li>
                </ul>
              </div>
            </div>

            {/* Pay Button */}
            <div>
              {orderInfo && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  Order: <code style={{ fontSize: '0.75rem' }}>{orderInfo.orderId}</code>
                  {orderInfo.reused ? ' · reopened for retry' : ''}
                </p>
              )}
              <button
                disabled={isPaymentLoading}
                onClick={pay}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: selectedPlan === 'NON_VEG'
                    ? 'linear-gradient(135deg, #ea580c, #c2410c)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: isPaymentLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: selectedPlan === 'NON_VEG'
                    ? '0 4px 14px rgba(234,88,12,0.35)'
                    : '0 4px 14px rgba(5,150,105,0.35)',
                  opacity: isPaymentLoading ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {isPaymentLoading ? (
                  <>
                    <Loader2 style={{ width: '1.125rem', height: '1.125rem' }} className="animate-spin" />
                    <span>Opening Checkout…</span>
                  </>
                ) : (
                  <>
                    <CreditCard style={{ width: '1.125rem', height: '1.125rem' }} />
                    <span>
                      {orderInfo
                        ? 'Retry Mess Fee Payment'
                        : `Pay ${selectedPlan === 'NON_VEG' ? 'Non-Veg' : 'Veg'} Fee ${money(currentPlanAmount)}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── PAID: Transaction Details & Receipt ─── */}
        {isPaid && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                  <IndianRupee style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Paid</span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {money(isNonVegPaid ? nonVegAmount : vegAmount)}
                </p>
              </div>

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
                <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{status?.paymentMethod || 'RAZORPAY'}</p>
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
            </div>

            {/* Policy Lock Reminder */}
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.75rem', color: 'var(--text-muted)',
              marginBottom: '1rem',
            }}>
              <ShieldAlert style={{ width: '1rem', height: '1rem', flexShrink: 0, color: isDark ? '#94a3b8' : '#64748b' }} />
              <span>Meal plan is locked for the academic year. Contact the hostel administration office for any plan adjustments.</span>
            </div>

            {/* Download Receipt Button */}
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
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
                    background: isNonVegPaid
                      ? 'linear-gradient(135deg, #ea580c, #c2410c)'
                      : 'linear-gradient(135deg, #16a34a, #0d9488)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    border: 'none',
                    cursor: downloadingId ? 'wait' : 'pointer',
                    boxShadow: isNonVegPaid
                      ? '0 2px 8px rgba(234,88,12,0.25)'
                      : '0 2px 8px rgba(22,163,74,0.25)',
                  }}
                >
                  <Download style={{ width: '0.875rem', height: '0.875rem' }} />
                  <span>{downloadingId ? 'Generating PDF...' : 'Download Official Receipt (PDF)'}</span>
                </button>
              )}
            </div>
          </>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {money(fee.amount)}
                    </p>
                    {fee.mealPlan && (
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.375rem', borderRadius: '4px',
                        backgroundColor: fee.mealPlan === 'NON_VEG'
                          ? (isDark ? 'rgba(234,88,12,0.2)' : '#ffedd5')
                          : (isDark ? 'rgba(22,163,74,0.2)' : '#dcfce7'),
                        color: fee.mealPlan === 'NON_VEG'
                          ? (isDark ? '#fdba74' : '#c2410c')
                          : (isDark ? '#86efac' : '#15803d'),
                      }}>
                        {fee.mealPlan === 'NON_VEG' ? '🍗 Non-Veg' : '🥬 Veg'}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
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
