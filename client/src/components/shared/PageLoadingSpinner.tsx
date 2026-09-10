import { Loader2 } from 'lucide-react';

interface PageLoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export function PageLoadingSpinner({
  fullScreen = false,
  message = 'Loading...',
}: PageLoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center transition-opacity duration-200 ${
        fullScreen
          ? 'min-h-screen w-full'
          : 'min-h-[40vh] w-full py-16'
      }`}
      style={{
        backgroundColor: fullScreen ? 'var(--bg-secondary)' : 'transparent',
      }}
      role="status"
      aria-label="Loading page content"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary-500/20 animate-ping absolute inset-0 opacity-25" />
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
        <p
          className="text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-slate-400"
        >
          {message}
        </p>
      </div>
    </div>
  );
}
