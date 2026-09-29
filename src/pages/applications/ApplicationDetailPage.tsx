import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Loader } from '@/components/ui/Loader';
import { applicationKeys, useUpdateApplication } from '@/hooks/useApplications';
// eslint-disable-next-line
import { applicationService } from '@/services/applicationService';
import { useDocuments } from '@/hooks/useDocuments';
import { useAppointments } from '@/hooks/useAppointments';
import { usePayments } from '@/hooks/usePayments';
import { usePassportByApplication } from '@/hooks/usePassports';
import { queryClient } from '@/utils/queryClient';
import { ApplicationStatusBadge } from '@/components/ui/StatusBadges';
import { DocumentStatusBadge, DocumentTypeChip, PaymentStatusBadge, AppointmentStatusBadge } from '@/components/ui/StatusBadges';
import { formatDate, formatDateTime, formatCurrency, formatFileSize } from '@/utils/format';
import { APPLICATION_TYPE_LABELS, FEE_SCHEDULE, PAYMENT_METHOD_LABELS, APPOINTMENT_SLOTS } from '@/utils/constants';
import type { ApplicationStatus, PassportApplication } from '@/types';

const TIMELINE_STEPS: { status: ApplicationStatus; label: string; icon: string }[] = [
  { status: 'SUBMITTED', label: 'Application Submitted', icon: 'task_alt' },
  { status: 'DOCUMENTS_PENDING', label: 'Documents', icon: 'upload_file' },
  { status: 'APPOINTMENT_BOOKED', label: 'Appointment', icon: 'event_available' },
  { status: 'PAYMENT_PENDING', label: 'Payment', icon: 'payments' },
  { status: 'UNDER_VERIFICATION', label: 'Verification', icon: 'fact_check' },
  { status: 'APPROVED', label: 'Approved', icon: 'verified' },
  { status: 'PASSPORT_ISSUED', label: 'Passport Issued', icon: 'card_travel' },
];

function statusRank(s: ApplicationStatus): number {
  if (s === 'REJECTED') return 6.5;
  const idx = TIMELINE_STEPS.findIndex((t) => t.status === s);
  return idx === -1 ? 0 : idx;
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const updateMutation = useUpdateApplication();

  const appQuery = useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => applicationService.byId(id!),
    enabled: !!id,
  });

  const { data: docs } = useDocuments({ page: 0, size: 20, applicationId: id, sortBy: 'uploadedAt', sortDir: 'desc' });
  const { data: appts } = useAppointments({ page: 0, size: 10, applicationId: id, sortBy: 'appointmentDate', sortDir: 'desc' });
  const { data: pays } = usePayments({ page: 0, size: 10, applicationId: id, sortBy: 'paymentDate', sortDir: 'desc' });
  const { data: passport } = usePassportByApplication(id ?? '');

  const app = appQuery.data;

  if (appQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader size={34} className="text-primary-600" />
      </div>
    );
  }

  if (appQuery.isError || !app) {
    return (
      <EmptyState
        icon="search_off"
        title="Application not found"
        message="It may have been withdrawn or the link is incorrect."
        action={<Link to="/applications"><Button variant="outline">Back to Applications</Button></Link>}
      />
    );
  }

  const rank = statusRank(app.status);
  const rejected = app.status === 'REJECTED';

  const advance = async (status: ApplicationStatus): Promise<void> => {
    await updateMutation.mutateAsync({ id: app.id, payload: { status } });
    void queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    toast({ tone: 'success', title: 'Status updated', message: `${app.applicationCode} → ${status.replace(/_/g, ' ')}` });
  };

  return (
    <div>
      <PageHeader
        title={app.applicationCode}
        subtitle={`Submitted ${formatDateTime(app.applicationDate)} · ${APPLICATION_TYPE_LABELS[app.applicationType]}`}
        icon="description"
        breadcrumbs={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Applications', to: '/applications' },
          { label: app.applicationCode },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()} leftIcon={<span className="icon text-[17px]">print</span>}>
              Print
            </Button>
            {app.status === 'DRAFT' && (
              <Button loading={updateMutation.isPending} onClick={() => advance('SUBMITTED')}>
                Submit Application
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <Card className="lg:col-span-1">
          <CardHeader title="Application Timeline" subtitle="Live status tracking" icon="timeline" />
          <div className="p-5">
            {rejected ? (
              <div className="rounded-xl bg-danger-50 dark:bg-danger-500/10 p-4 text-sm text-danger-700 dark:text-danger-400">
                <p className="flex items-center gap-2 font-semibold"><span className="icon text-[18px]">cancel</span> Application Rejected</p>
                <p className="mt-1.5">Please review officer remarks in the Verification tab. You may file a re-issue application.</p>
              </div>
            ) : (
              <ol>
                {TIMELINE_STEPS.map((step, i) => {
                  const stepRank = statusRank(step.status);
                  const done = rank > stepRank || app.status === 'PASSPORT_ISSUED' && stepRank < 6;
                  const current = rank === stepRank;
                  return (
                    <li key={step.status} className="relative flex gap-3 pb-6 last:pb-0">
                      {i < TIMELINE_STEPS.length - 1 && (
                        <span className={'absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5 ' + (rank > stepRank ? 'bg-success-500' : 'bg-slate-200 dark:bg-slate-700')} />
                      )}
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={
                          'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ' +
                          (done ? 'bg-success-500 text-white' : current ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900' : 'bg-slate-100 text-slate-400 dark:bg-slate-800')
                        }
                      >
                        <span className="icon text-[16px]">{done ? 'check' : current ? 'pending' : step.icon}</span>
                      </motion.span>
                      <div className="pt-1">
                        <p className={'text-sm font-medium ' + (done || current ? 'text-ink-light dark:text-ink-dark' : 'text-slate-400')}>{step.label}</p>
                        {current && <Badge tone="primary" className="mt-1">Current stage</Badge>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </Card>

        {/* Details & related records */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Application Information" icon="info" />
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 p-5 sm:grid-cols-3">
              {[
                ['Application ID', app.id],
                ['Applicant ID', app.applicantId],
                ['Application Date', formatDate(app.applicationDate)],
                ['Type', APPLICATION_TYPE_LABELS[app.applicationType]],
                ['Place of Issue', app.placeOfIssue],
                ['Last Updated', formatDateTime(app.updatedAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="mt-1 break-words text-sm text-ink-light dark:text-ink-dark">{v}</dd>
                </div>
              ))}
              <div className="sm:col-span-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</dt>
                <dd className="mt-2"><ApplicationStatusBadge status={app.status} /></dd>
              </div>
            </dl>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader
              title="Documents"
              subtitle={`${docs?.content.length ?? 0} uploaded`}
              icon="folder_shared"
              action={<Link to="/documents" className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">Manage →</Link>}
            />
            {docs && docs.content.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {docs.content.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="icon text-[22px] text-slate-400">picture_as_pdf</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-light dark:text-ink-dark">{d.fileName}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(d.fileSizeKb)} · uploaded {formatDate(d.uploadedAt)}</p>
                    </div>
                    <DocumentStatusBadge status={d.verificationStatus} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="upload_file" title="No documents yet" message="Upload Aadhaar, PAN or other required proofs." action={<Link to="/documents"><Button size="sm">Upload Documents</Button></Link>} />
            )}
          </Card>

          {/* Appointment */}
          <Card>
            <CardHeader title="Appointment" icon="event_available" action={<Link to="/appointments" className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">Book →</Link>} />
            {appts && appts.content.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {appts.content.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50 text-secondary-500 dark:bg-secondary-500/15">
                      <span className="icon text-[20px]">event</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-light dark:text-ink-dark">{a.centerName}</p>
                      <p className="text-xs text-slate-400">{formatDate(a.appointmentDate)} at {a.slotTime}</p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="event_busy" title="No appointment booked" message="Pick a slot at your nearest PSK." />
            )}
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader title="Payments" icon="payments" action={<Link to="/payments" className="text-xs font-semibold text-secondary-600 dark:text-secondary-400">Pay now →</Link>} />
            {pays && pays.content.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {pays.content.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-500 dark:bg-success-500/15">
                      <span className="icon text-[20px]">receipt_long</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-light dark:text-ink-dark">{formatCurrency(p.amount)} · {PAYMENT_METHOD_LABELS[p.method]}</p>
                      <p className="text-xs text-slate-400">{p.receiptNo} · {formatDate(p.paymentDate)}</p>
                    </div>
                    <PaymentStatusBadge status={p.paymentStatus} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="payments" title="No payment recorded" message={`Fee due: ${formatCurrency(FEE_SCHEDULE[app.applicationType])}.`} />
            )}
          </Card>

          {/* Issued passport */}
          {passport && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary-200">Republic of India · Passport</p>
                    <p className="mt-2 font-mono text-2xl font-bold tracking-widest">{passport.passportNumber}</p>
                  </div>
                  <span className="icon text-[44px] text-secondary-300">card_travel</span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-primary-200 text-xs">Issue Date</p><p className="mt-0.5 font-medium">{formatDate(passport.issueDate)}</p></div>
                  <div><p className="text-primary-200 text-xs">Expiry Date</p><p className="mt-0.5 font-medium">{formatDate(passport.expiryDate)}</p></div>
                  <div><p className="text-primary-200 text-xs">Place of Issue</p><p className="mt-0.5 font-medium">{passport.placeOfIssue}</p></div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


