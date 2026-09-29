import { cn } from '@/utils/cn';

const iconMap: Record<string, { icon: string; classes: string }> = {
  primary: { icon: 'description', classes: 'bg-primary-50 text-primary-600 dark:bg-primary-600/15 dark:text-primary-300' },
  secondary: { icon: 'trending_up', classes: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-300' },
  success: { icon: 'check_circle', classes: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400' },
  warning: { icon: 'hourglass_top', classes: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400' },
  danger: { icon: 'cancel', classes: 'bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400' },
};

export interface DashboardCardProps {
  label: string;
  value: number | string;
  delta?: number;
  tone?: keyof typeof iconMap;
  icon?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function DashboardCard({ label, value, delta, tone = 'primary', icon, loading, onClick }: DashboardCardProps) {
  const cfg = iconMap[tone];
  const displayValue = typeof value === 'number' ? value.toLocaleString('en-IN') : value;

  return (
    <button
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group w-full text-left card p-5 transition-all duration-200',
        onClick && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110', cfg.classes)}>
          <span className="icon text-[22px]" aria-hidden>{icon ?? cfg.icon}</span>
        </span>
        {typeof delta === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
              delta >= 0 ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' : 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400',
            )}
          >
            <span className="icon text-[14px]">{delta >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-ink-light dark:text-ink-dark tabular-nums">
        {loading ? <span className="inline-block h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : displayValue}
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </button>
  );
}
