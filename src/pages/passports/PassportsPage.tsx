import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { PassportStatusBadge } from '@/components/ui/StatusBadges';
import { usePassports } from '@/hooks/usePassports';
import { formatDate, downloadBlob } from '@/utils/format';
import type { IssuedPassport } from '@/types';

export default function PassportsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('issueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<IssuedPassport | null>(null);

  const { data, isLoading, error, refetch } = usePassports({ page, size: pageSize, search, sortBy, sortDir, status: (filters.status || '') as IssuedPassport['status'] | '' });

  const downloadDetails = (p: IssuedPassport): void => {
    const text = [
      '════════════════════════════════════════',
      '  REPUBLIC OF INDIA — PASSPORT DETAILS',
      '════════════════════════════════════════',
      `Passport ID:      ${p.id}`,
      `Passport Number:  ${p.passportNumber}`,
      `Issue Date:       ${formatDate(p.issueDate)}`,
      `Expiry Date:      ${formatDate(p.expiryDate)}`,
      `Place of Issue:   ${p.placeOfIssue}`,
      `Status:           ${p.status}`,
      `Application Ref:  ${p.applicationId}`,
      '════════════════════════════════════════',
      'This is a system-generated document.',
    ].join('\n');
    downloadBlob(new Blob([text], { type: 'text/plain' }), `passport_${p.passportNumber}.txt`);
    toast({ tone: 'success', title: 'Details downloaded', message: p.passportNumber });
  };

  const columns: DataTableColumn<IssuedPassport>[] = [
    {
      key: 'passportNumber',
      header: 'Passport Number',
      sortable: true,
      render: (p) => <span className="font-mono font-semibold tracking-wider text-primary-700 dark:text-secondary-400">{p.passportNumber}</span>,
    },
    { key: 'applicationId', header: 'Application', hideBelow: 'md', render: (p) => <span className="font-mono text-xs">{p.applicationId}</span> },
    { key: 'issueDate', header: 'Issue Date', sortable: true, render: (p) => formatDate(p.issueDate) },
    { key: 'expiryDate', header: 'Expiry Date', sortable: true, hideBelow: 'sm', render: (p) => formatDate(p.expiryDate) },
    { key: 'placeOfIssue', header: 'Place of Issue', hideBelow: 'lg', render: (p) => p.placeOfIssue },
    { key: 'status', header: 'Status', sortable: true, filterable: true, filterOptions: [{ value: 'ACTIVE', label: 'Active' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'REVOKED', label: 'Revoked' }], render: (p) => <PassportStatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (p) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setViewing(p)} title="View passport" aria-label="View passport" className="rounded p-1.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10">
            <span className="icon text-[18px]">visibility</span>
          </button>
          <button onClick={() => downloadDetails(p)} title="Download details" aria-label="Download passport details" className="rounded p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/10">
            <span className="icon text-[18px]">download</span>
          </button>
          <button onClick={() => window.print()} title="Print" aria-label="Print passport information" className="rounded p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="icon text-[18px]">print</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Issued Passports"
        subtitle="Registry of issued passports with print and download."
        icon="card_travel"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Passports' }]}
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
        onRowClick={setViewing}
        exportName="passports"
        refresh={refetch}
        emptyTitle="No passports issued"
        emptyMessage="Issued passports will appear in this registry."
      />

      {/* Passport card modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Passport Details" size="lg">
        {viewing && (
          <div>
            {/* Passport-style card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary-200">भारत गणराज्य · Republic of India</p>
                    <p className="text-sm font-semibold">Passport</p>
                  </div>
                  <span className="icon text-[30px] text-secondary-300">card_travel</span>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-6">
                <p className="text-[10px] uppercase tracking-widest text-slate-400">Passport Number</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-ink-light dark:text-ink-dark">{viewing.passportNumber}</p>
                <div className="mt-5 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Issue Date</p>
                    <p className="mt-0.5 text-sm font-medium text-ink-light dark:text-ink-dark">{formatDate(viewing.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Expiry Date</p>
                    <p className="mt-0.5 text-sm font-medium text-ink-light dark:text-ink-dark">{formatDate(viewing.expiryDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">Place of Issue</p>
                    <p className="mt-0.5 text-sm font-medium text-ink-light dark:text-ink-dark">{viewing.placeOfIssue}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-3">
                <PassportStatusBadge status={viewing.status} />
                <span className="font-mono text-[11px] text-slate-400">REF {viewing.applicationId}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => window.print()} leftIcon={<span className="icon text-[16px]">print</span>}>Print</Button>
              <Button onClick={() => downloadDetails(viewing)} leftIcon={<span className="icon text-[16px]">download</span>}>Download Details</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
