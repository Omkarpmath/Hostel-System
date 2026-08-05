import { PageHeader } from '@/components/shared/PageHeader';
import { RoleWorkspace } from '@/components/shared/RoleWorkspace';
import { QrCode, ClipboardCheck, Contact } from 'lucide-react';

export function SecurityDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Security Dashboard"
        description="QR verification, leave checks, and visitor management"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <RoleWorkspace panels={[
        {
          title: 'QR Verification', description: 'Verify a student digital hostel ID', icon: QrCode,
          emptyTitle: 'Ready to verify', emptyDescription: 'Open QR Verify when a student presents their digital ID.',
        },
        {
          title: 'Leave Verification', description: 'Approved leave exit and return checks', icon: ClipboardCheck,
          emptyTitle: 'No leave movements', emptyDescription: 'Approved student leave activity will appear here.',
        },
        {
          title: 'Visitor Register', description: 'Visitor entries and exits', icon: Contact,
          emptyTitle: 'No visitor activity', emptyDescription: 'Visitor records will appear here after entry is recorded.',
        },
      ]} />
    </div>
  );
}
