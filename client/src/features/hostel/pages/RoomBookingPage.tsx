import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BedDouble, CheckCircle2, Building2, Users, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { hostelApi } from '@/api/hostel.api';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { motion } from 'framer-motion';
import { bookingApi } from '@/api/booking.api';

export function RoomBookingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isStudent = user?.role === 'STUDENT';
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [orderInfo, setOrderInfo] = useState<{ orderId: string; reused?: boolean } | null>(null);

  // If student, check if they already have a room allocation
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
    enabled: isStudent,
  });

  const profile = (profileData?.data as any)?.data;
  const activeAllocation = profile?.studentProfile?.roomAllocations?.find(
    (a: any) => a.status === 'ACTIVE'
  );

  const { data: hostelsData } = useQuery({
    queryKey: ['hostels-for-room-eligibility'],
    queryFn: () => hostelApi.getAll(),
    enabled: isStudent && Boolean(profile?.studentProfile),
  });
  const studentProfile = profile?.studentProfile;
  const compatibleHostelExists = !studentProfile || (hostelsData?.data as any)?.data?.some((hostel: any) =>
    hostel.isActive !== false
    && hostel.allowedYears?.includes(studentProfile.year)
    && ((studentProfile.gender === 'MALE' && hostel.type === 'BOYS') || (studentProfile.gender === 'FEMALE' && hostel.type === 'GIRLS'))
  );

  // Fetch available rooms
  const { data, isLoading } = useQuery({
    queryKey: ['available-rooms'],
    queryFn: () => hostelApi.getAvailableRooms(),
  });
  const rooms: any[] = (data?.data as any)?.data || [];

  const { data: reservationData } = useQuery({ queryKey: ['my-reservation'], queryFn: bookingApi.active, enabled: isStudent });
  const reservation: any = (reservationData?.data as any)?.data;
  const reserve = useMutation({ mutationFn: bookingApi.reserve, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-reservation'] }); queryClient.invalidateQueries({ queryKey: ['available-rooms'] }); }, onError: (error: any) => setMessage(error.response?.data?.message || 'Unable to reserve this room.') });
  const cancel = useMutation({
    mutationFn: bookingApi.cancel,
    onSuccess: async () => {
      queryClient.setQueryData(['my-reservation'], (old: any) => old ? { ...old, data: { ...old.data, data: null } } : old);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['my-reservation'] }),
        queryClient.refetchQueries({ queryKey: ['available-rooms'] }),
      ]);
      setOrderInfo(null);
      setMessage('Reservation cancelled. Available rooms have been refreshed.');
    },
    onError: (error: any) => setMessage(error.response?.data?.message || 'Unable to cancel the reservation.'),
  });
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  useEffect(() => { if (!reservation?.expiresAt) return; const tick = () => setSecondsRemaining(Math.max(0, Math.ceil((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000))); tick(); const interval = window.setInterval(tick, 1000); return () => window.clearInterval(interval); }, [reservation?.expiresAt]);

  const pay = async () => {
    try {
      setMessage('');
      const order = (await bookingApi.createOrder(reservation.id)).data.data;
      if (!order) throw new Error('Payment order could not be created.');
      setOrderInfo({ orderId: order.orderId, reused: (order as any).reused });
      if (!(window as any).Razorpay) throw new Error('Razorpay Checkout has not loaded. Refresh and try again.');
      const checkout = new (window as any).Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'BMSCE Hostel',
        description: `Room ${reservation.room.roomNumber} hostel fee`,
        order_id: order.orderId,
        prefill: { name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), email: user?.email },
        modal: { ondismiss: () => setMessage('Payment window closed. You can retry the same payment order before the reservation expires.') },
        handler: async (response: any) => { try { await bookingApi.verify({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }); queryClient.invalidateQueries({ queryKey: ['profile'] }); queryClient.invalidateQueries({ queryKey: ['available-rooms'] }); queryClient.invalidateQueries({ queryKey: ['my-reservation'] }); setMessage('Payment verified. Your room has been allocated.'); } catch (error: any) { setMessage(error.response?.data?.message || 'Payment was received but room allocation could not be completed.'); } },
      });
      checkout.on('payment.failed', () => setMessage('Payment failed. Click Pay again to reopen the same order before your reservation expires.'));
      checkout.open();
    } catch (error: any) { setMessage(error.response?.data?.message || error.message || 'Unable to start Razorpay payment.'); }
  };

  // Also fetch all rooms for admin view
  const { data: allRoomsData } = useQuery({
    queryKey: ['all-rooms'],
    queryFn: () => hostelApi.getRooms(),
    enabled: user?.role === 'ADMIN',
  });
  const allRooms: any[] = (allRoomsData?.data as any)?.data || [];

  const displayRooms = user?.role === 'ADMIN' ? (rooms.length > 0 ? rooms : allRooms) : rooms;

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-primary)',
    borderRadius: '1rem',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  // If student already has a room, show that
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
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {[
              { label: 'Room Number', value: room?.roomNumber || 'N/A', icon: BedDouble },
              { label: 'Hostel', value: hostelName, icon: Building2 },
              { label: 'Capacity', value: `${room?.occupiedBeds || 0}/${room?.capacity || 0} beds`, icon: Users },
              { label: 'Fee/Semester', value: room?.feePerSemester ? `₹${room.feePerSemester.toLocaleString('en-IN')}` : 'N/A', icon: MapPin },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                  <item.icon style={{ width: '0.875rem', height: '0.875rem', color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader title="Available Rooms" description="Loading..." breadcrumbs={[{ label: 'Dashboard' }, { label: 'Browse Rooms' }]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ ...cardStyle, height: '10rem', animation: 'pulse 2s ease-in-out infinite', opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (isStudent && reservation) {
    const fee = Number(reservation.room?.feePerSemester || 0);
    return <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}><PageHeader title="Complete Room Booking" description="Your selected room is held temporarily while you complete payment." breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Browse Rooms' }]} />{message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}<section style={cardStyle}><h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Room {reservation.room?.roomNumber} reserved</h2><p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{reservation.room?.floor?.block?.hostel?.name} · {reservation.room?.floor?.block?.name} · {reservation.room?.floor?.name}</p><p style={{ marginTop: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Hostel fee: ₹{fee.toLocaleString('en-IN')}</p><p style={{ marginTop: '0.5rem', color: secondsRemaining > 0 ? '#15803d' : '#dc2626', fontWeight: 700 }}>Reservation expires in {Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:{(secondsRemaining % 60).toString().padStart(2, '0')}</p>{orderInfo && <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Payment order: <code>{orderInfo.orderId}</code>{orderInfo.reused ? ' · reopened for retry' : ''}</p>}<div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}><button disabled={secondsRemaining === 0} onClick={pay} className="rounded-xl px-5 py-3 text-sm font-bold text-white gradient-bg disabled:opacity-50">{orderInfo ? 'Retry payment' : `Pay ₹${fee.toLocaleString('en-IN')}`}</button><button onClick={() => cancel.mutate(reservation.id)} className="rounded-xl border px-5 py-3 text-sm font-bold" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>Cancel reservation</button></div></section></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <PageHeader
        title={isStudent ? 'Available Rooms' : 'Room Management'}
        description={isStudent
          ? 'Browse available rooms. Contact the administrator to request allocation.'
          : `Showing ${displayRooms.length} room(s) from the database. Add rooms via Hostels → Block → Floor → Room.`
        }
        breadcrumbs={[
          { label: 'Dashboard', href: isStudent ? '/student/dashboard' : '/admin/dashboard' },
          { label: isStudent ? 'Browse Rooms' : 'Rooms' },
        ]}
      />

      {displayRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms available"
          description={isStudent
            ? compatibleHostelExists
              ? 'There are no eligible rooms with open capacity at the moment. Please check again later.'
              : `No hostel is currently configured for your ${studentProfile?.gender === 'MALE' ? 'male' : studentProfile?.gender === 'FEMALE' ? 'female' : ''} Year ${studentProfile?.year} profile. Ask an administrator to update the hostel allowed years.`
            : 'No rooms found. Add rooms by going to Hostels → expand a hostel → add Block → Floor → Room.'
          }
        />
      ) : (
        <>{message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {displayRooms.map((room: any, i: number) => {
            const hostelName = room.floor?.block?.hostel?.name || 'Unknown';
            const hostelType = room.floor?.block?.hostel?.type;
            const available = room.capacity - room.occupiedBeds;
            const blockName = room.floor?.block?.name || '';
            const floorName = room.floor?.name || '';

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                style={cardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.5rem', borderRadius: '0.625rem',
                    backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                  }}>
                    <BedDouble style={{ width: '1.25rem', height: '1.25rem', color: isDark ? '#60a5fa' : '#2563eb' }} />
                  </div>
                  <StatusBadge status={room.status || 'AVAILABLE'} />
                </div>

                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Room {room.roomNumber}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {hostelName}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {blockName && <span>{blockName} · {floorName}</span>}
                  <span>Type: {room.type || 'N/A'} · Capacity: {room.capacity}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '9999px',
                      backgroundColor: available > 0
                        ? (isDark ? 'rgba(22,163,74,0.15)' : '#dcfce7')
                        : (isDark ? 'rgba(220,38,38,0.15)' : '#fee2e2'),
                      color: available > 0
                        ? (isDark ? '#4ade80' : '#15803d')
                        : (isDark ? '#fca5a5' : '#dc2626'),
                    }}>
                      {available > 0 ? `${available} bed${available > 1 ? 's' : ''} available` : 'Full'}
                    </span>
                    {room.feePerSemester && (
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{room.feePerSemester.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {hostelType && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-primary)' }}>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                      backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe',
                      color: isDark ? '#93c5fd' : '#1d4ed8',
                    }}>{hostelType}</span>
                    {room.floor?.block?.hostel?.allowedYears?.length > 0 && (
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px',
                        backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : '#ccfbf1',
                        color: isDark ? '#2dd4bf' : '#0f766e',
                      }}>Year {room.floor.block.hostel.allowedYears.join(', ')}</span>
                    )}
                  </div>
                )}
                {isStudent && <button disabled={reserve.isPending || available <= 0} onClick={() => reserve.mutate(room.id)} className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white gradient-bg disabled:opacity-50">{reserve.isPending ? 'Reserving…' : 'Select room'}</button>}
              </motion.div>
            );
          })}
        </div></>
      )}
    </div>
  );
}
