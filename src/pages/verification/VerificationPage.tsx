import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { VerificationOutcomeBadge } from '@/components/ui/StatusBadges';
import { useVerifications, useCreateVerification, useDecideVerification } from '@/hooks/useVerifications';
import { formatDate, formatDateTime } from '@/utils/format';
import { VERIFICATION_TYPE_LABELS } from '@/utils/constants';
import type { Verification, VerificationType } from '@/types';

const decisionSchema = z.object({
  remarks: z.string().min(10, 'Add at least 10 characters of remarks for the record'),
});

type DecisionValues = z.infer<typeof decisionSchema>;

export default function VerificationPage() {
  const { toast } = useToast();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('verificationDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [deciding, setDeciding] = useState<{ verification: Verification; outcome: 'APPROVED' | 'REJECTED' } | null>(null);
  const [creating, setCreating] = useState(false);
  const [historyOf, setHistoryOf] = useState<Verification | null>(null);
  const [cAppId, setCAppId] = useState('');
  const [cType, setCType] = useState<VerificationType>('DOCUMENT');

  const { data, isLoading, error, refetch } = useVerifications({
    page,
    size: pageSize,
    search,
    sortBy,
    sortDir,
    verificationType: (filters.verificationType || '') as VerificationType | '',
    status: (filters.status || '') as Verification['status'] | '',
  });
  const createMutation = useCreateVerification();
  const decideMutation = useDecideVerification();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DecisionValues>({ resolver: zodResolver(decisionSchema) });

  const columns: DataTableColumn<Verification>[] = [
    {
      key: 'verificationCode',
      header: 'Verification ID',
      sortable: true,
      render: (v) => (
        <div>
          <p className="font-semibold text-ink-light dark:text-ink-dark">{v.verificationCode}</p>
          <p className="text-xs text-slate-400">{v.officerName}</p>
        </div>
      ),
    },
    { key: 'applicationId', header: 'Application', sortable: false, render: (v) => <span className="font-mono text-xs">{v.applicationId}</span> },
    { key: 'verificationType', header: 'Type', sortable: true, filterable: true, filterOptions: Object.entries(VERIFICATION_TYPE_LABELS).map(([value, label]) => ({ value, label })), render: (v) => VERIFICATION_TYPE_LABELS[v.verificationType] },
    { key: 'verificationDate', header: 'Date', sortable: true, render: (v) => formatDate(v.verificationDate) },
    { key: 'status', header: 'Status', sortable: true, filterable: true, filterOptions: [{ value: 'PENDING', label: 'Pending' }, { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' }], render: (v) => <VerificationOutcomeBadge status={v.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (v) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setHistoryOf(v)} title="History & remarks" aria-label="View history" className="rounded p-1.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10">
            <span className="icon text-[18px]">history</span>
          </button>
          {v.status === 'PENDING' && (
            <>
              <button onClick={() => { setDeciding({ verification: v, outcome: 'APPROVED' }); reset({ remarks: '' }); }} title="Approve" aria-label="Approve verification" className="rounded p-1.5 text-slate-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10">
                <span className="icon text-[18px]">check_circle</span>
              </button>
              <button onClick={() => { setDeciding({ verification: v, outcome: 'REJECTED' }); reset({ remarks: '' }); }} title="Reject" aria-label="Reject verification" className="rounded p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10">
                <span className="icon text-[18px]">cancel</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Verification Queue"
        subtitle="Review applications, record decisions and remarks."
        icon="fact_check"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Verification' }]}
        actions={<Button onClick={() => setCreating(true)} leftIcon={<span className="icon text-[17px]">post_add</span>}>New Verification</Button>}
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
        exportName="verifications"
        refresh={refetch}
        emptyTitle="No verifications found"
        emptyMessage="Verifications assigned to you will appear here."
      />

      {/* Decide modal */}
      <Modal
        open={!!deciding}
        onClose={() => setDeciding(null)}
        title={deciding?.outcome === 'APPROVED' ? 'Approve Verification' : 'Reject Verification'}
        description={deciding ? `${deciding.verification.verificationCode} · ${VERIFICATION_TYPE_LABELS[deciding.verification.verificationType]}` : ''}
        size="md"
      >
        <form onSubmit={handleSubmit(async (values) => {
          if (!deciding) return;
          try {
            await decideMutation.mutateAsync({ id: deciding.verification.id, payload: { status: deciding.outcome, remarks: values.remarks } });
            toast({ tone: 'success', title: `Verification ${deciding.outcome.toLowerCase()}`, message: deciding.verification.verificationCode });
            setDeciding(null);
          } catch {
            toast({ tone: 'error', title: 'Decision failed' });
          }
        })} noValidate>
          <div className={'mb-4 rounded-xl p-4 text-sm ' + (deciding?.outcome === 'APPROVED' ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' : 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400')}>
            <p className="flex items-center gap-2 font-semibold">
              <span className="icon text-[18px]">{deciding?.outcome === 'APPROVED' ? 'task_alt' : 'block'}</span>
              {deciding?.outcome === 'APPROVED' ? 'This will move the application to Approved.' : 'The application will be marked Rejected.'}
            </p>
          </div>
          <Textarea
            label="Officer Remarks"
            required
            rows={4}
            placeholder="Record findings, document checks and field notes…"
            error={errors.remarks?.message}
            {...register('remarks')}
          />
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button type="button" variant="outline" onClick={() => setDeciding(null)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || decideMutation.isPending} variant={deciding?.outcome === 'APPROVED' ? 'success' : 'danger'}>
              Confirm {deciding?.outcome === 'APPROVED' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create verification modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New Verification" description="Assign a verification to an application." size="md">
        <div className="space-y-4">
          <Select
            label="Application ID"
            required
            value={cAppId}
            onChange={(e) => setCAppId(e.target.value)}
            options={[{ value: '', label: 'Enter or select application…' }, ...Array.from(new Set((data?.content ?? []).map((v) => v.applicationId))).map((id) => ({ value: id, label: id }))]}
          />
          <Select
            label="Verification Type"
            required
            value={cType}
            onChange={(e) => setCType(e.target.value as VerificationType)}
            options={Object.entries(VERIFICATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
          <Button
            loading={createMutation.isPending}
            onClick={async () => {
              if (!cAppId) {
                toast({ tone: 'warning', title: 'Select an application' });
                return;
              }
              try {
                await createMutation.mutateAsync({ applicationId: cAppId, verificationType: cType });
                toast({ tone: 'success', title: 'Verification created', message: 'It is now pending review.' });
                setCreating(false);
              } catch {
                toast({ tone: 'error', title: 'Creation failed' });
              }
            }}
          >
            Create
          </Button>
        </div>
      </Modal>

      {/* History modal */}
      <Modal open={!!historyOf} onClose={() => setHistoryOf(null)} title="Verification Record" size="md">
        {historyOf && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-ink-light dark:text-ink-dark">{historyOf.verificationCode}</p>
                <p className="text-xs text-slate-400">Officer: {historyOf.officerName}</p>
              </div>
              <VerificationOutcomeBadge status={historyOf.status} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div><dt className="text-xs font-semibold uppercase text-slate-400">Application</dt><dd className="mt-1 font-mono text-xs">{historyOf.applicationId}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-400">Type</dt><dd className="mt-1 text-sm">{VERIFICATION_TYPE_LABELS[historyOf.verificationType]}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-400">Verification Date</dt><dd className="mt-1 text-sm">{formatDateTime(historyOf.verificationDate)}</dd></div>
            </dl>
            <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remarks</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{historyOf.remarks || 'No remarks recorded yet.'}</p>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">History</p>
              <ol className="space-y-2.5">
                {[
                  { label: 'Verification created', at: historyOf.verificationDate, icon: 'post_add', tone: 'text-slate-400' },
                  historyOf.status !== 'PENDING'
                    ? { label: `Decision: ${historyOf.status}`, at: historyOf.verificationDate, icon: historyOf.status === 'APPROVED' ? 'check_circle' : 'cancel', tone: historyOf.status === 'APPROVED' ? 'text-success-500' : 'text-danger-500' }
                    : { label: 'Awaiting officer decision', at: null, icon: 'hourglass_top', tone: 'text-warning-500' },
                ].map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm">
                    <span className={'icon text-[18px] ' + h.tone}>{h.icon}</span>
                    <span className="text-slate-600 dark:text-slate-300">{h.label}</span>
                    {h.at && <span className="ml-auto text-xs text-slate-400">{formatDateTime(h.at)}</span>}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => setHistoryOf(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
