import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  type LucideIcon
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'teal' | 'amber' | 'red' | 'green' | 'purple';
  className?: string;
  delay?: number;
}

const colorMap = {
  blue: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-100 dark:border-primary-800/30',
  },
  teal: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    icon: 'text-accent-600 dark:text-accent-400',
    border: 'border-accent-100 dark:border-accent-800/30',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-800/30',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-800/30',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-100 dark:border-green-800/30',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-800/30',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  className,
  delay = 0,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: 'easeOut' }}
      className={cn(
        'glass-card p-5 group cursor-default',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.1 + 0.2 }}
            className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </motion.p>
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl border transition-transform duration-200 group-hover:scale-110',
            colors.bg,
            colors.border
          )}
        >
          <Icon className={cn('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </motion.div>
  );
}
