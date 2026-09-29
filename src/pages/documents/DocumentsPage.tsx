import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { useDocuments, useUploadDocument, useDeleteDocument, useSetDocumentVerification } from '@/hooks/useDocuments';
import { documentService } from '@/services/documentService';
import { useMyApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { DocumentStatusBadge, DocumentTypeChip } from '@/components/ui/StatusBadges';
import { formatDateTime, formatFileSize } from '@/utils/format';
import { DOCUMENT_TYPE_LABELS, APPLICATION_TYPE_LABELS } from '@/utils/constants';
import type { DocumentFile, DocumentType, VerificationStatus } from '@/types';

export default function DocumentsPage() {
  const user = useAuthStore((s) => s.user);
  const isOfficer = user?.role !== 'APPLICANT';
  const { toast } = useToast();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewing, setPreviewing] = useState<DocumentFile | null>(null);
  const [deleting, setDeleting] = useState<DocumentFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<DocumentType>('AADHAAR');
  const [uploadAppId, setUploadAppId] = useState('');

  const { data: myApps } = useMyApplications(user?.id ?? '', { page: 0, size: 50 });
  const myApplicationIds = useMemo(() => new Set(myApps?.content.map((a) => a.id)), [myApps]);

  const { data, isLoading, error, refetch } = useDocuments({
    page,
    size: pageSize,
    search,
    sortBy,
    sortDir,
    documentType: (filters.documentType || '') as DocumentType | '',
    verificationStatus: (filters.verificationStatus || '') as VerificationStatus | '',
  });

  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const verifyMutation = useSetDocumentVerification();

  const rows = useMemo(() => {
    const content = data?.content ?? [];
    // Applicants only see documents belonging to their own applications.
    return isOfficer ? content : content.filter((d) => myApplicationIds.size === 0 || myApplicationIds.has(d.applicationId));
  }, [data, isOfficer, myApplicationIds]);

  const columns: DataTableColumn<DocumentFile>[] = [
    {
      key: 'fileName',
      header: 'Document',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800">
            <span className="icon text-[20px]">picture_as_pdf</span>
          </span>
          <div>
            <p className="font-medium text-ink-light dark:text-ink-dark">{d.fileName}</p>
            <p className="text-xs text-slate-400">{formatFileSize(d.fileSizeKb)}</p>
          </div>
        </div>
      ),
    },
    { key: 'applicationId', header: 'Application ID', hideBelow: 'md', render: (d) => <span className="font-mono text-xs">{d.applicationId}</span> },
    { key: 'documentType', header: 'Document Type', sortable: true, filterable: true, filterOptions: Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })), render: (d) => <DocumentTypeChip type={d.documentType} /> },
    { key: 'uploadedAt', header: 'Uploaded', sortable: true, hideBelow: 'sm', render: (d) => formatDateTime(d.uploadedAt) },
    {
      key: 'verificationStatus',
      header: 'Verification',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'VERIFIED', label: 'Verified' },
        { value: 'REJECTED', label: 'Rejected' },
      ],
      render: (d) => <DocumentStatusBadge status={d.verificationStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (d) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setPreviewing(d)} title="Preview" aria-label="Preview document" className="rounded p-1.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10">
            <span className="icon text-[18px]">visibility</span>
          </button>
          <button onClick={() => void documentService.download(d.id, d.fileName)} title="Download" aria-label="Download document" className="rounded p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/10">
            <span className="icon text-[18px]">download</span>
          </button>
          {isOfficer && (
            <>
              <button
                onClick={() => verifyMutation.mutate({ id: d.id, status: 'VERIFIED' })}
                disabled={d.verificationStatus === 'VERIFIED'}
                title="Mark verified"
                aria-label="Mark verified"
                className="rounded p-1.5 text-slate-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 disabled:opacity-40"
              >
                <span className="icon text-[18px]">check_circle</span>
              </button>
              <button onClick={() => setDeleting(d)} title="Delete" aria-label="Delete document" className="rounded p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10">
                <span className="icon text-[18px]">delete</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || !uploadAppId) {
      toast({ tone: 'warning', title: 'Missing information', message: 'Select an application, document type and file.' });
      return;
    }
    try {
      await uploadMutation.mutateAsync({ applicationId: uploadAppId, documentType: uploadType, file: selectedFile });
      toast({ tone: 'success', title: 'Document uploaded', message: 'Verification is pending officer review.' });
      setUploadOpen(false);
      setSelectedFile(null);
    } catch {
      toast({ tone: 'error', title: 'Upload failed', message: 'File must be under 4 MB.' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Document Vault"
        subtitle="Upload and manage identity proof documents."
        icon="folder_shared"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Documents' }]}
        actions={<Button onClick={() => setUploadOpen(true)} leftIcon={<span className="icon text-[17px]">upload_file</span>}>Upload Document</Button>}
      />

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
        onRowClick={setPreviewing}
        exportName="documents"
        refresh={refetch}
        emptyTitle="No documents found"
        emptyMessage="Upload your identity proofs to move your application forward."
        emptyAction={<Button onClick={() => setUploadOpen(true)}>Upload Document</Button>}
      />

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document" description="PDF, JPG or PNG · max 4 MB" size="md">
        <div className="space-y-4">
          <Select
            label="Application"
            required
            value={uploadAppId}
            onChange={(e) => setUploadAppId(e.target.value)}
            options={[{ value: '', label: 'Select application…' }, ...(myApps?.content ?? []).map((a) => ({ value: a.id, label: `${a.applicationCode} · ${APPLICATION_TYPE_LABELS[a.applicationType]}` }))]}
          />
          <Select
            label="Document Type"
            required
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as DocumentType)}
            options={Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center transition-colors hover:border-secondary-400 hover:bg-secondary-50/40 dark:hover:bg-secondary-500/5">
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            <span className="icon text-[36px] text-slate-400">cloud_upload</span>
            <p className="mt-2 text-sm font-medium text-ink-light dark:text-ink-dark">
              {selectedFile ? selectedFile.name : 'Click to choose a file'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {selectedFile ? formatFileSize(Math.round(selectedFile.size / 1024)) : 'PDF, JPG or PNG up to 4 MB'}
            </p>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button onClick={() => void handleUpload()} loading={uploadMutation.isPending} leftIcon={<span className="icon text-[16px]">upload</span>}>
            Upload
          </Button>
        </div>
      </Modal>

      {/* Preview modal */}
      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Document Preview" size="lg">
        {previewing && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900">
                  <span className="icon text-[24px] text-danger-500">picture_as_pdf</span>
                </span>
                <div>
                  <p className="font-medium text-ink-light dark:text-ink-dark">{previewing.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(previewing.fileSizeKb)} · uploaded {formatDateTime(previewing.uploadedAt)}
                  </p>
                </div>
              </div>
              <DocumentStatusBadge status={previewing.verificationStatus} />
            </div>

            <div className="mt-4 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="text-center">
                <span className="icon text-[52px] text-slate-300 dark:text-slate-600">file_present</span>
                <p className="mt-2 text-sm text-slate-400">Secure document viewer preview</p>
                <p className="text-xs text-slate-400">PDF renders in production via the documents API</p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div><dt className="text-xs font-semibold uppercase text-slate-400">Type</dt><dd className="mt-1"><DocumentTypeChip type={previewing.documentType} /></dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate-400">Application</dt><dd className="mt-1 font-mono text-xs">{previewing.applicationId}</dd></div>
            </dl>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => void documentService.download(previewing.id, previewing.fileName)} leftIcon={<span className="icon text-[16px]">download</span>}>
                Download
              </Button>
              <Button onClick={() => setPreviewing(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete document?"
        message={<span>Delete <b>{deleting?.fileName}</b>? This action cannot be undone.</span>}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteMutation.mutateAsync(deleting.id);
            toast({ tone: 'success', title: 'Document deleted' });
            setDeleting(null);
          } catch {
            toast({ tone: 'error', title: 'Delete failed' });
          }
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
