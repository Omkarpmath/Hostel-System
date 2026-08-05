import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

export interface WorkspacePanel {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}

interface RoleWorkspaceProps {
  panels: WorkspacePanel[];
}

/**
 * A data-free dashboard workspace used until the connected API has records.
 * It deliberately contains no fabricated operational data.
 */
export function RoleWorkspace({ panels }: RoleWorkspaceProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {panels.map((panel, index) => {
        const Icon = panel.icon;

        return (
          <motion.section
            key={panel.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="glass-card min-h-[300px] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary-50 ring-1 ring-primary-100 dark:bg-primary-900/30 dark:ring-primary-800/40">
                  <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {panel.title}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {panel.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
              <Inbox className="w-9 h-9 mb-3" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {panel.emptyTitle}
              </h3>
              <p className="text-sm max-w-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                {panel.emptyDescription}
              </p>
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
