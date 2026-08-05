import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="page-header space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link
            to="/"
            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" />
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-[28px] font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
