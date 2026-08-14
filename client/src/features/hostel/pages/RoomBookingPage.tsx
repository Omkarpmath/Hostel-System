import { useQuery } from '@tanstack/react-query';
import { BedDouble } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { hostelApi } from '@/api/hostel.api';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export function RoomBookingPage() {
  const { data, isLoading } = useQuery({ queryKey: ['available-rooms'], queryFn: () => hostelApi.getAvailableRooms() });
  if (isLoading) return <PageSkeleton />;
  const rooms: any[] = (data?.data as any)?.data || [];

  return (
    <div className="space-y-8">
      <PageHeader title="Available Rooms" description="Availability is updated from current database allocations. Contact the administrator to request allocation." breadcrumbs={[{ label: 'Dashboard' }, { label: 'Browse Rooms' }]} />
      {rooms.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rooms.map((room) => <section key={room.id} className="glass-card p-5"><BedDouble className="h-5 w-5 text-primary-600" /><h2 className="mt-3 font-semibold">Room {room.roomNumber}</h2><p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{room.floor?.block?.hostel?.name}</p><p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Capacity: {room.capacity} · Available: {room.capacity - room.occupiedBeds}</p></section>)}</div> : <EmptyState icon={BedDouble} title="No rooms available" description="There are no eligible rooms with open capacity at the moment." />}
    </div>
  );
}
