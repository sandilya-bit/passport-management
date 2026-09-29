import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useApplicants, useCreateApplicant, useUpdateApplicant, useDeleteApplicant } from '@/hooks/useApplicants';
import type { Applicant } from '@/types';
import { formatDate, initials, maskPhone as formatPhone } from '@/utils/format';
import { maskPhone } from '@/utils/masks';
import { GENDER_LABELS } from '@/utils/constants';

const applicantSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((v) => {
      const d = new Date(v);
      const age = (Date.now() - d.getTime()) / (365.25 * 86_400_000);
      return !Number.isNaN(d.getTime()) && age >= 0 && age < 120;
    }, 'Enter a valid date of birth'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(10, 'Enter the complete address (min 10 chars)'),
  phone: z.string().refine((v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, '')), 'Enter a valid 10-digit mobile'),
  email: z.string().email('Enter a valid email address'),
});

type ApplicantFormValues = z.infer<typeof applicantSchema>;

export default function ApplicantsPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Applicant | null>(null);
  const [deleting, setDeleting] = useState<Applicant | null>(null);
  const [viewing, setViewing] = useState<Applicant | null>(null);

  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useApplicants({ page, size: pageSize, search, sortBy, sortDir, gender: filters.gender || undefined });
  const createMutation = useCreateApplicant();
  const updateMutation = useUpdateApplicant();
  const deleteMutation = useDeleteApplicant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicantFormValues>({ resolver: zodResolver(applicantSchema) });

  const openCreate = (): void => {
    setEditing(null);
    reset({ fullName: '', dateOfBirth: '', gender: 'MALE', address: '', phone: '', email: '' });
    setModalOpen(true);
  };

  const openEdit = (a: Applicant): void => {
    setEditing(a);
    reset({ ...a, dateOfBirth: a.dateOfBirth.slice(0, 10) });
    setModalOpen(true);
  };

  const submitForm = async (values: ApplicantFormValues): Promise<void> => {
    const payload = { ...values, phone: values.phone.replace(/\s/g, '') };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast({ tone: 'success', title: 'Applicant updated', message: `${payload.fullName} saved successfully.` });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ tone: 'success', title: 'Applicant added', message: `${payload.fullName} created successfully.` });
      }
      setModalOpen(false);
    } catch {
      toast({ tone: 'error', title: 'Save failed', message: 'Please review the details and try again.' });
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast({ tone: 'success', title: 'Applicant deleted', message: `${deleting.fullName} removed.` });
      setDeleting(null);
    } catch {
      toast({ tone: 'error', title: 'Delete failed' });
    }
  };

  const columns: DataTableColumn<Applicant>[] = [
    {
      key: 'applicantCode',
      header: 'Applicant ID',
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600 dark:bg-primary-600/15 dark:text-primary-300">
            {initials(a.fullName)}
          </span>
          <div>
            <p className="font-semibold text-ink-light dark:text-ink-dark">{a.applicantCode}</p>
            <p className="text-xs text-slate-400">{a.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'fullName', header: 'Name', sortable: true },
    { key: 'dateOfBirth', header: 'DOB', sortable: true, hideBelow: 'md', render: (a) => formatDate(a.dateOfBirth) },
    { key: 'gender', header: 'Gender', sortable: true, filterable: true, filterOptions: Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label })), render: (a) => GENDER_LABELS[a.gender] },
    { key: 'address', header: 'Address', hideBelow: 'lg', render: (a) => <span className="line-clamp-1 max-w-[220px]">{a.address}</span> },
    { key: 'phone', header: 'Phone', hideBelow: 'sm', render: (a) => formatPhone(a.phone) },
    { key: 'email', header: 'Email', hideBelow: 'md' },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (a) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setViewing(a)} title="View details" aria-label={`View ${a.fullName}`} className="rounded p-1.5 text-slate-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-500/10">
            <span className="icon text-[18px]">visibility</span>
          </button>
          <button onClick={() => openEdit(a)} title="Edit" aria-label={`Edit ${a.fullName}`} className="rounded p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/10">
            <span className="icon text-[18px]">edit</span>
          </button>
          <button onClick={() => setDeleting(a)} title="Delete" aria-label={`Delete ${a.fullName}`} className="rounded p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10">
            <span className="icon text-[18px]">delete</span>
          </button>
        </div>
      ),
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Applicant Management"
        subtitle="Register, update and manage citizen records."
        icon="groups"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Applicants' }]}
        actions={<Button onClick={openCreate} leftIcon={<span className="icon text-[17px]">person_add</span>}>Add Applicant</Button>}
      />

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        error={error ? extractMsg(error) : null}
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
        exportName="applicants"
        refresh={refetch}
        emptyTitle="No applicants found"
        emptyMessage="Try adjusting your search or add a new applicant."
        emptyAction={<Button onClick={openCreate}>Add Applicant</Button>}
      />

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Applicant' : 'Add Applicant'}
        description={editing ? `Updating record ${editing.applicantCode}` : 'Register a new citizen record.'}
        size="lg"
      >
        <form id="applicant-form" onSubmit={handleSubmit(submitForm)} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" required error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Date of Birth" type="date" required error={errors.dateOfBirth?.message} max={new Date().toISOString().slice(0, 10)} {...register('dateOfBirth')} />
          <Select
            label="Gender"
            required
            error={errors.gender?.message}
            options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))}
            {...register('gender')}
          />
          <Input label="Phone" required inputMode="numeric" placeholder="98765 43210" error={errors.phone?.message} {...register('phone')} onChange={(e) => { e.target.value = maskPhone(e.target.value); }} />
          <Input label="Email" type="email" required error={errors.email?.message} containerClassName="sm:col-span-2" {...register('email')} />
          <div className="sm:col-span-2"><Textarea label="Address" required rows={3} error={errors.address?.message} {...register('address')} /></div>
        </form>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button type="submit" form="applicant-form" loading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
            {editing ? 'Save Changes' : 'Add Applicant'}
          </Button>
          {errors.root && <p className="text-xs text-danger-500">{String(errors.root.message)}</p>}
        </div>
      </Modal>

      {/* View modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Applicant Details" size="md">
        {viewing && (
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white">
                {initials(viewing.fullName)}
              </span>
              <div>
                <h3 className="text-lg font-bold text-ink-light dark:text-ink-dark">{viewing.fullName}</h3>
                <p className="text-sm text-slate-500">{viewing.applicantCode} · joined {formatDate(viewing.createdAt)}</p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-slate-200 dark:border-slate-800 pt-5 sm:grid-cols-2">
              {[
                ['Date of Birth', formatDate(viewing.dateOfBirth)],
                ['Gender', GENDER_LABELS[viewing.gender]],
                ['Phone', formatPhone(viewing.phone)],
                ['Email', viewing.email],
                ['Address', viewing.address],
                ['Last Updated', formatDate(viewing.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className={k === 'Address' ? 'sm:col-span-2' : ''}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="mt-1 text-sm text-ink-light dark:text-ink-dark">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              <Button onClick={() => { setViewing(null); openEdit(viewing); }} leftIcon={<span className="icon text-[16px]">edit</span>}>Edit</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete applicant?"
        message={<span>Permanently delete <b>{deleting?.fullName}</b>'s record? This cannot be undone.</span>}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function extractMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Request failed';
}
