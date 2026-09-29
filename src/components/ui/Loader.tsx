import { cn } from '@/utils/cn';

export function Loader({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('animate-spin icon text-slate-400', className)}
      style={{ fontSize: size }}
    >
      progress_activity
    </span>
  );
}

export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-light dark:bg-surface-dark">
      <div className="relative">
        <span className="animate-spin icon text-[44px] text-primary-600">progress_activity</span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="icon text-[18px] text-secondary-500">passport</span>
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
