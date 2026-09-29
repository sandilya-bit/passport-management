import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useApplications, useDeleteApplication } from '@/hooks/useApplications';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadges';
import { formatDate } from '@/utils/format';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TYPE_LABELS,
} from '@/utils/constants';
import type { ApplicationStatus, ApplicationType, PassportApplication } from '@/types';
import { useAuthStore } from '@/store/authStore';

const statusFilterOptions = Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const typeFilterOptions = Object.entries(APPLICATION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isApplicant = user?.role === 'APPLICANT';

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('applicationDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<PassportApplication | null>(null);

  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useApplications({
    page,
    size: pageSize,
    search,
    sortBy,
    sortDir,
    status: (filters.status || '') as ApplicationStatus | '',
    applicationType: (filters.applicationType || '') as ApplicationType | '',
  });
  const deleteMutation = useDeleteApplication();

  const columns: DataTableColumn<PassportApplication>[] = [
    {
      key: 'applicationCode',
      header: 'Application ID',
      sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-primary-600 dark:text-secondary-400">{a.applicationCode}</p>
          <p className="text-xs text-slate-400">{a.id}</p>
        </div>
      ),
    },
    { key: 'applicantId', header: 'Applicant ID', hideBelow: 'md', render: (a) => <span className="font-mono text-xs">{a.applicantId}</span> },
    { key: 'applicationDate', header: 'Application Date', sortable: true, render: (a) => formatDate(a.applicationDate) },
    { key: 'applicationType', header: 'Type', sortable: true, filterable: true, filterOptions: typeFilterOptions, render: (a) => APPLICATION_TYPE_LABELS[a.applicationType] },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: statusFilterOptions,
      render: (a) => <ApplicationStatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (a) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/applications/${a.id}`)}
            title="Track / open"
            aria-label={`Open ${a.applicationCode}`}
            className="rounded p-1.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10"
          >
            <span className="icon text-[18px]">open_in_new</span>
          </button>
          {isApplicant && ['DRAFT', 'SUBMITTED'].includes(a.status) && (
            <button
              onClick={() => setDeleting(a)}
              title="Withdraw"
              aria-label={`Withdraw ${a.applicationCode}`}
              className="rounded p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
            >
              <span className="icon text-[18px]">delete</span>
            </button>
          )}
        </div>
      ),
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Passport Applications"
        subtitle={isApplicant ? 'Apply, track and manage your applications.' : 'All applications across the registry.'}
        icon="description"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Applications' }]}
        actions={
          isApplicant ? (
            <Link to="/applications/new">
              <Button leftIcon={<span className="icon text-[17px]">add_circle</span>}>New Application</Button>
            </Link>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        error={error instanceof Error ? error.message : null}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(s, d) => { setSortBy(s); setSortDir(d); }}
        filters={filters}
        onFiltersChange={setFilters}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
        onRowClick={(a) => navigate(`/applications/${a.id}`)}
        exportName="applications"
        refresh={refetch}
        emptyTitle="No applications found"
        emptyMessage={isApplicant ? 'Start your first passport application today.' : 'No applications match the current filters.'}
        emptyAction={
          isApplicant ? (
            <Link to="/applications/new"><Button>New Application</Button></Link>
          ) : undefined
        }
      />

      <ConfirmDialog
        open={!!deleting}
        title="Withdraw application?"
        message={<span>Withdraw <b>{deleting?.applicationCode}</b>? Submitted data and documents will be removed.</span>}
        confirmLabel="Withdraw"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteMutation.mutateAsync(deleting.id);
            toast({ tone: 'success', title: 'Application withdrawn' });
            setDeleting(null);
          } catch {
            toast({ tone: 'error', title: 'Withdraw failed' });
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
