import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/Card';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { AppointmentStatusBadge } from '@/components/ui/StatusBadges';
import { useAppointments, useBookAppointment, useRescheduleAppointment, useCancelAppointment } from '@/hooks/useAppointments';
import { useMyApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/format';
import { APPOINTMENT_SLOTS, SEVA_CENTERS } from '@/utils/constants';
import type { Appointment } from '@/types';

/** Builds an ISO yyyy-mm-dd for a given year/month/day. */
const iso = (y: number, m: number, d: number): string =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function MiniCalendar({
  selected,
  onSelect,
  minDate = new Date(),
}: {
  selected: string;
  onSelect: (isoDate: string) => void;
  minDate?: Date;
}) {
  const [view, setView] = useState(() => {
    const base = selected ? new Date(selected) : new Date();
    return { y: base.getFullYear(), m: base.getMonth() };
  });

  const monthStart = new Date(view.y, view.m, 1);
  const startWeekday = monthStart.getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const todayIso = iso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="icon text-[20px]">chevron_left</span>
        </button>
        <p className="text-sm font-semibold text-ink-light dark:text-ink-dark">
          {monthStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="icon text-[20px]">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const cellIso = iso(view.y, view.m, d);
          const isPast = cellIso < todayIso;
          const isSelected = cellIso === selected;
          const isToday = cellIso === todayIso;
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(cellIso)}
              aria-pressed={isSelected}
              className={
                'h-9 rounded-lg text-sm transition-colors ' +
                (isSelected
                  ? 'bg-primary-600 font-semibold text-white'
                  : isPast
                    ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-600/15') +
                (isToday && !isSelected ? ' ring-1 ring-secondary-400' : '')
              }
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const bookMutation = useBookAppointment();
  const rescheduleMutation = useRescheduleAppointment();
  const cancelMutation = useCancelAppointment();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('appointmentDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const [bDate, setBDate] = useState('');
  const [bSlot, setBSlot] = useState('');
  const [bCenter, setBCenter] = useState(SEVA_CENTERS[0]);
  const [bAppId, setBAppId] = useState('');
  const [rDate, setRDate] = useState('');
  const [rSlot, setRSlot] = useState('');

  const { data: myApps } = useMyApplications(user?.id ?? '', { page: 0, size: 50 });
  const { data, isLoading, error, refetch } = useAppointments({
    page,
    size: pageSize,
    search,
    sortBy,
    sortDir,
    status: (filters.status || '') as Appointment['status'] | '',
  });

  const takenSlots = useMemo(
    () =>
      new Set(
        (data?.content ?? [])
          .filter((a) => a.status === 'SCHEDULED' && a.centerName === bCenter && a.appointmentDate === bDate)
          .map((a) => a.slotTime),
      ),
    [data, bCenter, bDate],
  );

  const columns: DataTableColumn<Appointment>[] = [
    {
      key: 'id',
      header: 'Appointment ID',
      render: (a) => <span className="font-mono text-xs font-semibold text-ink-light dark:text-ink-dark">{a.id}</span>,
    },
    { key: 'applicationId', header: 'Application', hideBelow: 'md', render: (a) => <span className="font-mono text-xs">{a.applicationId}</span> },
    { key: 'appointmentDate', header: 'Date', sortable: true, render: (a) => formatDate(a.appointmentDate) },
    { key: 'slotTime', header: 'Time', sortable: true, render: (a) => <span className="font-medium">{a.slotTime}</span> },
    { key: 'centerName', header: 'Center', hideBelow: 'lg', render: (a) => <span className="text-sm">{a.centerName}</span> },
    { key: 'status', header: 'Status', sortable: true, filterable: true, filterOptions: [{ value: 'SCHEDULED', label: 'Scheduled' }, { value: 'COMPLETED', label: 'Completed' }, { value: 'CANCELLED', label: 'Cancelled' }, { value: 'RESCHEDULED', label: 'Rescheduled' }], render: (a) => <AppointmentStatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (a) => (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {a.status === 'SCHEDULED' && (
            <>
              <button onClick={() => { setRescheduling(a); setRDate(a.appointmentDate.slice(0, 10)); setRSlot(''); }} title="Reschedule" aria-label="Reschedule appointment" className="rounded p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-600/10">
                <span className="icon text-[18px]">edit_calendar</span>
              </button>
              <button onClick={() => setCancelling(a)} title="Cancel" aria-label="Cancel appointment" className="rounded p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10">
                <span className="icon text-[18px]">event_busy</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const slotPicker = (selected: string, onPick: (s: string) => void, disabledSlots: Set<string> = new Set()) => (
    <div>
      <p className="label-base">Available Slots</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {APPOINTMENT_SLOTS.map((s) => {
          const taken = disabledSlots.has(s);
          return (
            <button
              key={s}
              type="button"
              disabled={taken}
              onClick={() => onPick(s)}
              aria-pressed={selected === s}
              className={
                'rounded-lg border py-2 text-xs font-medium transition-all ' +
                (selected === s
                  ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                  : taken
                    ? 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 line-through cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-600/10')
              }
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Book, reschedule or cancel your Passport Seva Kendra visit."
        icon="event_available"
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Appointments' }]}
        actions={<Button onClick={() => setBookOpen(true)} leftIcon={<span className="icon text-[17px]">add_circle</span>}>Book Appointment</Button>}
      />

      {/* Next appointment highlight */}
      {(() => {
        const next = (data?.content ?? [])
          .filter((a) => a.status === 'SCHEDULED' && new Date(a.appointmentDate) >= new Date(new Date().toDateString()))
          .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))[0];
        if (!next) return null;
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="card flex flex-wrap items-center gap-4 border-l-4 border-l-secondary-500 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-50 text-secondary-500 dark:bg-secondary-500/15">
                <span className="icon text-[24px]">upcoming</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-light dark:text-ink-dark">Next appointment · {next.centerName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(next.appointmentDate)} at {next.slotTime} · arrive 15 minutes early with original documents.</p>
              </div>
              <AppointmentStatusBadge status={next.status} />
            </div>
          </motion.div>
        );
      })()}

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
        exportName="appointments"
        refresh={refetch}
        emptyTitle="No appointments"
        emptyMessage="Book a slot to visit the Passport Seva Kendra."
        emptyAction={<Button onClick={() => setBookOpen(true)}>Book Appointment</Button>}
      />

      {/* Book modal */}
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Book Appointment" description="Choose a date, center and available time slot." size="lg">
        <div className="space-y-5">
          <Select
            label="Application"
            required
            value={bAppId}
            onChange={(e) => setBAppId(e.target.value)}
            options={[{ value: '', label: 'Select application…' }, ...(myApps?.content ?? []).map((a) => ({ value: a.id, label: a.applicationCode }))]}
          />
          <Select label="Passport Seva Kendra" required value={bCenter} onChange={(e) => setBCenter(e.target.value)} options={SEVA_CENTERS.map((c) => ({ value: c, label: c }))} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="card p-4">
              <MiniCalendar selected={bDate} onSelect={setBDate} />
            </div>
            <div>{slotPicker(bSlot, setBSlot, takenSlots)}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!bAppId || !bDate || !bSlot) {
                toast({ tone: 'warning', title: 'Incomplete selection', message: 'Pick an application, date and slot.' });
                return;
              }
              try {
                await bookMutation.mutateAsync({ applicationId: bAppId, appointmentDate: bDate, slotTime: bSlot, centerName: bCenter });
                toast({ tone: 'success', title: 'Appointment booked', message: `${formatDate(bDate)} at ${bSlot}` });
                setBookOpen(false);
                setBDate(''); setBSlot(''); setBAppId('');
              } catch (err) {
                toast({ tone: 'error', title: 'Booking failed', message: err instanceof Error ? err.message : undefined });
              }
            }}
            loading={bookMutation.isPending}
            leftIcon={<span className="icon text-[16px]">event_available</span>}
          >
            Confirm Booking
          </Button>
        </div>
      </Modal>

      {/* Reschedule modal */}
      <Modal open={!!rescheduling} onClose={() => setRescheduling(null)} title="Reschedule Appointment" description={rescheduling ? `${rescheduling.centerName} · currently ${formatDate(rescheduling.appointmentDate)} ${rescheduling.slotTime}` : ''} size="lg">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="card p-4">
            <MiniCalendar selected={rDate} onSelect={setRDate} />
          </div>
          <div>{slotPicker(rSlot, setRSlot)}</div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button variant="outline" onClick={() => setRescheduling(null)}>Cancel</Button>
          <Button
            loading={rescheduleMutation.isPending}
            onClick={async () => {
              if (!rescheduling || !rDate || !rSlot) {
                toast({ tone: 'warning', title: 'Pick a new date and slot' });
                return;
              }
              try {
                await rescheduleMutation.mutateAsync({ id: rescheduling.id, payload: { appointmentDate: rDate, slotTime: rSlot } });
                toast({ tone: 'success', title: 'Appointment rescheduled', message: `${formatDate(rDate)} at ${rSlot}` });
                setRescheduling(null);
              } catch (err) {
                toast({ tone: 'error', title: 'Reschedule failed', message: err instanceof Error ? err.message : undefined });
              }
            }}
          >
            Confirm Reschedule
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel appointment?"
        message={<span>Cancel the visit at <b>{cancelling?.centerName}</b> on {cancelling ? formatDate(cancelling.appointmentDate) : ''}? The slot will be released.</span>}
        confirmLabel="Cancel Appointment"
        loading={cancelMutation.isPending}
        onConfirm={async () => {
          if (!cancelling) return;
          try {
            await cancelMutation.mutateAsync(cancelling.id);
            toast({ tone: 'success', title: 'Appointment cancelled' });
            setCancelling(null);
          } catch {
            toast({ tone: 'error', title: 'Cancellation failed' });
          }
        }}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
