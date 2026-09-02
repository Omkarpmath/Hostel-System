import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { operationsApi } from '@/api/operations.api';
import { authApi } from '@/api/auth.api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import {
  CreditCard, ClipboardList, QrCode,
  Building2, CheckCircle2, Clock, UtensilsCrossed,
  Megaphone, ChevronRight, X, RotateCw, ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { announcementApi } from '@/api/announcement.api';
import type { Announcement } from '@/types';
import QRCode from 'qrcode';

export function StudentDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: operationsApi.overview });
  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: authApi.getProfile });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Fetch announcements targeted to this student
  const { data: announcementsData, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['dashboard-announcements'],
    queryFn: () => announcementApi.getMy(),
  });
  const allAnnouncements: Announcement[] = (announcementsData?.data as any)?.data || [];
  const recentAnnouncements = allAnnouncements.slice(0, 4);
  const unreadCount = allAnnouncements.filter((a) => !a.isRead).length;

  const handleOpenAnnouncement = async (a: Announcement) => {
    setSelectedAnnouncement(a);
    if (!a.isRead) {
      await announcementApi.markRead(a.id);
      refetchAnnouncements();
    }
  };

  const overview = (data?.data as any)?.data;
  const profile = (profileData?.data as any)?.data;
  const allocation = overview?.profile?.roomAllocations?.[0];

  // Fee status from overview
  const fees: any[] = overview?.fees || [];
  const hostelFeePaid = fees.some((f: any) => f.type === 'HOSTEL_FEE' && f.status === 'PAID');
  const messFeePaid = fees.some((f: any) => f.type === 'MESS_FEE' && f.status === 'PAID');

  const expiresAtRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  // Fetch Dynamic QR Token from Server
  const fetchNewDynamicQr = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setIsRotating(true);
      const res = await authApi.getDynamicQr();
      const qrData = (res.data as any)?.data;
      const token = qrData?.token;
      if (token) {
        const expTime = qrData.expiresAt ? new Date(qrData.expiresAt).getTime() : Date.now() + 30000;
        expiresAtRef.current = expTime;
        const initialRemaining = Math.max(0, Math.ceil((expTime - Date.now()) / 1000));
        setTimeLeft(initialRemaining || 30);

        const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, '') || window.location.origin;
        const url = `${publicAppUrl}/verify/student/${token}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
      }
    } catch (err) {
      console.error('Failed to fetch dynamic QR token:', err);
    } finally {
      setIsRotating(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchNewDynamicQr();
  }, [fetchNewDynamicQr]);

  // Wall-clock synchronized 1-second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (expiresAtRef.current > 0) {
        const remaining = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 1 && !isFetchingRef.current) {
          fetchNewDynamicQr();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchNewDynamicQr]);

  // Immediately refresh if student returns to tab or unlocks phone with an expired/near-expiry token
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const remaining = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
        if (remaining <= 3 && !isFetchingRef.current) {
          fetchNewDynamicQr();
        } else {
          setTimeLeft(remaining);
        }
      }
    };

    const handleFocus = () => {
      const remaining = Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000));
      if (remaining <= 3 && !isFetchingRef.current) {
        fetchNewDynamicQr();
      } else {
        setTimeLeft(remaining);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchNewDynamicQr]);

  if (isLoading) return <PageSkeleton />;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        description="Your hostel information at a glance"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* ─── Dynamic Rotating QR Code Card ─── */}
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
            position: 'relative',
          }}
        >
          {/* Card Header with Live Badge & Refresh Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <QrCode style={{ width: '1.25rem', height: '1.25rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>My QR Code</h3>
            </div>

            {/* Live Indicator Badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.2rem 0.5rem', borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#dcfce7',
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#bbf7d0'}`,
              fontSize: '0.6875rem', fontWeight: 700, color: isDark ? '#4ade80' : '#15803d',
            }}>
              <span style={{
                width: '0.45rem', height: '0.45rem', borderRadius: '50%',
                backgroundColor: '#22c55e', display: 'inline-block',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)',
              }} />
              <span>LIVE DYNAMIC</span>
            </div>
          </div>

          {/* QR Image Frame */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.875rem',
            padding: '0.875rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            marginBottom: '0.75rem',
            position: 'relative',
          }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic Student QR Code"
                style={{
                  width: '11.5rem',
                  height: '11.5rem',
                  display: 'block',
                  opacity: isRotating ? 0.6 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              />
            ) : (
              <div style={{ width: '11.5rem', height: '11.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '0.8125rem' }}>
                <Clock style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 2s linear infinite', marginRight: '0.35rem' }} />
                Generating…
              </div>
            )}
          </div>

          {/* Student Info */}
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', margin: '0 0 0.15rem' }}>
            {user?.firstName} {user?.lastName}
          </p>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace', margin: '0 0 0.75rem' }}>
            {profile?.studentProfile?.usn || overview?.profile?.usn || ''}
          </p>

          {/* Dynamic 30s Countdown Bar */}
          <div style={{
            width: '100%',
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
            borderRadius: '0.625rem',
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6875rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                <Clock style={{ width: '0.75rem', height: '0.75rem', color: '#3b82f6' }} />
                Refreshes in:
              </span>
              <span style={{ fontWeight: 800, color: timeLeft <= 5 ? '#ef4444' : '#2563eb', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {timeLeft}s
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(timeLeft / 30) * 100}%`,
                  backgroundColor: timeLeft <= 5 ? '#ef4444' : '#2563eb',
                  transition: 'width 1s linear, background-color 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Anti-Screenshot Notice & Force Refresh Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.625rem',
              color: isDark ? '#94a3b8' : '#64748b',
              lineHeight: 1.3,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}>
              <ShieldCheck style={{ width: '0.875rem', height: '0.875rem', color: '#10b981', flexShrink: 0 }} />
              Anti-screenshot protected
            </span>

            <button
              onClick={fetchNewDynamicQr}
              disabled={isRotating}
              title="Refresh QR immediately"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-primary)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <RotateCw style={{ width: '0.75rem', height: '0.75rem', animation: isRotating ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </motion.div>

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

      {/* ─── 📢 Important Announcements Widget ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        style={{
          ...cardStyle,
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.625rem',
              backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff',
              color: isDark ? '#60a5fa' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Megaphone style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  📢 Important Announcements
                </h3>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                  }}>
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Official notices and updates from warden & campus administration
              </p>
            </div>
          </div>

          <Link
            to="/student/announcements"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: isDark ? '#60a5fa' : '#2563eb',
              textDecoration: 'none',
            }}
          >
            View All ({allAnnouncements.length}) <ChevronRight style={{ width: '1rem', height: '1rem' }} />
          </Link>
        </div>

        {recentAnnouncements.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            borderRadius: '0.75rem',
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
            border: '1px solid var(--border-primary)',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              No active announcements right now.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {recentAnnouncements.map((a) => {
              const isUrgent = a.priority === 'URGENT';
              const isImportant = a.priority === 'IMPORTANT';
              const isUnread = !a.isRead;

              return (
                <div
                  key={a.id}
                  onClick={() => handleOpenAnnouncement(a)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '0.875rem',
                    backgroundColor: isUnread
                      ? (isDark ? 'rgba(30,58,138,0.15)' : '#f0f7ff')
                      : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                    border: isUnread
                      ? `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}`
                      : '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    position: 'relative',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                      {isUnread && (
                        <span style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: '#2563eb',
                        }} />
                      )}
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 800,
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                        backgroundColor: isUrgent
                          ? (isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2')
                          : isImportant
                          ? (isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7')
                          : (isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe'),
                        color: isUrgent ? '#dc2626' : isImportant ? '#d97706' : '#2563eb',
                        textTransform: 'uppercase',
                      }}>
                        {a.priority}
                      </span>

                      {a.targetHostel && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          • {a.targetHostel.name}
                        </span>
                      )}
                    </div>

                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: isUnread ? 800 : 600,
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                      lineHeight: 1.3,
                    }}>
                      {a.title}
                    </h4>

                    <p style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {a.message}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-primary)' }}>
                    <span>{a.createdBy?.firstName} ({a.createdBy?.role})</span>
                    <span>{a.publishAt ? new Date(a.publishAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ─── ANNOUNCEMENT DETAIL MODAL ─── */}
      {selectedAnnouncement && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          padding: '1rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '580px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            padding: '2rem',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',
                color: isDark ? '#93c5fd' : '#2563eb',
                textTransform: 'uppercase',
              }}>
                {selectedAnnouncement.priority} NOTICE
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              {selectedAnnouncement.title}
            </h3>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
              border: '1px solid var(--border-primary)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.25rem',
            }}>
              <span>Posted by: <strong>{selectedAnnouncement.createdBy?.firstName} {selectedAnnouncement.createdBy?.lastName}</strong> ({selectedAnnouncement.createdBy?.role})</span>
              <span>•</span>
              <span>{selectedAnnouncement.publishAt ? new Date(selectedAnnouncement.publishAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              marginBottom: '1.5rem',
            }}>
              {selectedAnnouncement.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
