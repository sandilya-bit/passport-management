import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  useApplicantStats,
} from '@/hooks/useStats';
import { useMyApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Card, CardHeader, EmptyState } from '@/components/ui/Card';
import { MonthlyApplicationsChart, StatusDistributionChart } from '@/components/charts';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadges';
import { TableSkeleton, StatCardSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { formatDate, formatRelative } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import type { ApplicationStatus, ApplicationType, PassportApplication } from '@/types';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const userId = user?.id ?? '';

  const statsQuery = useApplicantStats(userId);
  const appsQuery = useMyApplications(userId, { page: 0, size: 5, sortBy: 'applicationDate', sortDir: 'desc' });

  const stats = statsQuery.data;
  const apps = appsQuery.data?.content ?? [];

  const cards = useMemo(
    () => [
      { label: 'Total Applications', value: stats?.totalApplications ?? 0, tone: 'primary', icon: 'description' },
      { label: 'Pending Applications', value: stats?.pendingApplications ?? 0, tone: 'warning', icon: 'hourglass_top' },
      { label: 'Approved Applications', value: stats?.approvedApplications ?? 0, tone: 'success', icon: 'check_circle' },
      { label: 'Rejected Applications', value: stats?.rejectedApplications ?? 0, tone: 'danger', icon: 'cancel' },
    ] as const,
    [stats],
  );

  const firstName = user?.fullName.split(' ')[0] ?? 'there';

  return (
    <div>
      <PageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Here's an overview of your passport applications."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }]}
        actions={
          <Link to="/applications/new">
            <Button leftIcon={<span className="icon text-[17px]">add_circle</span>}>New Application</Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <DashboardCard {...c} onClick={() => navigate('/applications')} />
              </motion.div>
            ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Monthly Applications" subtitle="Volume over the last 9 months" icon="bar_chart" />
          <div className="p-4">
            {statsQuery.isLoading ? <ChartSkeleton height={280} /> : <MonthlyApplicationsChart data={stats?.monthly ?? []} />}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Status Distribution" subtitle="Across all your applications" icon="donut_small" />
          <div className="p-4">
            {statsQuery.isLoading ? <ChartSkeleton height={280} /> : <StatusDistributionChart data={stats?.statusDistribution ?? []} />}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent Activity"
            subtitle="Latest updates across the platform"
            icon="history"
            action={<Link to="/applications" className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">View all →</Link>}
          />
          <div className="p-2">
            {statsQuery.isLoading ? (
              <TableSkeleton rows={4} cols={2} />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {(stats?.activities ?? []).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-3 py-3">
                    <span
                      className={
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' +
                        (a.severity === 'success' && 'bg-success-50 text-success-500 dark:bg-success-500/15') +
                        (a.severity === 'info' && 'bg-secondary-50 text-secondary-500 dark:bg-secondary-500/15') +
                        (a.severity === 'warning' && 'bg-warning-50 text-warning-500 dark:bg-warning-500/15') +
                        (a.severity === 'danger' && 'bg-danger-50 text-danger-500 dark:bg-danger-500/15')
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
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="My Recent Applications"
            subtitle="Latest 5 applications"
            icon="description"
            action={<Link to="/applications" className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">Manage →</Link>}
          />
          {appsQuery.isLoading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : apps.length === 0 ? (
            <EmptyState
              icon="description"
              title="No applications yet"
              message="Start your first passport application today."
              action={<Link to="/applications/new"><Button>New Application</Button></Link>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 font-semibold">Application</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {apps.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/applications/${a.id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 font-medium text-primary-600 dark:text-secondary-400">{a.applicationCode}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{(a.applicationType as ApplicationType).replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{formatDate(a.applicationDate)}</td>
                      <td className="px-4 py-3"><ApplicationStatusBadge status={a.status as ApplicationStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export type { PassportApplication };
