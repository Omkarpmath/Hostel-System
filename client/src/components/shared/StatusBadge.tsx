import { cn, getStatusColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  label?: string;
  title?: string;
}

export function StatusBadge({ status, className, label, title }: StatusBadgeProps) {
  const displayStatus =
    label ||
    (status === 'PARTIALLY_OCCUPIED' ? 'Partially...' : status.replace(/_/g, ' '));
  const fullTitle = title || (status === 'PARTIALLY_OCCUPIED' ? 'Partially Occupied' : status.replace(/_/g, ' '));

  return (
    <span
      title={fullTitle}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap shrink-0',
        getStatusColor(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span className="whitespace-nowrap">{displayStatus.toLowerCase()}</span>
    </span>
  );
}

