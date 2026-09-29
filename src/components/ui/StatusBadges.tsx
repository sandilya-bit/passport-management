import type { ApplicationStatus, DocumentType, VerificationStatus, VerificationOutcome, PaymentStatus, AppointmentStatus, PassportStatus, Role } from '@/types';
import type { StatusTone } from '@/utils/constants';
import { Badge } from '@/components/ui/Badge';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONE,
  DOCUMENT_TYPE_LABELS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_OUTCOME_LABELS,
  PAYMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_LABELS,
} from '@/utils/constants';

const docTone: Record<VerificationStatus, StatusTone> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
};

const outcomeTone: Record<VerificationOutcome, StatusTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const paymentTone: Record<PaymentStatus, StatusTone> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  REFUNDED: 'neutral',
};

const appointmentTone: Record<AppointmentStatus, StatusTone> = {
  SCHEDULED: 'secondary',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  RESCHEDULED: 'warning',
};

const passportTone: Record<PassportStatus, StatusTone> = {
  ACTIVE: 'success',
  EXPIRED: 'neutral',
  REVOKED: 'danger',
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge tone={APPLICATION_STATUS_TONE[status]} dot>
      {APPLICATION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function DocumentStatusBadge({ status }: { status: VerificationStatus }) {
  const icons: Record<VerificationStatus, string> = { PENDING: 'hourglass_top', VERIFIED: 'check_circle', REJECTED: 'cancel' };
  return <Badge tone={docTone[status]} icon={icons[status]}>{VERIFICATION_STATUS_LABELS[status]}</Badge>;
}

export function VerificationOutcomeBadge({ status }: { status: VerificationOutcome }) {
  return <Badge tone={outcomeTone[status]} dot>{VERIFICATION_OUTCOME_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={paymentTone[status]} dot>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={appointmentTone[status]} dot>{APPOINTMENT_STATUS_LABELS[status]}</Badge>;
}

export function PassportStatusBadge({ status }: { status: PassportStatus }) {
  return <Badge tone={passportTone[status]} dot>{status}</Badge>;
}

export function DocumentTypeChip({ type }: { type: DocumentType }) {
  const icons: Record<DocumentType, string> = {
    AADHAAR: 'badge',
    PAN: 'credit_card',
    VOTER_ID: 'how_to_vote',
    DRIVING_LICENSE: 'directions_car',
    BIRTH_CERTIFICATE: 'child_care',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
      <span className="icon text-[18px] text-secondary-500">{icons[type]}</span>
      {DOCUMENT_TYPE_LABELS[type]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, { tone: StatusTone; icon: string; label: string }> = {
    APPLICANT: { tone: 'secondary', icon: 'person', label: 'Applicant' },
    VERIFICATION_OFFICER: { tone: 'warning', icon: 'fact_check', label: 'Verification Officer' },
    PASSPORT_OFFICER: { tone: 'primary', icon: 'workspace_premium', label: 'Passport Officer' },
    ADMIN: { tone: 'danger', icon: 'admin_panel_settings', label: 'Administrator' },
  };
  const cfg = map[role];
  return <Badge tone={cfg.tone} icon={cfg.icon}>{cfg.label}</Badge>;
}

export { StatusTone };
