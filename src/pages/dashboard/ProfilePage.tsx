import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { RoleBadge } from '@/components/ui/StatusBadges';
import { initials, formatDate } from '@/utils/format';
import { ROLE_LABELS } from '@/utils/constants';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My Profile"
        subtitle="Account details and session"
        icon="person"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Profile' }]}
      />
      <Card>
        <CardHeader title="Account" subtitle="Your registered identity" icon="badge" />
        <div className="p-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white">
              {initials(user?.fullName ?? 'U')}
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink-light dark:text-ink-dark">{user?.fullName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {user && <RoleBadge role={user.role} />}
                <span className="badge-base bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <span className="icon text-[14px]">call</span>
                  {user?.phone}
                </span>
              </div>
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-slate-200 dark:border-slate-800 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">User ID</dt>
              <dd className="mt-1 font-mono text-sm text-ink-light dark:text-ink-dark">{user?.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</dt>
              <dd className="mt-1 text-sm text-ink-light dark:text-ink-dark">{user ? ROLE_LABELS[user.role] : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered On</dt>
              <dd className="mt-1 text-sm text-ink-light dark:text-ink-dark">{formatDate(user?.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Session</dt>
              <dd className="mt-1 text-sm text-ink-light dark:text-ink-dark">JWT · access + refresh token</dd>
            </div>
          </dl>

          <div className="mt-8 flex justify-end">
            <Button variant="danger" onClick={logout} leftIcon={<span className="icon text-[17px]">logout</span>}>
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
