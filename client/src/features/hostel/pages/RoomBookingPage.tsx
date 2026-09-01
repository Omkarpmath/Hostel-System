import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BedDouble, CheckCircle2, Building2, Users, MapPin, ArrowLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { hostelApi } from '@/api/hostel.api';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { motion } from 'framer-motion';
import { bookingApi } from '@/api/booking.api';
import { loadRazorpayScript } from '@/lib/razorpay';

export function RoomBookingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isStudent = user?.role === 'STUDENT';
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; reused?: boolean } | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);

  // ─── Student profile & allocation ───
  const { data: profileData } = useQuery({
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

  // Filter to eligible hostels for students
  const eligibleHostels = isStudent && studentProfile
    ? allHostels.filter((h: any) =>
      h.isActive !== false &&
      h.allowedYears?.includes(studentProfile.year) &&
      ((studentProfile.gender === 'MALE' && h.type === 'BOYS') ||
        (studentProfile.gender === 'FEMALE' && h.type === 'GIRLS'))
    )
    : allHostels.filter((h: any) => h.isActive !== false);

  const selectedHostel = eligibleHostels.find((h: any) => h.id === selectedHostelId);

  // ─── Rooms for selected hostel (step 2) ───
  // ALWAYS passes hostelId so backend filters at the database level
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['available-rooms', selectedHostelId],
    queryFn: () => hostelApi.getAvailableRooms(selectedHostelId!),
    enabled: !!selectedHostelId,
  });
  const rooms: any[] = (roomsData?.data as any)?.data || [];

  // For admin: also get all rooms (including full ones) for the selected hostel
  const { data: allRoomsData } = useQuery({
    queryKey: ['all-rooms', selectedHostelId],
    queryFn: () => hostelApi.getRooms({ hostelId: selectedHostelId! }),
    enabled: !!selectedHostelId && user?.role === 'ADMIN',
  });
  // getRooms returns { rooms, meta } wrapped in ApiResponse
  const adminRooms: any[] = (allRoomsData?.data as any)?.data || [];
  const displayRooms = user?.role === 'ADMIN' ? (rooms.length > 0 ? rooms : adminRooms) : rooms;

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

  const reserve = useMutation({
    mutationFn: bookingApi.reserve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservation'] });
      if (selectedHostelId) {
        queryClient.invalidateQueries({ queryKey: ['available-rooms', selectedHostelId] });
      }
    },
    onError: (error: any) => setMessage(error.response?.data?.message || 'Unable to reserve this room.'),
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

  // ─── Razorpay payment (UNTOUCHED — exactly as before) ───
  const pay = async () => {
    try {
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
          ondismiss: () =>
            setMessage('Payment window closed. You can retry the same payment order before the reservation expires.'),
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
          }
        },
      });
      checkout.on('payment.failed', () =>
        setMessage('Payment failed. Click Pay again to reopen the same order before your reservation expires.')
      );
      checkout.open();
    } catch (error: any) {
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title="Complete Room Booking"
          description="Your selected room is held temporarily while you complete payment."
          breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Browse Rooms' }]}
        />
        {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <section style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Room {reservation.room?.roomNumber} reserved
          </h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            {reservation.room?.floor?.block?.hostel?.name} · {reservation.room?.floor?.block?.name} ·{' '}
            {reservation.room?.floor?.name}
          </p>
          <p style={{ marginTop: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Hostel fee: ₹{fee.toLocaleString('en-IN')}
          </p>
          <p
            style={{
              marginTop: '0.5rem',
              color: secondsRemaining > 0 ? '#15803d' : '#dc2626',
              fontWeight: 700,
            }}
          >
            Reservation expires in {Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:
            {(secondsRemaining % 60).toString().padStart(2, '0')}
          </p>
          {orderInfo && (
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Payment order: <code>{orderInfo.orderId}</code>
              {orderInfo.reused ? ' · reopened for retry' : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button
              disabled={secondsRemaining === 0}
              onClick={pay}
              className="rounded-xl px-5 py-3 text-sm font-bold text-white gradient-bg disabled:opacity-50"
            >
              {orderInfo ? 'Retry payment' : `Pay ₹${fee.toLocaleString('en-IN')}`}
            </button>
            <button
              onClick={() => cancel.mutate(reservation.id)}
              className="rounded-xl border px-5 py-3 text-sm font-bold"
              style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            >
              Cancel reservation
            </button>
          </div>
        </section>
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

        {hostelsLoading ? (
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
            title="No hostels available"
            description={
              isStudent
                ? `No hostel is currently configured for your ${studentProfile?.gender === 'MALE' ? 'male' : 'female'} Year ${studentProfile?.year} profile. Contact the administrator.`
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
                        (f.rooms?.reduce((rs: number, r: any) => rs + (r.occupiedBeds || 0), 0) || 0),
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
        description={`${displayRooms.length} room${displayRooms.length !== 1 ? 's' : ''} in this hostel`}
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
            {displayRooms.length} rooms
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
                      {available > 0 ? `${available} bed${available > 1 ? 's' : ''} available` : 'Full'}
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

                {isStudent && (
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
                      cursor: available > 0 ? 'pointer' : 'not-allowed',
                      background:
                        available > 0
                          ? 'linear-gradient(135deg, #1e40af, #2563eb, #0d9488)'
                          : 'var(--bg-tertiary)',
                      color: available > 0 ? 'white' : 'var(--text-muted)',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      opacity: reserve.isPending ? 0.5 : 1,
                    }}
                  >
                    {reserve.isPending ? 'Reserving…' : 'Select Room'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
