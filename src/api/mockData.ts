import type {
  ActivityItem,
  AdminStats,
  Applicant,
  ApplicantStats,
  ApplicationStatus,
  ApplicationType,
  Appointment,
  DocumentFile,
  DocumentType,
  IssuedPassport,
  MonthlyPoint,
  Payment,
  StatusSlice,
  User,
  Verification,
} from '@/types';

/**
 * In-memory mock database that simulates the REST backend so the whole UI is
 * demoable without a server. Swap `VITE_API_BASE_URL` in to go live — the
 * service layer signatures do not change.
 */

const names = [
  'Aarav Sharma', 'Diya Patel', 'Vihaan Reddy', 'Ananya Iyer', 'Arjun Nair',
  'Ishaan Gupta', 'Meera Krishnan', 'Kabir Singh', 'Riya Desai', 'Aditya Rao',
  'Saanvi Mehta', 'Rohan Joshi', 'Pooja Bhat', 'Karthik Menon', 'Nisha Verma',
  'Vikram Chandra', 'Sneha Kulkarni', 'Rahul Dutta', 'Tara Pillai', 'Manav Saxena',
  'Lakshmi Rao', 'Farhan Ali', 'Priya Malhotra', 'Dev Anand', 'Gauri Shinde',
  'Nikhil Bansal', 'Shreya Ghosh', 'Yash Trivedi', 'Neha Kaur', 'Omkar Jadhav',
];

const cities = [
  '12 MG Road, Bengaluru, Karnataka 560001',
  '44 Anna Salai, Chennai, Tamil Nadu 600002',
  '7 Ring Road, New Delhi, Delhi 110001',
  '301 Hill Road, Mumbai, Maharashtra 400050',
  '18 Park Street, Kolkata, West Bengal 700016',
  '9 Panjim Lane, Panaji, Goa 403001',
];

let seq = 1000;
const nextId = (prefix: string): string => `${prefix}-${(seq++).toString().padStart(5, '0')}`;
const daysAgo = (n: number): string => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number): string => new Date(Date.now() + n * 86_400_000).toISOString();
const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

export const users: User[] = [
  { id: 'usr-1', fullName: 'Ravi Kumar', email: 'applicant@demo.in', phone: '9876543210', role: 'APPLICANT', createdAt: daysAgo(400) },
  { id: 'usr-2', fullName: 'Officer Vijay', email: 'verification@demo.in', phone: '9876500002', role: 'VERIFICATION_OFFICER', createdAt: daysAgo(600) },
  { id: 'usr-3', fullName: 'Officer Latha', email: 'passport@demo.in', phone: '9876500003', role: 'PASSPORT_OFFICER', createdAt: daysAgo(600) },
  { id: 'usr-4', fullName: 'System Admin', email: 'admin@demo.in', phone: '9876500004', role: 'ADMIN', createdAt: daysAgo(700) },
];

export const DEMO_PASSWORD = 'Password@123';

export const applicants: Applicant[] = names.map((fullName, i) => ({
  id: nextId('apl'),
  applicantCode: `APL${(20250100 + i).toString()}`,
  fullName,
  dateOfBirth: `19${70 + (i % 25)}-0${(i % 9) + 1}-1${(i % 9)}`,
  gender: i % 3 === 0 ? 'FEMALE' : i % 7 === 0 ? 'OTHER' : 'MALE',
  address: pick(cities, i),
  phone: `9${(800000000 + i * 137911) % 900000000}`.slice(0, 10),
  email: `${fullName.split(' ')[0].toLowerCase()}.${fullName.split(' ')[1].toLowerCase()}@mail.in`,
  createdAt: daysAgo(300 - i * 7),
  updatedAt: daysAgo(30 - (i % 28)),
}));

const statusFlow: ApplicationStatus[] = [
  'DRAFT', 'SUBMITTED', 'DOCUMENTS_PENDING', 'APPOINTMENT_BOOKED',
  'PAYMENT_PENDING', 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED', 'PASSPORT_ISSUED',
];

export interface MockApplication {
  id: string;
  applicationCode: string;
  applicantId: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  applicationDate: string;
  placeOfIssue: string;
  updatedAt: string;
  ownerUserId: string;
}

const types: ApplicationType[] = ['FRESH', 'RENEWAL', 'RE_ISSUE', 'MINOR'];

export const applications: MockApplication[] = names.map((_, i) => {
  const status = pick(statusFlow, i * 3 + 1);
  return {
    id: nextId('app'),
    applicationCode: `PAS${20253000 + i}`,
    applicantId: applicants[i].id,
    applicationType: pick(types, i),
    status,
    applicationDate: daysAgo(120 - i * 3),
    placeOfIssue: pick(['Bengaluru', 'Chennai', 'New Delhi', 'Mumbai', 'Kolkata'], i),
    updatedAt: daysAgo(20 - (i % 18)),
    ownerUserId: i === 0 ? 'usr-1' : i % 5 === 0 ? 'usr-1' : `usr-${1 + (i % 4)}`,
  };
});

// A handful of extra applications owned by the demo applicant for a lively dashboard.
for (let i = 0; i < 6; i++) {
  applications.push({
    id: nextId('app'),
    applicationCode: `PAS${20253030 + i}`,
    applicantId: applicants[0].id,
    applicationType: pick(types, i + 1),
    status: pick(statusFlow, i * 2),
    applicationDate: daysAgo(40 + i * 12),
    placeOfIssue: 'Bengaluru',
    updatedAt: daysAgo(3 + i),
    ownerUserId: 'usr-1',
  });
}

const docTypes: DocumentType[] = ['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE', 'BIRTH_CERTIFICATE'];

export const documents: DocumentFile[] = applications.flatMap((app, i) =>
  docTypes.slice(0, 2 + (i % 4)).map((documentType, j) => ({
    id: nextId('doc'),
    applicationId: app.id,
    documentType,
    fileName: `${documentType.toLowerCase()}_${app.applicationCode.toLowerCase()}.pdf`,
    fileSizeKb: 180 + ((i * 7 + j * 13) % 900),
    uploadedAt: daysAgo(60 - i),
    verificationStatus: (['PENDING', 'VERIFIED', 'REJECTED'] as const)[(i + j) % 3],
  })),
);

export const appointments: Appointment[] = applications
  .filter((_, i) => i % 2 === 0)
  .map((app, i) => ({
    id: nextId('apt'),
    applicationId: app.id,
    appointmentDate: i % 3 === 0 ? daysAhead(3 + i) : daysAgo(10 + i * 2),
    slotTime: pick(['09:30', '10:00', '11:00', '14:30', '15:30'], i),
    status: (['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'] as const)[i % 4],
    centerName: pick(['PSK – Central District', 'PSK – North Zone', 'POPSK – Suburban Center'], i),
    createdAt: daysAgo(30 + i),
  }));

export const payments: Payment[] = applications
  .filter((_, i) => i % 2 === 1)
  .map((app, i) => ({
    id: nextId('pay'),
    applicationId: app.id,
    amount: [1500, 2000, 1500, 1000][i % 4],
    paymentDate: daysAgo(25 - i * 2),
    paymentStatus: (['PAID', 'PAID', 'PENDING', 'FAILED'] as const)[i % 4],
    method: (['UPI', 'CARD', 'NET_BANKING', 'CHALLAN'] as const)[i % 4],
    receiptNo: `RCP${20257000 + i}`,
  }));

export const verifications: Verification[] = applications
  .filter((a) => a.status === 'UNDER_VERIFICATION' || a.status === 'APPROVED' || a.status === 'PASSPORT_ISSUED' || a.status === 'REJECTED')
  .map((app, i) => ({
    id: nextId('ver'),
    verificationCode: `VRF${20259000 + i}`,
    applicationId: app.id,
    verificationType: (['POLICE', 'DOCUMENT', 'BIOMETRIC', 'FIELD'] as const)[i % 4],
    verificationDate: daysAgo(15 - (i % 12)),
    status: (['APPROVED', 'PENDING', 'REJECTED'] as const)[i % 3],
    remarks: ([
      'All documents verified successfully at PSK counter.',
      'Address mismatch found in Aadhaar. Field visit scheduled.',
      'Police verification completed with clean record.',
      'Biometric capture pending applicant visit.',
    ] as const)[i % 4],
    officerName: pick(['Officer Vijay', 'Officer Latha', 'Officer Anil', 'Officer Sunita'], i),
  }));

export const issuedPassports: IssuedPassport[] = applications
  .filter((a) => a.status === 'PASSPORT_ISSUED')
  .map((app, i) => ({
    id: nextId('psp'),
    passportNumber: `M${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}${1000000 + i * 137}`,
    applicationId: app.id,
    issueDate: daysAgo(5 + i * 3),
    expiryDate: daysAhead(3650 - i),
    status: 'ACTIVE',
    placeOfIssue: app.placeOfIssue,
  }));

// ─── Stats ───────────────────────────────────────────────────────────────────

export const monthlySeries = (base: number): MonthlyPoint[] =>
  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => ({
    month,
    applications: Math.round(base * (0.6 + ((i * 37) % 80) / 100)),
    approved: Math.round(base * (0.4 + ((i * 23) % 50) / 100)),
    rejected: Math.round(base * 0.08 + (i % 4)),
  }));

export const statusDistribution = (list: { status: ApplicationStatus }[]): StatusSlice[] =>
  Object.entries(
    list.reduce<Record<string, number>>((acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc), {}),
  ).map(([status, count]) => ({ status: status as ApplicationStatus, count }));

export const adminStats: AdminStats = {
  applicantCount: applicants.length,
  applicationCount: applications.length,
  documentCount: documents.length,
  verificationCount: verifications.length,
  passportCount: issuedPassports.length,
  monthly: monthlySeries(60),
  statusDistribution: statusDistribution(applications),
  activities: [
    { id: 'act-1', actor: 'Officer Vijay', action: 'approved police verification for', target: 'PAS20253042', timestamp: daysAgo(0.1), severity: 'success' },
    { id: 'act-2', actor: 'Ravi Kumar', action: 'uploaded document', target: 'Aadhaar Card', timestamp: daysAgo(0.4), severity: 'info' },
    { id: 'act-3', actor: 'System Admin', action: 'rejected application', target: 'PAS20253031', timestamp: daysAgo(1.2), severity: 'danger' },
    { id: 'act-4', actor: 'Ravi Kumar', action: 'paid fee for', target: 'PAS20253033', timestamp: daysAgo(2), severity: 'info' },
    { id: 'act-5', actor: 'Officer Latha', action: 'issued passport', target: 'MA4102718', timestamp: daysAgo(2.6), severity: 'success' },
    { id: 'act-6', actor: 'Diya Patel', action: 'booked appointment at', target: 'PSK – Central District', timestamp: daysAgo(3.1), severity: 'info' },
    { id: 'act-7', actor: 'System Monitor', action: 'flagged payment failure on', target: 'RCP20257003', timestamp: daysAgo(3.8), severity: 'warning' },
  ],
  system: { uptimePercent: 99.97, apiLatencyMs: 142, queueDepth: 23, dbStorageUsedPercent: 61 },
};

export const applicantStats: ApplicantStats = {
  totalApplications: 0,
  pendingApplications: 0,
  approvedApplications: 0,
  rejectedApplications: 0,
  monthly: monthlySeries(4),
  statusDistribution: [],
  activities: adminStats.activities.slice(0, 5),
};

export const computeApplicantStats = (mine: MockApplication[]): ApplicantStats => ({
  totalApplications: mine.length,
  pendingApplications: mine.filter((a) => !['APPROVED', 'REJECTED', 'PASSPORT_ISSUED'].includes(a.status)).length,
  approvedApplications: mine.filter((a) => ['APPROVED', 'PASSPORT_ISSUED'].includes(a.status)).length,
  rejectedApplications: mine.filter((a) => a.status === 'REJECTED').length,
  monthly: monthlySeries(Math.max(3, Math.ceil(mine.length / 2))),
  statusDistribution: statusDistribution(mine),
  activities: adminStats.activities.slice(0, 5),
});

export const resetMockDb = (): void => {
  seq = 1000;
};

export const newId = nextId;
export { daysAgo, daysAhead, pick };
