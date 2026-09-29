import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { PaymentStatusBadge } from '@/components/ui/StatusBadges';
import { usePayments, usePayFee } from '@/hooks/usePayments';
import { useMyApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { paymentService } from '@/services/paymentService';
import { formatDate, formatCurrency } from '@/utils/format';
import { FEE_SCHEDULE, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/utils/constants';
import type { ApplicationType, Payment, PaymentStatus } from '@/types';

export default function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const isApplicant = user?.role === 'APPLICANT';
  const { toast } = useToast();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('paymentDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [payOpen, setPayOpen] = useState(false);
  const [invoicing, setInvoicing] = useState<Payment | null>(null);
  const [pAppId, setPAppId] = useState('');
  const [pMethod, setPMethod] = useState<Payment['method']>('UPI');

  const { data: myApps } = useMyApplications(user?.id ?? '', { page: 0, size: 50 });
  const { data, isLoading, error, refetch } = usePayments({
    page,
    size: pageSize,
    search,
    sortBy,
    sortDir,
    paymentStatus: (filters.paymentStatus || '') as PaymentStatus | '',
  });
  const payMutation = usePayFee();

  const myAppsMap = useMemo(() => new Map((myApps?.content ?? []).map((a) => [a.id, a])), [myApps]);

  const rows = useMemo(() => {
    const content = data?.content ?? [];
    if (isApplicant) {
      return content.filter((p) => myAppsMap.size === 0 || myAppsMap.has(p.applicationId));
    }
    return content;
  }, [data, isApplicant, myAppsMap]);

  const summary = useMemo(() => {
    const all = rows;
    return {
      totalPaid: all.filter((p) => p.paymentStatus === 'PAID').reduce((s, p) => s + p.amount, 0),
      pending: all.filter((p) => p.paymentStatus === 'PENDING').length,
      failed: all.filter((p) => p.paymentStatus === 'FAILED').length,
      refunded: all.filter((p) => p.paymentStatus === 'REFUNDED').length,
    };
  }, [rows]);

  const unpaidApps = (myApps?.content ?? []).filter((a) =>
    !rows.some((p) => p.applicationId === a.id && p.paymentStatus === 'PAID'),
  );

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'receiptNo',
      header: 'Receipt No',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-ink-light dark:text-ink-dark">{p.receiptNo}</p>
          <p className="font-mono text-xs text-slate-400">{p.id}</p>
        </div>
      ),
    },
    { key: 'applicationId', header: 'Application', hideBelow: 'md', render: (p) => <span className="font-mono text-xs">{myAppsMap.get(p.applicationId)?.applicationCode ?? p.applicationId}</span> },
    { key: 'amount', header: 'Amount', sortable: true, render: (p) => <span className="font-semibold tabular-nums">{formatCurrency(p.amount)}</span> },
    { key: 'method', header: 'Method', hideBelow: 'sm', filterable: true, filterOptions: Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })), render: (p) => PAYMENT_METHOD_LABELS[p.method] ?? p.method },
    { key: 'paymentDate', header: 'Payment Date', sortable: true, render: (p) => formatDate(p.paymentDate) },
    { key: 'paymentStatus', header: 'Status', sortable: true, filterable: true, filterOptions: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })), render: (p) => <PaymentStatusBadge status={p.paymentStatus} /> },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (p) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setInvoicing(p)} title="Invoice" aria-label="View invoice" className="rounded p-1.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10">
            <span className="icon text-[18px]">receipt_long</span>
          </button>
          <button
            onClick={() => void paymentService.receipt(p)}
            title="Download receipt"
            aria-label="Download receipt"
            className="rounded p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/10"
          >
            <span className="icon text-[18px]">download</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Fee payments, receipts and invoices."
        icon="payments"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Payments' }]}
        actions={isApplicant && unpaidApps.length > 0 ? <Button onClick={() => setPayOpen(true)} leftIcon={<span className="icon text-[17px]">add_card</span>}>Pay Fee</Button> : undefined}
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <DashboardCard label="Total Paid" value={formatCurrency(summary.totalPaid)} tone="success" icon="account_balance_wallet" />
        <DashboardCard label="Pending Payments" value={summary.pending} tone="warning" icon="hourglass_top" />
        <DashboardCard label="Failed Transactions" value={summary.failed} tone="danger" icon="error" />
        <DashboardCard label="Refunds" value={summary.refunded} tone="secondary" icon="replay" />
      </div>

      <DataTable
        columns={columns}
        data={data}
        rows={rows}
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
        exportName="payments"
        refresh={refetch}
        emptyTitle="No payments found"
        emptyMessage="Payments appear here once a fee is transacted."
      />

      {/* Pay fee modal */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pay Application Fee" description="Complete the payment to move your application forward." size="md">
        <div className="space-y-4">
          <Select
            label="Application"
            required
            value={pAppId}
            onChange={(e) => setPAppId(e.target.value)}
            options={[{ value: '', label: 'Select application…' }, ...unpaidApps.map((a) => ({ value: a.id, label: `${a.applicationCode} · ${a.applicationType.replace('_', ' ')}` }))]}
          />
          <Select
            label="Payment Method"
            required
            value={pMethod}
            onChange={(e) => setPMethod(e.target.value as Payment['method'])}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
          />
          {pAppId && (
            <div className="flex items-center justify-between rounded-xl bg-primary-50 dark:bg-primary-600/10 p-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">Amount payable</span>
              <span className="text-lg font-bold text-primary-700 dark:text-secondary-400">
                {formatCurrency(FEE_SCHEDULE[(myAppsMap.get(pAppId)?.applicationType ?? 'FRESH') as ApplicationType])}
              </span>
            </div>
          )}
          <p className="text-xs text-slate-400">Payments are processed over a secure PCI-DSS gateway. You will receive a receipt instantly.</p>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button
            loading={payMutation.isPending}
            leftIcon={<span className="icon text-[16px]">lock</span>}
            onClick={async () => {
              if (!pAppId) {
                toast({ tone: 'warning', title: 'Select an application' });
                return;
              }
              try {
                const payment = await payMutation.mutateAsync({
                  applicationId: pAppId,
                  amount: FEE_SCHEDULE[(myAppsMap.get(pAppId)?.applicationType ?? 'FRESH') as ApplicationType],
                  method: pMethod,
                });
                toast({ tone: 'success', title: 'Payment successful', message: `Receipt ${payment.receiptNo} generated.` });
                setPayOpen(false);
              } catch (err) {
                toast({ tone: 'error', title: 'Payment failed', message: err instanceof Error ? err.message : undefined });
              }
            }}
          >
            Pay Now
          </Button>
        </div>
      </Modal>

      {/* Invoice modal */}
      <Modal open={!!invoicing} onClose={() => setInvoicing(null)} title="Payment Invoice" size="md">
        {invoicing && (
          <div>
            <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-5">
              <span className="icon text-[36px] text-primary-600">receipt_long</span>
              <h3 className="mt-2 text-lg font-bold text-ink-light dark:text-ink-dark">Fee Payment Invoice</h3>
              <p className="text-xs text-slate-400">Passport Application Management System</p>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              {[
                ['Receipt No.', invoicing.receiptNo],
                ['Payment ID', invoicing.id],
                ['Application', myAppsMap.get(invoicing.applicationId)?.applicationCode ?? invoicing.applicationId],
                ['Payment Date', formatDate(invoicing.paymentDate)],
                ['Method', PAYMENT_METHOD_LABELS[invoicing.method] ?? invoicing.method],
                ['Status', PAYMENT_STATUS_LABELS[invoicing.paymentStatus]],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="text-right font-medium text-ink-light dark:text-ink-dark">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-base">
                <dt className="font-semibold text-ink-light dark:text-ink-dark">Total</dt>
                <dd className="font-bold text-primary-700 dark:text-secondary-400">{formatCurrency(invoicing.amount)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => void paymentService.receipt(invoicing)} leftIcon={<span className="icon text-[16px]">download</span>}>
                Download Receipt
              </Button>
              <Button onClick={() => window.print()}>Print</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
