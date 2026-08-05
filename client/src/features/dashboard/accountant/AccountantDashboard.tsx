import { PageHeader } from '@/components/shared/PageHeader';
import { RoleWorkspace } from '@/components/shared/RoleWorkspace';
import { CreditCard, ReceiptText, CircleDollarSign } from 'lucide-react';

export function AccountantDashboard() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Accountant Dashboard"
        description="Fee collection, receipts, and payment analytics"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <RoleWorkspace panels={[
        {
          title: 'Fee Collection', description: 'Hostel fee collection activity', icon: CircleDollarSign,
          emptyTitle: 'No fee records', emptyDescription: 'Generated student fee records will appear here.',
        },
        {
          title: 'Payment Activity', description: 'Completed and pending payments', icon: CreditCard,
          emptyTitle: 'No payment activity', emptyDescription: 'Payment updates will appear here when fees are collected.',
        },
        {
          title: 'Receipts', description: 'Issued payment receipts', icon: ReceiptText,
          emptyTitle: 'No receipts issued', emptyDescription: 'Receipts will be available here after payment confirmation.',
        },
      ]} />
    </div>
  );
}
