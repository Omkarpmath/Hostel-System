import { PageHeader } from '@/components/shared/PageHeader';
import { RoleWorkspace } from '@/components/shared/RoleWorkspace';
import { ClipboardList, MessageSquareWarning, QrCode } from 'lucide-react';

export function WardenDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Warden Dashboard"
        description="Manage leave requests, complaints, and verify students"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <RoleWorkspace panels={[
        {
          title: 'Leave Requests', description: 'Applications awaiting a decision', icon: ClipboardList,
          emptyTitle: 'No leave requests', emptyDescription: 'New student leave applications will appear here.',
        },
        {
          title: 'Complaints', description: 'Issues raised by hostel residents', icon: MessageSquareWarning,
          emptyTitle: 'No open complaints', emptyDescription: 'Student complaints will appear here when submitted.',
        },
        {
          title: 'Student Verification', description: 'Verify a digital hostel ID', icon: QrCode,
          emptyTitle: 'Ready to verify', emptyDescription: 'Use the QR Verify section to verify a student ID.',
        },
      ]} />
    </div>
  );
}
