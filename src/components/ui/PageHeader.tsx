import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="icon text-[16px] text-slate-300 dark:text-slate-600">chevron_right</span>}
            {item.to && i < items.length - 1 ? (
              <Link
                to={item.to}
                className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-secondary-400 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink-light dark:text-ink-dark">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  icon,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: string;
  breadcrumbs?: { label: string; to?: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm">
              <span className="icon text-[24px]" aria-hidden>{icon}</span>
            </span>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-light dark:text-ink-dark">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}

export function SectionTitle({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      <h2 className="text-lg font-semibold text-ink-light dark:text-ink-dark">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}
