import { PageHeader } from '@/components/shared/PageHeader';
import { RoleWorkspace } from '@/components/shared/RoleWorkspace';
import { useAuth } from '@/providers/AuthProvider';
import { BedDouble, CreditCard, ClipboardList } from 'lucide-react';

export function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.firstName}!`}
        description="Your hostel information at a glance"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
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
      ]} />
    </div>
  );
}
