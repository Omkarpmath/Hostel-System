import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BedDouble, CheckCircle2, Building2, Users, MapPin, ArrowLeft, ChevronRight, Lock, Unlock, ShieldAlert, Loader2, Clock, ShieldCheck, CreditCard, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';
import { hostelApi } from '@/api/hostel.api';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingApi } from '@/api/booking.api';
import { loadRazorpayScript } from '@/lib/razorpay';

export function RoomBookingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isStudent = user?.role === 'STUDENT';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'WARDEN';
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; reused?: boolean } | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);
  const [blockingRoom, setBlockingRoom] = useState<any | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [reservingRoomId, setReservingRoomId] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // ─── Student profile & allocation ───
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isStudent,
  });
  const profile = (profileData?.data as any)?.data;
  const activeAllocation = profile?.studentProfile?.roomAllocations?.find(
    (a: any) => a.status === 'ACTIVE'
  );
  const studentProfile = profile?.studentProfile;

  // ─── Hostel list (for step 1) ───
  const { data: hostelsData, isLoading: hostelsLoading } = useQuery({
    queryKey: ['hostels-list'],
    queryFn: () => hostelApi.getAll(),
  });
  const allHostels: any[] = (hostelsData?.data as any)?.data || [];

  const isPageLoading = hostelsLoading || (isStudent && profileLoading);

  // Filter to eligible hostels for students (strictly empty if student profile is not yet loaded)
  const eligibleHostels = isStudent
    ? (studentProfile
        ? allHostels.filter((h: any) =>
          h.isActive !== false &&
          h.allowedYears?.includes(studentProfile.year) &&
          ((studentProfile.gender === 'MALE' && h.type === 'BOYS') ||
            (studentProfile.gender === 'FEMALE' && h.type === 'GIRLS'))
        )
        : [])
    : allHostels.filter((h: any) => h.isActive !== false);

  const selectedHostel = eligibleHostels.find((h: any) => h.id === selectedHostelId);

  // ─── Rooms for selected hostel (step 2) ───
  // Staff sees all rooms (available, full, blocked) with management controls
  // Students only query and see rooms with available capacity (matching normal behavior when a room is booked/full)
  const { data: allRoomsData, isLoading: allRoomsLoading } = useQuery({
    queryKey: ['all-rooms', selectedHostelId],
    queryFn: () => hostelApi.getRooms({ hostelId: selectedHostelId! }),
    enabled: !!selectedHostelId && isStaff,
  });
  const allRooms: any[] = (allRoomsData?.data as any)?.data || [];

  const { data: roomsData, isLoading: availableRoomsLoading } = useQuery({
    queryKey: ['available-rooms', selectedHostelId],
    queryFn: () => hostelApi.getAvailableRooms(selectedHostelId!),
    enabled: !!selectedHostelId && !isStaff,
    refetchInterval: 8000, // Near-real-time bed availability updates (every 8s)
    staleTime: 5000,       // Keep cached for 5s matching backend TTL
  });
  const availableRooms: any[] = (roomsData?.data as any)?.data || [];

  const roomsLoading = isStaff ? allRoomsLoading : availableRoomsLoading;
  const displayRooms = isStaff ? allRooms : availableRooms;

  // ─── Booking / Reservation (student only) ───
  const { data: reservationData } = useQuery({
    queryKey: ['my-reservation'],
    queryFn: bookingApi.active,
    enabled: isStudent,
  });
  const reservation: any = (reservationData?.data as any)?.data;

  // Keep selectedHostelId in sync with reservation's hostel
  useEffect(() => {
    if (reservation?.room?.floor?.block?.hostel?.id) {
      setSelectedHostelId(reservation.room.floor.block.hostel.id);
    }
  }, [reservation?.room?.floor?.block?.hostel?.id]);

  // Reset selected hostel if student has an ineligible hostel selected
  useEffect(() => {
    if (isStudent && selectedHostelId && !isPageLoading && !selectedHostel) {
      setSelectedHostelId(null);
    }
  }, [isStudent, selectedHostelId, isPageLoading, selectedHostel]);

  const reserve = useMutation({
    mutationFn: (roomId: string) => {
      setReservingRoomId(roomId);
      return bookingApi.reserve(roomId);
    },
    onSuccess: () => {
      setReservingRoomId(null);
      queryClient.invalidateQueries({ queryKey: ['my-reservation'] });
      if (selectedHostelId) {
        queryClient.invalidateQueries({ queryKey: ['available-rooms', selectedHostelId] });
      }
    },
    onError: (error: any) => {
      setReservingRoomId(null);
      setMessage(error.response?.data?.message || 'Unable to reserve this room.');
    },
  });

  const cancel = useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: async () => {
      queryClient.setQueryData(['my-reservation'], (old: any) =>
        old ? { ...old, data: { ...old.data, data: null } } : old
      );
      await queryClient.refetchQueries({ queryKey: ['my-reservation'] });
      if (selectedHostelId) {
        await queryClient.refetchQueries({ queryKey: ['available-rooms', selectedHostelId] });
      }
      setOrderInfo(null);
      setMessage('Reservation cancelled. Available rooms have been refreshed.');
    },
    onError: (error: any) => setMessage(error.response?.data?.message || 'Unable to cancel the reservation.'),
  });

  const blockMutation = useMutation({
    mutationFn: ({ roomId, reason }: { roomId: string; reason?: string }) =>
      hostelApi.blockRoom(roomId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', selectedHostelId] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms', selectedHostelId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setBlockingRoom(null);
      setBlockReason('');
      setMessage('');
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Unable to block this room.');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (roomId: string) => hostelApi.unblockRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-rooms', selectedHostelId] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms', selectedHostelId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setMessage('');
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Unable to unblock this room.');
    },
  });

  const [secondsRemaining, setSecondsRemaining] = useState(0);
  useEffect(() => {
    if (!reservation?.expiresAt) return;
    const tick = () =>
      setSecondsRemaining(
        Math.max(0, Math.ceil((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000))
      );
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [reservation?.expiresAt]);

  // ─── Razorpay payment ───
  const pay = async () => {
    try {
      setIsPaymentLoading(true);
      setMessage('');
      const order = (await bookingApi.createOrder(reservation.id)).data.data;
      if (!order) throw new Error('Payment order could not be created.');
      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Please check your internet connection and try again.');
      }
      const checkout = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BMSCE Hostel',
        description: `Room ${reservation.room.roomNumber} hostel fee`,
        order_id: order.orderId,
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          email: user?.email,
        },
        modal: {
          ondismiss: () => {
            setIsPaymentLoading(false);
            setMessage('Payment window closed. You can retry the same payment order before the reservation expires.');
          },
        },
        handler: async (response: any) => {
          try {
            await bookingApi.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            if (selectedHostelId) {
              queryClient.invalidateQueries({ queryKey: ['available-rooms', selectedHostelId] });
            }
            queryClient.invalidateQueries({ queryKey: ['my-reservation'] });
            setMessage('Payment verified. Your room has been allocated.');
          } catch (error: any) {
            setMessage(
              error.response?.data?.message || 'Payment was received but room allocation could not be completed.'
            );
          } finally {
            setIsPaymentLoading(false);
          }
        },
      });
      checkout.on('payment.failed', () => {
        setIsPaymentLoading(false);
        setMessage('Payment failed. Click Pay again to reopen the same order before your reservation expires.');
      });
      checkout.open();
      // Reset loading state once checkout window is displayed
      setIsPaymentLoading(false);
    } catch (error: any) {
      setIsPaymentLoading(false);
      setMessage(error.response?.data?.message || error.message || 'Unable to start Razorpay payment.');
    }
  };

  // ─── Shared styles ───
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  // ═══════════════════════════════════════
  // Loading state: Student profile loading
  // ═══════════════════════════════════════
  if (isStudent && profileLoading) {
    return <PageSkeleton />;
  }

  // ═══════════════════════════════════════
  // Profile Incomplete Guard
  // ═══════════════════════════════════════
  if (isStudent && !studentProfile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Select a Hostel"
          description="Complete your student profile to view eligible hostels."
          breadcrumbs={[
            { label: 'Dashboard', href: '/student/dashboard' },
            { label: 'Browse Rooms' },
          ]}
        />
        <EmptyState
          icon={Building2}
          title="Student Profile Required"
          description="Your student profile (gender and academic year) must be set up before you can browse and book rooms in hostels."
          action={{
            label: "Complete My Profile",
            onClick: () => { window.location.href = '/student/profile'; }
          }}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════
  // CASE A: Student already allocated
  // ═══════════════════════════════════════
  if (isStudent && activeAllocation) {
    const room = activeAllocation.room;
    const hostelName = room?.floor?.block?.hostel?.name || 'Unknown Hostel';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="My Room"
          description="Your current room allocation details"
          breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'My Room' }]}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            padding: '2rem',
            background: isDark
              ? 'linear-gradient(135deg, rgba(30,64,175,0.15), rgba(13,148,136,0.1))'
              : 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <CheckCircle2 style={{ width: '1.5rem', height: '1.5rem', color: '#16a34a' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              You are allocated to a room
            </h3>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              { label: 'Room Number', value: room?.roomNumber || 'N/A', icon: BedDouble },
              { label: 'Hostel', value: hostelName, icon: Building2 },
              { label: 'Capacity', value: `${room?.occupiedBeds || 0}/${room?.capacity || 0} beds`, icon: Users },
              {
                label: 'Fee/Semester',
                value: room?.feePerSemester ? `₹${Number(room.feePerSemester).toLocaleString('en-IN')}` : 'N/A',
                icon: MapPin,
              },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <item.icon style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
                <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // CASE B: Student has active reservation
  // ═══════════════════════════════════════
  if (isStudent && reservation) {
    const fee = Number(reservation.room?.feePerSemester || 0);
    const room = reservation.room;
    const hostel = room?.floor?.block?.hostel;
    const block = room?.floor?.block;
    const floor = room?.floor;

    const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
    const seconds = (secondsRemaining % 60).toString().padStart(2, '0');
    const isExpiringSoon = secondsRemaining > 0 && secondsRemaining < 180;
    const isExpired = secondsRemaining === 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Complete Room Booking"
          description="Your selected room is locked exclusively for you while you complete payment."
          breadcrumbs={[
            { label: 'Dashboard', href: '/student/dashboard' },
            { label: 'Browse Rooms', href: '/student/rooms' },
            { label: 'Payment' },
          ]}
        />

        {message && (
          <div
            style={{
              padding: '0.875rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'}`,
              color: isDark ? '#fca5a5' : '#dc2626',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }}
          >
            <AlertCircle style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: Room & Reservation Overview */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...cardStyle,
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              height: '100%',
            }}
          >
            {/* Header with Room & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    borderRadius: '0.875rem',
                    backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff',
                    color: isDark ? '#60a5fa' : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <BedDouble style={{ width: '1.625rem', height: '1.625rem' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    Room {room?.roomNumber}
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {hostel?.name || 'Hostel'} · {block?.name} · {floor?.name}
                  </p>
                </div>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  backgroundColor: isExpired
                    ? isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2'
                    : isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
                  color: isExpired
                    ? isDark ? '#fca5a5' : '#dc2626'
                    : isDark ? '#fbbf24' : '#d97706',
                }}
              >
                <span
                  style={{
                    width: '0.375rem',
                    height: '0.375rem',
                    borderRadius: '9999px',
                    backgroundColor: isExpired ? '#ef4444' : '#f59e0b',
                  }}
                />
                {isExpired ? 'Hold Expired' : 'Reserved for You'}
              </span>
            </div>

            {/* Clean Room Specs Grid (Stretches gracefully with flex: 1) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.25rem 1rem',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                flex: 1,
                alignContent: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Room Type
                </span>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {room?.type || 'Standard'} Room
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Capacity
                </span>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {room?.capacity} Beds
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Block & Floor
                </span>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {block?.name || 'Block'}, {floor?.name || 'Floor'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hostel Category
                </span>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {hostel?.type || 'Standard'}
                </p>
              </div>
            </div>

            {/* Clean Countdown Hold Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: isExpired
                  ? isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2'
                  : isExpiringSoon
                    ? isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb'
                    : isDark ? 'rgba(59,130,246,0.06)' : '#f0f9ff',
                border: `1px solid ${
                  isExpired
                    ? isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'
                    : isExpiringSoon
                      ? isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'
                      : isDark ? 'rgba(59,130,246,0.18)' : '#bae6fd'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    color: isExpired
                      ? '#ef4444'
                      : isExpiringSoon
                        ? '#f59e0b'
                        : isDark ? '#60a5fa' : '#0284c7',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isExpired ? 'Reservation hold has expired' : 'Temporary reservation hold'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                    {isExpired
                      ? 'Please select an available room to restart booking.'
                      : 'Complete your payment before this timer reaches 00:00.'}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: isExpired
                      ? '#ef4444'
                      : isExpiringSoon
                        ? '#f59e0b'
                        : isDark ? '#60a5fa' : '#0284c7',
                  }}
                >
                  {minutes}:{seconds}
                </span>
              </div>
            </div>

            {orderInfo && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Active Payment Order: <code style={{ fontFamily: 'monospace' }}>{orderInfo.orderId}</code>
                {orderInfo.reused ? ' (reopened for retry)' : ''}
              </p>
            )}
          </motion.div>

          {/* Right Column: Fee Summary & Payment Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              ...cardStyle,
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Fee Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Semester Hostel Fee</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    ₹{fee.toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Room Allocation Charges</span>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>Free</span>
                </div>
                <div
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--border-primary)',
                    margin: '0.25rem 0',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Total Due</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    ₹{fee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Secure Checkout Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'var(--bg-tertiary)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <ShieldCheck style={{ width: '1rem', height: '1rem', color: '#16a34a', flexShrink: 0 }} />
                <span>Secure checkout powered by Razorpay</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
              <button
                disabled={isExpired || isPaymentLoading || cancel.isPending}
                onClick={pay}
                style={{
                  width: '100%',
                  padding: '0.8125rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  cursor: (isExpired || isPaymentLoading || cancel.isPending) ? 'not-allowed' : 'pointer',
                  opacity: (isExpired || isPaymentLoading || cancel.isPending) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
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
                    <span>{orderInfo ? 'Retry Payment' : `Pay ₹${fee.toLocaleString('en-IN')}`}</span>
                  </>
                )}
              </button>

              <button
                disabled={cancel.isPending || isPaymentLoading}
                onClick={() => cancel.mutate(reservation.id)}
                style={{
                  width: '100%',
                  padding: '0.6875rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-primary)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: (cancel.isPending || isPaymentLoading) ? 'not-allowed' : 'pointer',
                  opacity: (cancel.isPending || isPaymentLoading) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontFamily: 'inherit',
                }}
              >
                {cancel.isPending ? (
                  <>
                    <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                    <span>Cancelling Reservation…</span>
                  </>
                ) : (
                  'Cancel Reservation'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // CASE C: No hostel selected → Show hostel cards
  // ═══════════════════════════════════════
  if (!selectedHostelId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title={isStudent ? 'Select a Hostel' : 'Room Management'}
          description={
            isStudent
              ? `${eligibleHostels.length} hostel${eligibleHostels.length !== 1 ? 's' : ''} available for you. Select one to browse rooms.`
              : `${eligibleHostels.length} hostel${eligibleHostels.length !== 1 ? 's' : ''} found. Select a hostel to view its rooms.`
          }
          breadcrumbs={[
            { label: 'Dashboard', href: isStudent ? '/student/dashboard' : '/admin/dashboard' },
            { label: isStudent ? 'Browse Rooms' : 'Rooms' },
          ]}
        />

        {isPageLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  ...cardStyle,
                  height: '12rem',
                  animation: 'pulse 2s ease-in-out infinite',
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
        ) : eligibleHostels.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={
              isStudent
                ? studentProfile?.gender === 'FEMALE'
                  ? 'No Girls Hostels Available'
                  : studentProfile?.gender === 'MALE'
                    ? 'No Boys Hostels Available'
                    : 'No Hostels Available'
                : 'No hostels available'
            }
            description={
              isStudent
                ? studentProfile?.gender === 'FEMALE'
                  ? `No Girls Hostels are currently available for your academic year${studentProfile?.year ? ` (Year ${studentProfile.year})` : ''}. Please contact administration.`
                  : studentProfile?.gender === 'MALE'
                    ? `No Boys Hostels are currently available for your academic year${studentProfile?.year ? ` (Year ${studentProfile.year})` : ''}. Please contact administration.`
                    : 'No hostels are currently configured for your profile. Please contact administration.'
                : 'No active hostels found. Create one from the Hostels page.'
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            {eligibleHostels.map((hostel: any, i: number) => {
              const roomCount =
                hostel.blocks?.reduce(
                  (sum: number, b: any) =>
                    sum +
                    (b.floors?.reduce((fs: number, f: any) => fs + (f.rooms?.length || 0), 0) || 0),
                  0
                ) || 0;
              const totalBeds =
                hostel.blocks?.reduce(
                  (sum: number, b: any) =>
                    sum +
                    (b.floors?.reduce(
                      (fs: number, f: any) =>
                        fs + (f.rooms?.reduce((rs: number, r: any) => rs + (r.capacity || 0), 0) || 0),
                      0
                    ) || 0),
                  0
                ) || 0;
              const occupiedBeds =
                hostel.blocks?.reduce(
                  (sum: number, b: any) =>
                    sum +
                    (b.floors?.reduce(
                      (fs: number, f: any) =>
                        fs +
                        (f.rooms?.reduce((rs: number, r: any) => rs + (r.status === 'BLOCKED' ? (r.capacity || 0) : (r.occupiedBeds || 0)), 0) || 0),
                      0
                    ) || 0),
                  0
                ) || 0;
              const availBeds = totalBeds - occupiedBeds;

              return (
                <motion.button
                  key={hostel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => {
                    setSelectedHostelId(hostel.id);
                    setMessage('');
                  }}
                  style={{
                    ...cardStyle,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = isDark ? 'rgba(59,130,246,0.5)' : '#93c5fd';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '3rem',
                        height: '3rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #1e40af, #0d9488)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor:
                            hostel.type === 'BOYS'
                              ? isDark
                                ? 'rgba(59,130,246,0.15)'
                                : '#dbeafe'
                              : isDark
                                ? 'rgba(236,72,153,0.15)'
                                : '#fce7f3',
                          color:
                            hostel.type === 'BOYS'
                              ? isDark
                                ? '#93c5fd'
                                : '#1d4ed8'
                              : isDark
                                ? '#f9a8d4'
                                : '#be185d',
                          textTransform: 'uppercase',
                        }}
                      >
                        {hostel.type}
                      </span>
                      <ChevronRight
                        style={{ width: '1.25rem', height: '1.25rem', color: 'var(--text-muted)' }}
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {hostel.name}
                  </h3>
                  {hostel.address && (
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {hostel.address}
                    </p>
                  )}

                  {/* Stats Row */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.5rem',
                      marginTop: 'auto',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-primary)',
                      width: '100%',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {roomCount}
                      </p>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Rooms
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {totalBeds}
                      </p>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Total Beds
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 800,
                          color:
                            availBeds > 0
                              ? isDark
                                ? '#4ade80'
                                : '#16a34a'
                              : isDark
                                ? '#fca5a5'
                                : '#dc2626',
                        }}
                      >
                        {availBeds}
                      </p>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Available
                      </p>
                    </div>
                    {hostel.allowedYears?.length > 0 && (
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {hostel.allowedYears.join(', ')}
                        </p>
                        <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Year
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Warden */}
                  {hostel.warden && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                      Warden: {hostel.warden.firstName} {hostel.warden.lastName}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  // CASE D: Hostel selected → Show its rooms
  // ═══════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title={selectedHostel?.name || 'Rooms'}
        description={
          isStudent
            ? `${displayRooms.length} available room${displayRooms.length !== 1 ? 's' : ''} in this hostel`
            : `${displayRooms.length} room${displayRooms.length !== 1 ? 's' : ''} in this hostel`
        }
        breadcrumbs={[
          { label: 'Dashboard', href: isStudent ? '/student/dashboard' : '/admin/dashboard' },
          { label: isStudent ? 'Browse Rooms' : 'Rooms' },
          { label: selectedHostel?.name || 'Hostel' },
        ]}
        actions={
          <button
            onClick={() => {
              setSelectedHostelId(null);
              setMessage('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-primary)',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} /> All Hostels
          </button>
        }
      />

      {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}

      {/* Hostel Info Bar */}
      {selectedHostel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            background: isDark
              ? 'linear-gradient(135deg, rgba(30,64,175,0.08), rgba(13,148,136,0.05))'
              : 'linear-gradient(135deg, #eff6ff, #f0fdfa)',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #1e40af, #0d9488)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedHostel.name}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {selectedHostel.type} · {selectedHostel.address || 'No address'}
              {selectedHostel.allowedYears?.length > 0 &&
                ` · Year ${selectedHostel.allowedYears.join(', ')}`}
            </p>
          </div>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              backgroundColor: isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7',
              color: isDark ? '#4ade80' : '#15803d',
            }}
          >
            {isStudent
              ? `${displayRooms.length} available room${displayRooms.length !== 1 ? 's' : ''}`
              : `${displayRooms.length} rooms`}
          </span>
        </motion.div>
      )}

      {roomsLoading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                ...cardStyle,
                height: '10rem',
                animation: 'pulse 2s ease-in-out infinite',
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : displayRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms available"
          description={
            isStudent
              ? 'No rooms with open capacity in this hostel right now.'
              : 'No rooms found in this hostel. Add rooms via Hostels → Block → Floor → Room.'
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {displayRooms.map((room: any, i: number) => {
            const available = room.capacity - room.occupiedBeds;
            const blockName = room.floor?.block?.name || '';
            const floorName = room.floor?.name || '';

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                style={cardStyle}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.625rem',
                      backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                    }}
                  >
                    <BedDouble
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        color: isDark ? '#60a5fa' : '#2563eb',
                      }}
                    />
                  </div>
                  <StatusBadge status={room.status || 'AVAILABLE'} />
                </div>

                <h3
                  style={{
                    fontSize: '1.0625rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Room {room.roomNumber}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {blockName && (
                    <span>
                      {blockName} · {floorName}
                    </span>
                  )}
                  <span>
                    Type: {room.type || 'N/A'} · Capacity: {room.capacity}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem',
                    }}
                  >
                    {/* Availability / Full badge */}
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor:
                          available > 0
                            ? isDark
                              ? 'rgba(22,163,74,0.15)'
                              : '#dcfce7'
                            : isDark
                              ? 'rgba(220,38,38,0.15)'
                              : '#fee2e2',
                        color:
                          available > 0
                            ? isDark
                              ? '#4ade80'
                              : '#15803d'
                            : isDark
                              ? '#fca5a5'
                              : '#dc2626',
                      }}
                    >
                      {available > 0 ? `${available} bed${available > 1 ? 's' : ''} available` : 'Occupied'}
                    </span>
                    {room.feePerSemester && (
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        ₹{Number(room.feePerSemester).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Staff Audit Details for Blocked Room */}
                {isStaff && room.status === 'BLOCKED' && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.625rem',
                      borderRadius: '0.625rem',
                      backgroundColor: isDark ? 'rgba(139,92,246,0.1)' : '#f5f3ff',
                      border: `1px solid ${isDark ? 'rgba(139,92,246,0.25)' : '#ddd6fe'}`,
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: isDark ? '#c4b5fd' : '#7c3aed', fontWeight: 700 }}>
                      <ShieldAlert style={{ width: '0.875rem', height: '0.875rem' }} />
                      <span>Blocked by {room.blockedBy?.firstName ? `${room.blockedBy.firstName} ${room.blockedBy.lastName || ''}`.trim() : 'Admin'}</span>
                    </div>
                    {room.blockedReason && (
                      <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                        Reason: {room.blockedReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Staff Action Buttons (Block / Unblock) */}
                {isStaff && (
                  <div style={{ marginTop: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                    {room.status === 'BLOCKED' ? (
                      <button
                        disabled={unblockMutation.isPending}
                        onClick={() => unblockMutation.mutate(room.id)}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.625rem',
                          border: `1px solid ${isDark ? 'rgba(139,92,246,0.3)' : '#c4b5fd'}`,
                          backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : '#ede9fe',
                          color: isDark ? '#c4b5fd' : '#6d28d9',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          fontFamily: 'inherit',
                          opacity: unblockMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <Unlock style={{ width: '0.875rem', height: '0.875rem' }} />
                        {unblockMutation.isPending ? 'Unblocking…' : 'Unblock Room'}
                      </button>
                    ) : room.occupiedBeds === 0 ? (
                      <button
                        onClick={() => {
                          setBlockingRoom(room);
                          setBlockReason('');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.625rem',
                          border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fca5a5'}`,
                          backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                          color: isDark ? '#fca5a5' : '#dc2626',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.375rem',
                          fontFamily: 'inherit',
                        }}
                      >
                        <Lock style={{ width: '0.875rem', height: '0.875rem' }} />
                        Block Room
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Student Room Selection Button */}
                {isStudent && (() => {
                  const isThisReserving = reservingRoomId === room.id || (reserve.isPending && reserve.variables === room.id);
                  return (
                    <button
                      disabled={reserve.isPending || available <= 0}
                      onClick={() => reserve.mutate(room.id)}
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.625rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        fontFamily: 'inherit',
                        cursor: (available > 0 && !reserve.isPending) ? 'pointer' : 'not-allowed',
                        background:
                          available > 0
                            ? 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)'
                            : 'var(--bg-tertiary)',
                        color: available > 0 ? 'white' : 'var(--text-muted)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        opacity: (reserve.isPending && !isThisReserving) ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      {isThisReserving ? (
                        <>
                          <Loader2 style={{ width: '1rem', height: '1rem' }} className="animate-spin" />
                          <span>Reserving…</span>
                        </>
                      ) : available > 0 ? (
                        'Select Room'
                      ) : (
                        'Occupied'
                      )}
                    </button>
                  );
                })()}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Admin/Warden Block Room Modal */}
      <AnimatePresence>
        {blockingRoom && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={() => setBlockingRoom(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: '1rem',
                padding: '1.5rem',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.625rem',
                    backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Block Room {blockingRoom.roomNumber}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Students will see this room as Occupied and cannot reserve it.
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
                  Reason for Blocking (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Maintenance, Reserved for staff, Renovation"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setBlockingRoom(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-primary)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={blockMutation.isPending}
                  onClick={() =>
                    blockMutation.mutate({
                      roomId: blockingRoom.id,
                      reason: blockReason,
                    })
                  }
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    opacity: blockMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {blockMutation.isPending ? 'Blocking…' : 'Confirm Block'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
