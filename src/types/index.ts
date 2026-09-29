// ─── Auth & Users ────────────────────────────────────────────────────────────

export type Role = 'APPLICANT' | 'VERIFICATION_OFFICER' | 'PASSPORT_OFFICER' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Applicant ───────────────────────────────────────────────────────────────

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Applicant {
  id: string;
  applicantCode: string;
  fullName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: Gender;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Passport Application ────────────────────────────────────────────────────

export type ApplicationType = 'FRESH' | 'RENEWAL' | 'RE_ISSUE' | 'MINOR';
export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENTS_PENDING'
  | 'APPOINTMENT_BOOKED'
  | 'PAYMENT_PENDING'
  | 'UNDER_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PASSPORT_ISSUED';

export interface PassportApplication {
  id: string;
  applicationCode: string;
  applicantId: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  applicationDate: string;
  placeOfIssue: string;
  updatedAt: string;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'VOTER_ID'
  | 'DRIVING_LICENSE'
  | 'BIRTH_CERTIFICATE';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface DocumentFile {
  id: string;
  applicationId: string;
  documentType: DocumentType;
  fileName: string;
  fileSizeKb: number;
  uploadedAt: string;
  verificationStatus: VerificationStatus;
}

// ─── Appointments ────────────────────────────────────────────────────────────

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface Appointment {
  id: string;
  applicationId: string;
  appointmentDate: string; // ISO date
  slotTime: string; // HH:mm
  status: AppointmentStatus;
  centerName: string;
  createdAt: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  applicationId: string;
  amount: number;
  paymentDate: string;
  paymentStatus: PaymentStatus;
  method: 'CARD' | 'UPI' | 'NET_BANKING' | 'CHALLAN';
  receiptNo: string;
}

// ─── Verification ────────────────────────────────────────────────────────────

export type VerificationType = 'POLICE' | 'DOCUMENT' | 'BIOMETRIC' | 'FIELD';
export type VerificationOutcome = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Verification {
  id: string;
  verificationCode: string;
  applicationId: string;
  verificationType: VerificationType;
  verificationDate: string;
  status: VerificationOutcome;
  remarks: string;
  officerName: string;
}

// ─── Passport (issued) ───────────────────────────────────────────────────────

export type PassportStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface IssuedPassport {
  id: string;
  passportNumber: string;
  applicationId: string;
  issueDate: string;
  expiryDate: string;
  status: PassportStatus;
  placeOfIssue: string;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface StatCard {
  key: string;
  label: string;
  value: number;
  delta: number;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
}

export interface MonthlyPoint {
  month: string;
  applications: number;
  approved: number;
  rejected: number;
}

export interface StatusSlice {
  status: ApplicationStatus;
  count: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface AdminStats {
  applicantCount: number;
  applicationCount: number;
  documentCount: number;
  verificationCount: number;
  passportCount: number;
  monthly: MonthlyPoint[];
  statusDistribution: StatusSlice[];
  activities: ActivityItem[];
  system: {
    uptimePercent: number;
    apiLatencyMs: number;
    queueDepth: number;
    dbStorageUsedPercent: number;
  };
}

export interface ApplicantStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  monthly: MonthlyPoint[];
  statusDistribution: StatusSlice[];
  activities: ActivityItem[];
}

// ─── Shared query/list contracts ─────────────────────────────────────────────

export interface PageRequest {
  page?: number; // 0-based
  size?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
