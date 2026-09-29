import type {
  ApplicationStatus,
  ApplicationType,
  DocumentType,
  Gender,
  PaymentStatus,
  Role,
  VerificationOutcome,
  VerificationStatus,
  VerificationType,
  AppointmentStatus,
} from '@/types';

export const APP_NAME = 'Passport Application Management System';
export const APP_SHORT = 'PAMS';

export const ROLE_LABELS: Record<Role, string> = {
  APPLICANT: 'Applicant',
  VERIFICATION_OFFICER: 'Verification Officer',
  PASSPORT_OFFICER: 'Passport Officer',
  ADMIN: 'Administrator',
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
};

export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  FRESH: 'Fresh Passport',
  RENEWAL: 'Renewal',
  RE_ISSUE: 'Re-issue',
  MINOR: 'Minor (Below 18)',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  DOCUMENTS_PENDING: 'Documents Pending',
  APPOINTMENT_BOOKED: 'Appointment Booked',
  PAYMENT_PENDING: 'Payment Pending',
  UNDER_VERIFICATION: 'Under Verification',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PASSPORT_ISSUED: 'Passport Issued',
};

export type StatusTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, StatusTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'secondary',
  DOCUMENTS_PENDING: 'warning',
  APPOINTMENT_BOOKED: 'secondary',
  PAYMENT_PENDING: 'warning',
  UNDER_VERIFICATION: 'primary',
  APPROVED: 'success',
  REJECTED: 'danger',
  PASSPORT_ISSUED: 'success',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  VOTER_ID: 'Voter ID',
  DRIVING_LICENSE: 'Driving License',
  BIRTH_CERTIFICATE: 'Birth Certificate',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  POLICE: 'Police Verification',
  DOCUMENT: 'Document Verification',
  BIOMETRIC: 'Biometric Verification',
  FIELD: 'Field Verification',
};

export const VERIFICATION_OUTCOME_LABELS: Record<VerificationOutcome, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: 'Card',
  UPI: 'UPI',
  NET_BANKING: 'Net Banking',
  CHALLAN: 'Challan',
};

export const SEVA_CENTERS = [
  'PSK – Central District',
  'PSK – North Zone',
  'PSK – South Zone',
  'PSK – East Hub',
  'PSK – West Hub',
  'POPSK – Suburban Center',
];

export const APPOINTMENT_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30',
];

export const FEE_SCHEDULE: Record<ApplicationType, number> = {
  FRESH: 1500,
  RENEWAL: 2000,
  RE_ISSUE: 1500,
  MINOR: 1000,
};
