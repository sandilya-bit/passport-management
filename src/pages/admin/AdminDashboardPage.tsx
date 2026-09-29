import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminStats } from '@/hooks/useStats';
import { PageHeader } from '@/components/ui/PageHeader';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { MonthlyApplicationsChart, StatusDistributionChart, ApprovalTrendChart } from '@/components/charts';
import { formatNumber, formatRelative } from '@/utils/format';

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminStats();

  const counts = [
    { label: 'Applicants', value: data?.applicantCount ?? 0, tone: 'primary', icon: 'groups', to: '/applicants' },
    { label: 'Applications', value: data?.applicationCount ?? 0, tone: 'secondary', icon: 'description', to: '/applications' },
    { label: 'Documents', value: data?.documentCount ?? 0, tone: 'warning', icon: 'folder_shared', to: '/documents' },
    { label: 'Verifications', value: data?.verificationCount ?? 0, tone: 'danger', icon: 'fact_check', to: '/verification' },
    { label: 'Passports Issued', value: data?.passportCount ?? 0, tone: 'success', icon: 'card_travel', to: '/passports' },
  ] as const;

  const system = data?.system;

  return (
    <div>
      <PageHeader
        title="System Administration"
        subtitle="Platform-wide statistics, activity and health monitoring."
        icon="admin_panel_settings"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'System Admin' }]}
        actions={
          <button onClick={() => refetch()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="icon text-[17px]">refresh</span> Refresh Data
          </button>
        }
      />

      {/* Counts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : counts.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={c.to} className="block">
                  <DashboardCard {...c} />
                </Link>
              </motion.div>
            ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Monthly Application Volume" subtitle="Platform-wide, last 9 months" icon="bar_chart" />
          <div className="p-4">{isLoading ? <ChartSkeleton /> : <MonthlyApplicationsChart data={data?.monthly ?? []} />}</div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Status Distribution" icon="donut_small" />
          <div className="p-4">{isLoading ? <ChartSkeleton /> : <StatusDistributionChart data={data?.statusDistribution ?? []} />}</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Approval vs Rejection Trend" icon="trending_up" />
          <div className="p-4">{isLoading ? <ChartSkeleton height={240} /> : <ApprovalTrendChart data={data?.monthly ?? []} height={240} />}</div>
        </Card>

        {/* System monitoring */}
        <Card>
          <CardHeader title="System Monitoring" subtitle="Live platform health" icon="monitor_heart" action={<Badge tone="success" dot>All systems operational</Badge>} />
          <div className="grid grid-cols-2 gap-4 p-5">
            {[
              { label: 'Uptime (30d)', value: system ? `${system.uptimePercent}%` : '—', icon: 'cloud_done', tone: 'text-success-500' },
              { label: 'Avg API Latency', value: system ? `${system.apiLatencyMs} ms` : '—', icon: 'speed', tone: 'text-secondary-500' },
              { label: 'Job Queue Depth', value: system ? formatNumber(system.queueDepth) : '—', icon: 'layers', tone: 'text-warning-500' },
              { label: 'DB Storage Used', value: system ? `${system.dbStorageUsedPercent}%` : '—', icon: 'database', tone: 'text-primary-600' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <span className={'icon text-[22px] ' + m.tone}>{m.icon}</span>
                <p className="mt-2 text-xl font-bold tabular-nums text-ink-light dark:text-ink-dark">{m.value}</p>
                <p className="text-xs text-slate-400">{m.label}</p>
              </div>
            ))}
            <div className="col-span-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Database storage</span><span>{system?.dbStorageUsedPercent ?? 0}% of 500 GB</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-secondary-500 to-primary-600 transition-all" style={{ width: `${system?.dbStorageUsedPercent ?? 0}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent activities */}
      <Card className="mt-6">
        <CardHeader title="Recent Activities" subtitle="Audit trail across the platform" icon="history" />
        {isLoading ? (
          <TableSkeleton rows={6} cols={3} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {(data?.activities ?? []).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' +
                    (a.severity === 'success' ? 'bg-success-50 text-success-500 dark:bg-success-500/15' : '') +
                    (a.severity === 'info' ? 'bg-secondary-50 text-secondary-500 dark:bg-secondary-500/15' : '') +
                    (a.severity === 'warning' ? 'bg-warning-50 text-warning-500 dark:bg-warning-500/15' : '') +
                    (a.severity === 'danger' ? 'bg-danger-50 text-danger-500 dark:bg-danger-500/15' : '')
                  }
                >
                  <span className="icon text-[16px]">
                    {a.severity === 'success' ? 'check_circle' : a.severity === 'danger' ? 'cancel' : a.severity === 'warning' ? 'warning' : 'info'}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <b className="text-ink-light dark:text-ink-dark">{a.actor}</b> {a.action} <b>{a.target}</b>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatRelative(a.timestamp)}</p>
                </div>
                <Badge tone={a.severity === 'success' ? 'success' : a.severity === 'danger' ? 'danger' : a.severity === 'warning' ? 'warning' : 'secondary'}>
                  {a.severity}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
