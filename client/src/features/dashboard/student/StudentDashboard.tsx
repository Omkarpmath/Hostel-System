import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { operationsApi } from '@/api/operations.api';
import { authApi } from '@/api/auth.api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  CreditCard, ClipboardList, QrCode, Download,
  Building2, CheckCircle2, Clock, UtensilsCrossed,
} from 'lucide-react';
import QRCode from 'qrcode';

export function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: operationsApi.overview });
  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: authApi.getProfile });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const overview = (data?.data as any)?.data;
  const profile = (profileData?.data as any)?.data;
  const allocation = overview?.profile?.roomAllocations?.[0];
  const qrToken = overview?.profile?.qrCodeToken || profile?.studentProfile?.qrCodeToken;

  // Fee status from overview
  const fees: any[] = overview?.fees || [];
  const hostelFeePaid = fees.some((f: any) => f.type === 'HOSTEL_FEE' && f.status === 'PAID');
  const messFeePaid = fees.some((f: any) => f.type === 'MESS_FEE' && f.status === 'PAID');

  // Generate QR code
  useEffect(() => {
    if (!qrToken) return;
    // localhost only works on the device displaying the QR.  Set
    // VITE_PUBLIC_APP_URL to this computer's LAN/deployed URL so scanners can
    // open the verification page from another device.
    const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin;
    const url = `${publicAppUrl}/verify/student/${qrToken}`;
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl).catch(console.error);
  }, [qrToken]);

  if (isLoading) return <PageSkeleton />;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `BMSCE-QR-${profile?.studentProfile?.usn || 'student'}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        description="Your hostel information at a glance"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* ─── QR Code Card ─── */}
        {qrToken && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...cardStyle,
              gridRow: 'span 2',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: isDark
                ? 'linear-gradient(135deg, rgba(30,64,175,0.08), rgba(13,148,136,0.05))'
                : 'linear-gradient(135deg, #f0f9ff, #f0fdfa)',
              border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', width: '100%' }}>
              <QrCode style={{ width: '1.25rem', height: '1.25rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>My QR Code</h3>
            </div>

            {/* QR Image */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.875rem',
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #e5e7eb',
              marginBottom: '1rem',
            }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Student QR Code" style={{ width: '12rem', height: '12rem', display: 'block' }} />
              ) : (
                <div style={{ width: '12rem', height: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  Generating…
                </div>
              )}
            </div>

            {/* Student Info */}
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '0.25rem' }}>
              {profile?.studentProfile?.usn || overview?.profile?.usn || ''}
            </p>

            {/* Download Button */}
            <button
              onClick={downloadQR}
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.625rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Download style={{ width: '0.875rem', height: '0.875rem' }} /> Download QR
            </button>
          </motion.div>
        )}

        {/* ─── Room & Hostel Card ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Building2 style={{ width: '1.25rem', height: '1.25rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Room & Hostel</h3>
          </div>
          {allocation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hostel</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{allocation.room?.floor?.block?.hostel?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Room</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{allocation.room?.roomNumber || '—'}</span>
              </div>
              <span style={{
                alignSelf: 'flex-start', marginTop: '0.25rem',
                fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
                color: isDark ? '#4ade80' : '#15803d',
                display: 'flex', alignItems: 'center', gap: '0.25rem',
              }}>
                <CheckCircle2 style={{ width: '0.625rem', height: '0.625rem' }} /> Allocated
              </span>
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>No room has been allocated yet.</p>
          )}
        </motion.div>

        {/* ─── Fee Status Card ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CreditCard style={{ width: '1.25rem', height: '1.25rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Fees</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <FeeStatusRow label="Hostel Fee" paid={hostelFeePaid} isDark={isDark} />
            <FeeStatusRow label="Mess Fee" paid={messFeePaid} isDark={isDark} icon={UtensilsCrossed} />
          </div>
        </motion.div>

        {/* ─── Requests Card ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ClipboardList style={{ width: '1.25rem', height: '1.25rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Requests</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {overview?.leaves?.length ? `${overview.leaves.length} leave request(s).` : 'No leave requests found.'}
          </p>
          {overview?.complaints?.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
              {overview.complaints.length} complaint(s).
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function FeeStatusRow({ label, paid, isDark, icon: Icon }: { label: string; paid: boolean; isDark: boolean; icon?: any }) {
  const Ic = Icon || CreditCard;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <Ic style={{ width: '0.75rem', height: '0.75rem' }} /> {label}
      </span>
      <span style={{
        display: 'flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
        backgroundColor: paid
          ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
          : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
        color: paid
          ? (isDark ? '#4ade80' : '#15803d')
          : (isDark ? '#fbbf24' : '#b45309'),
      }}>
        {paid ? <CheckCircle2 style={{ width: '0.625rem', height: '0.625rem' }} /> : <Clock style={{ width: '0.625rem', height: '0.625rem' }} />}
        {paid ? 'PAID' : 'UNPAID'}
      </span>
    </div>
  );
}
