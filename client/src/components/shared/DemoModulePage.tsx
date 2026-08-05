import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, DatabaseZap } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { EmptyState } from './EmptyState';
import { useAuth } from '@/providers/AuthProvider';

export interface DemoModuleConfig {
  title: string;
  description: string;
  entityLabel: string;
  columns: string[];
  sample: string[];
}

/**
 * Interactive browser-only module preview. It intentionally never sends
 * sample records to the API or database.
 */
export function DemoModulePage({ config }: { config: DemoModuleConfig }) {
  const { isPreviewMode } = useAuth();
  const [records, setRecords] = useState<string[][]>(() => isPreviewMode ? [config.sample] : []);
  const [query, setQuery] = useState('');

  const visibleRecords = useMemo(
    () => records.filter((record) => record.join(' ').toLowerCase().includes(query.toLowerCase())),
    [query, records],
  );

  const addPreviewRecord = () => {
    const nextNumber = String(records.length + 1).padStart(3, '0');
    setRecords((current) => [...current, config.sample.map((value, index) =>
      index === 0 ? `${value.split('-')[0]}-DEMO-${nextNumber}` : value,
    )]);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={config.title}
        description={config.description}
        breadcrumbs={[{ label: 'Dashboard' }, { label: config.title }]}
        actions={
          <button
            type="button"
            onClick={addPreviewRecord}
            disabled={!isPreviewMode}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white gradient-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add {config.entityLabel}
          </button>
        }
      />

      {isPreviewMode && (
        <div className="preview-note rounded-2xl px-5 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Local preview data only. Add and remove records here to test the interface; nothing is saved to the database.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Preview records</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{records.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Data source</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{isPreviewMode ? 'Local browser preview' : 'Connected API'}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Module status</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Ready to test</p>
        </div>
      </div>

      <section className="glass-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{config.entityLabel} records</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{records.length} record{records.length === 1 ? '' : 's'} in this preview</p>
          </div>
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${config.entityLabel.toLowerCase()}s`}
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary-500"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </label>
        </div>

        {visibleRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="demo-table w-full min-w-full sm:min-w-[680px] text-left">
              <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <tr>
                  {config.columns.map((column) => (
                    <th key={column} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{column}</th>
                  ))}
                  <th className="w-16 px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record, rowIndex) => (
                  <tr key={`${record[0]}-${rowIndex}`} className="border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                    {record.map((value, index) => (
                      <td key={`${value}-${index}`} className="whitespace-nowrap px-5 py-4 text-sm" style={{ color: index === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: index === 0 ? 600 : 400 }}>{value}</td>
                    ))}
                    <td className="px-5 py-4 text-right">
                      {isPreviewMode && (
                        <button
                          type="button"
                          onClick={() => setRecords((current) => current.filter((item) => item !== record))}
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label={`Remove ${record[0]}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={DatabaseZap} title="No matching records" description={query ? 'Try a different search term.' : `Add a ${config.entityLabel.toLowerCase()} to begin.`} />
        )}
      </section>
    </div>
  );
}
