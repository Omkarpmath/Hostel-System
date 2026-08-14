import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { operationsApi } from '@/api/operations.api';
import { PageSkeleton } from '@/components/shared/LoadingSkeleton';

export function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: operationsApi.overview });
  if (isLoading) return <PageSkeleton />;
  const overview = (data?.data as any)?.data;
  const allocation = overview?.profile?.roomAllocations?.[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        description="Your hostel information at a glance"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <section className="glass-card p-5"><h2 className="font-semibold">Room & Hostel</h2><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{allocation ? `${allocation.room?.floor?.block?.hostel?.name} · Room ${allocation.room?.roomNumber}` : 'No room has been allocated yet.'}</p></section>
        <section className="glass-card p-5"><h2 className="font-semibold">Fees</h2><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{overview?.fees?.length ? `${overview.fees.length} fee record(s) available.` : 'No fee record available.'}</p></section>
        <section className="glass-card p-5"><h2 className="font-semibold">Requests</h2><p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{overview?.leaves?.length ? `${overview.leaves.length} leave request(s).` : 'No leave requests found.'}</p></section>
      </div>{/*
      <RoleWorkspace panels={[
        {
          title: 'Room & Hostel', description: 'Your allocation and hostel details', icon: BedDouble,
          emptyTitle: 'No room allocated yet', emptyDescription: 'Your room information will appear here after allocation.',
        },
        {
          title: 'Fees & Receipts', description: 'Payment status and receipts', icon: CreditCard,
          emptyTitle: 'No fee records yet', emptyDescription: 'Generated hostel fees and receipts will appear here.',
        },
        {
          title: 'Requests', description: 'Leave applications and complaints', icon: ClipboardList,
          emptyTitle: 'Nothing to review', emptyDescription: 'Your submitted leave requests and complaints will appear here.',
        },
      ]} />*/}
    </div>
  );
}
