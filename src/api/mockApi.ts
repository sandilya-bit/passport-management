import { useAuthStore } from '@/store/authStore';
import * as mock from './mockData';
import type {
  AdminStats,
  ApplicantStats,
  Page,
  PageRequest,
  Applicant,
  User,
  PassportApplication,
  ApplicationStatus,
  ApplicationType,
  DocumentFile,
  DocumentType,
  VerificationStatus,
  Appointment,
  Payment,
  Verification,
  IssuedPassport,
} from '@/types';

/**
 * Mock REST adapter. Every service in this app is written against real REST
 * contracts (axios `api` calls). In demo mode — when no `VITE_API_BASE_URL` is
 * configured — these handlers serve the in-memory database instead so the UI
 * is fully functional. Setting the env var swaps in the real backend with
 * zero component changes.
 */

export const isMockMode = !import.meta.env.VITE_API_BASE_URL;

const delay = (ms = 260): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ─── Generic paging/search/sort over an in-memory list ──────────────────────

export function paginate<T>(
  list: T[],
  params: PageRequest & object,
  matchers: Partial<Record<keyof T, (row: T, value: unknown) => boolean>>,
  searchFields: (keyof T)[],
  defaultSort: keyof T,
): Page<T> {
  const page = Math.max(0, params.page ?? 0);
  const size = params.size ?? 10;
  let out = [...list];

  for (const [key, matcher] of Object.entries(matchers) as [string, ((row: T, value: unknown) => boolean) | undefined][]) {
    const value = (params as Record<string, unknown>)[key];
    if (value !== undefined && value !== null && value !== '' && matcher) {
      out = out.filter((row) => matcher(row, value));
    }
  }

  const search = (params.search ?? '').toString().trim().toLowerCase();
  if (search) {
    out = out.filter((row) =>
      searchFields.some((f) => String(row[f] ?? '').toLowerCase().includes(search)),
    );
  }

  const sortBy = (params.sortBy as keyof T) ?? defaultSort;
  const dir = params.sortDir === 'asc' ? 1 : -1;
  out.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * dir;
  });

  return {
    content: out.slice(page * size, page * size + size),
    totalElements: out.length,
    totalPages: Math.max(1, Math.ceil(out.length / size)),
    page,
    size,
  };
}

const rejects = async <T>(fn: () => T, ms = 260): Promise<T> => {
  await delay(ms);
  return fn();
};

export type MockSession = import('@/types').AuthSession;

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export const mockLogin = async (payload: LoginPayload): Promise<MockSession> => rejects(() => {
  const user = mock.users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
  if (!user || payload.password !== mock.DEMO_PASSWORD) {
    throw new HttpError(401, 'Invalid email or password. Try a demo account below.');
  }
  return {
    accessToken: `mock.jwt.${btoa(user.id)}.${Date.now()}`,
    refreshToken: `mock.refresh.${user.id}`,
    user,
  };
});

export const mockRegister = async (payload: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<User> => rejects(() => {
  if (mock.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new HttpError(409, 'An account with this email already exists.');
  }
  const user: User = {
    id: mock.newId('usr'),
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    role: 'APPLICANT',
    createdAt: new Date().toISOString(),
  };
  mock.users.push(user);
  return user;
});

export const mockForgotPassword = async (email: string): Promise<{ message: string }> =>
  rejects(() => ({
    message: `If an account exists for ${email}, a reset link has been sent.`,
  }));

export const mockResetPassword = async (_token: string, _password: string): Promise<{ message: string }> =>
  rejects(() => ({ message: 'Password has been reset successfully. Please sign in.' }));

// ─── Applicants ──────────────────────────────────────────────────────────────

export const mockListApplicants = async (params: PageRequest): Promise<Page<Applicant>> =>
  rejects(() =>
    paginate(
      mock.applicants,
      params,
      {
        gender: (r, v) => r.gender === v,
      },
      ['applicantCode', 'fullName', 'email', 'phone'],
      'createdAt',
    ),
  );

export const mockCreateApplicant = async (payload: Partial<Applicant>): Promise<Applicant> =>
  rejects(() => {
    const applicant: Applicant = {
      id: mock.newId('apl'),
      applicantCode: `APL${20260100 + mock.applicants.length}`,
      fullName: payload.fullName!,
      dateOfBirth: payload.dateOfBirth!,
      gender: payload.gender!,
      address: payload.address!,
      phone: payload.phone!,
      email: payload.email!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mock.applicants.unshift(applicant);
    return applicant;
  });

export const mockUpdateApplicant = async (id: string, payload: Partial<Applicant>): Promise<Applicant> =>
  rejects(() => {
    const idx = mock.applicants.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, 'Applicant not found');
    mock.applicants[idx] = { ...mock.applicants[idx], ...payload, updatedAt: new Date().toISOString() };
    return mock.applicants[idx];
  });

export const mockDeleteApplicant = async (id: string): Promise<void> =>
  rejects(() => {
    const idx = mock.applicants.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, 'Applicant not found');
    mock.applicants.splice(idx, 1);
  });

// ─── Applications ────────────────────────────────────────────────────────────

export const mockListApplications = async (
  params: PageRequest & { status?: ApplicationStatus | ''; applicationType?: ApplicationType | '' },
): Promise<Page<PassportApplication>> =>
  rejects(() =>
    paginate(
      mock.applications,
      params,
      {
        status: (r, v) => r.status === v,
        applicationType: (r, v) => r.applicationType === v,
      },
      ['applicationCode', 'placeOfIssue', 'status'],
      'applicationDate',
    ),
  );

export const mockListMyApplications = async (
  userId: string,
  params: PageRequest & { status?: ApplicationStatus | ''; applicationType?: ApplicationType | '' },
): Promise<Page<PassportApplication>> =>
  rejects(() => {
    const mine = mock.applications
      .filter((a) => a.ownerUserId === userId)
      .map(({ ownerUserId: _o, ...rest }) => rest);
    return paginate(mine, params, {}, ['applicationCode', 'placeOfIssue', 'status'], 'applicationDate');
  });

export const mockCreateApplication = async (payload: {
  applicantId: string;
  applicationType: ApplicationType;
  placeOfIssue: string;
}): Promise<PassportApplication> =>
  rejects(() => {
    const app: mock.MockApplication = {
      id: mock.newId('app'),
      applicationCode: `PAS${20261000 + mock.applications.length}`,
      applicantId: payload.applicantId,
      applicationType: payload.applicationType,
      status: 'SUBMITTED',
      applicationDate: new Date().toISOString(),
      placeOfIssue: payload.placeOfIssue,
      updatedAt: new Date().toISOString(),
      ownerUserId: useAuthStoreUserId(),
    };
    mock.applications.unshift(app);
    return app;
  });

export const mockUpdateApplication = async (
  id: string,
  payload: Partial<PassportApplication>,
): Promise<PassportApplication> =>
  rejects(() => {
    const idx = mock.applications.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, 'Application not found');
    mock.applications[idx] = { ...mock.applications[idx], ...payload, updatedAt: new Date().toISOString() };
    const { ownerUserId: _o, ...rest } = mock.applications[idx];
    return rest;
  });

export const mockDeleteApplication = async (id: string): Promise<void> =>
  rejects(() => {
    const idx = mock.applications.findIndex((a) => a.id === id);
    if (idx === -1) throw new HttpError(404, 'Application not found');
    mock.applications.splice(idx, 1);
  });

const useAuthStoreUserId = (): string => useAuthStore.getState().user?.id ?? 'usr-1';

// ─── Documents ───────────────────────────────────────────────────────────────

export const mockListDocuments = async (
  params: PageRequest & { applicationId?: string; documentType?: DocumentType | ''; verificationStatus?: VerificationStatus | '' },
): Promise<Page<DocumentFile>> =>
  rejects(() =>
    paginate(
      mock.documents,
      params,
      {
        applicationId: (r, v) => r.applicationId === v,
        documentType: (r, v) => r.documentType === v,
        verificationStatus: (r, v) => r.verificationStatus === v,
      },
      ['fileName', 'documentType'],
      'uploadedAt',
    ),
  );

export const mockUploadDocument = async (
  payload: { applicationId: string; documentType: DocumentType; file: File },
): Promise<DocumentFile> =>
  rejects(() => {
    const doc: DocumentFile = {
      id: mock.newId('doc'),
      applicationId: payload.applicationId,
      documentType: payload.documentType,
      fileName: payload.file.name,
      fileSizeKb: Math.max(1, Math.round(payload.file.size / 1024)) || 240,
      uploadedAt: new Date().toISOString(),
      verificationStatus: 'PENDING',
    };
    mock.documents.unshift(doc);
    return doc;
  }, 700);

export const mockDeleteDocument = async (id: string): Promise<void> =>
  rejects(() => {
    const idx = mock.documents.findIndex((d) => d.id === id);
    if (idx === -1) throw new HttpError(404, 'Document not found');
    mock.documents.splice(idx, 1);
  });

export const mockSetDocumentVerification = async (
  id: string,
  status: VerificationStatus,
): Promise<DocumentFile> =>
  rejects(() => {
    const doc = mock.documents.find((d) => d.id === id);
    if (!doc) throw new HttpError(404, 'Document not found');
    doc.verificationStatus = status;
    return doc;
  });

// ─── Appointments ────────────────────────────────────────────────────────────

export const mockListAppointments = async (
  params: PageRequest & { status?: Appointment['status'] | ''; applicationId?: string },
): Promise<Page<Appointment>> =>
  rejects(() =>
    paginate(
      mock.appointments,
      params,
      {
        status: (r, v) => r.status === v,
        applicationId: (r, v) => r.applicationId === v,
      },
      ['centerName', 'status'],
      'appointmentDate',
    ),
  );

export const mockBookAppointment = async (payload: {
  applicationId: string;
  appointmentDate: string;
  slotTime: string;
  centerName: string;
}): Promise<Appointment> =>
  rejects(() => {
    if (mock.appointments.some(
      (a) =>
        a.appointmentDate === payload.appointmentDate &&
        a.slotTime === payload.slotTime &&
        a.centerName === payload.centerName &&
        a.status === 'SCHEDULED',
    )) {
      throw new HttpError(409, 'That slot has just been taken. Please pick another.');
    }
    const apt: Appointment = {
      id: mock.newId('apt'),
      applicationId: payload.applicationId,
      appointmentDate: payload.appointmentDate,
      slotTime: payload.slotTime,
      status: 'SCHEDULED',
      centerName: payload.centerName,
      createdAt: new Date().toISOString(),
    };
    mock.appointments.unshift(apt);
    return apt;
  });

export const mockRescheduleAppointment = async (
  id: string,
  payload: { appointmentDate: string; slotTime: string },
): Promise<Appointment> =>
  rejects(() => {
    const apt = mock.appointments.find((a) => a.id === id);
    if (!apt) throw new HttpError(404, 'Appointment not found');
    apt.appointmentDate = payload.appointmentDate;
    apt.slotTime = payload.slotTime;
    apt.status = 'RESCHEDULED';
    return apt;
  });

export const mockCancelAppointment = async (id: string): Promise<Appointment> =>
  rejects(() => {
    const apt = mock.appointments.find((a) => a.id === id);
    if (!apt) throw new HttpError(404, 'Appointment not found');
    apt.status = 'CANCELLED';
    return apt;
  });

// ─── Payments ────────────────────────────────────────────────────────────────

export const mockListPayments = async (
  params: PageRequest & { applicationId?: string; paymentStatus?: Payment['paymentStatus'] | '' },
): Promise<Page<Payment>> =>
  rejects(() =>
    paginate(
      mock.payments,
      params,
      {
        applicationId: (r, v) => r.applicationId === v,
        paymentStatus: (r, v) => r.paymentStatus === v,
      },
      ['receiptNo', 'method'],
      'paymentDate',
    ),
  );

export const mockPayFee = async (payload: {
  applicationId: string;
  amount: number;
  method: Payment['method'];
}): Promise<Payment> =>
  rejects(() => {
    const payment: Payment = {
      id: mock.newId('pay'),
      applicationId: payload.applicationId,
      amount: payload.amount,
      paymentDate: new Date().toISOString(),
      paymentStatus: 'PAID',
      method: payload.method,
      receiptNo: `RCP${20269000 + mock.payments.length}`,
    };
    mock.payments.unshift(payment);
    return payment;
  }, 900);

// ─── Verification ────────────────────────────────────────────────────────────

export const mockListVerifications = async (
  params: PageRequest & {
    applicationId?: string;
    verificationType?: Verification['verificationType'] | '';
    status?: Verification['status'] | '';
  },
): Promise<Page<Verification>> =>
  rejects(() =>
    paginate(
      mock.verifications,
      params,
      {
        applicationId: (r, v) => r.applicationId === v,
        verificationType: (r, v) => r.verificationType === v,
        status: (r, v) => r.status === v,
      },
      ['verificationCode', 'officerName', 'remarks'],
      'verificationDate',
    ),
  );

export const mockCreateVerification = async (payload: {
  applicationId: string;
  verificationType: Verification['verificationType'];
}): Promise<Verification> =>
  rejects(() => {
    const v: Verification = {
      id: mock.newId('ver'),
      verificationCode: `VRF${20269500 + mock.verifications.length}`,
      applicationId: payload.applicationId,
      verificationType: payload.verificationType,
      verificationDate: new Date().toISOString(),
      status: 'PENDING',
      remarks: '',
      officerName: 'Officer Vijay',
    };
    mock.verifications.unshift(v);
    return v;
  });

export const mockDecideVerification = async (
  id: string,
  payload: { status: 'APPROVED' | 'REJECTED'; remarks: string },
): Promise<Verification> =>
  rejects(() => {
    const v = mock.verifications.find((x) => x.id === id);
    if (!v) throw new HttpError(404, 'Verification not found');
    v.status = payload.status;
    v.remarks = payload.remarks;
    v.verificationDate = new Date().toISOString();
    return v;
  });

// ─── Passports ───────────────────────────────────────────────────────────────

export const mockListPassports = async (
  params: PageRequest & { status?: IssuedPassport['status'] | '' },
): Promise<Page<IssuedPassport>> =>
  rejects(() =>
    paginate(
      mock.issuedPassports,
      params,
      { status: (r, v) => r.status === v },
      ['passportNumber', 'placeOfIssue'],
      'issueDate',
    ),
  );

export const mockIssuePassport = async (applicationId: string): Promise<IssuedPassport> =>
  rejects(() => {
    const app = mock.applications.find((a) => a.id === applicationId);
    if (!app) throw new HttpError(404, 'Application not found');
    app.status = 'PASSPORT_ISSUED';
    const passport: IssuedPassport = {
      id: mock.newId('psp'),
      passportNumber: `M${String.fromCharCode(65 + (mock.issuedPassports.length % 26))}${String.fromCharCode(66 + (mock.issuedPassports.length % 25))}${1000000 + mock.issuedPassports.length * 137}`,
      applicationId,
      issueDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 10 * 365.25 * 86_400_000).toISOString(),
      status: 'ACTIVE',
      placeOfIssue: app.placeOfIssue,
    };
    mock.issuedPassports.unshift(passport);
    return passport;
  }, 800);

// ─── Stats ───────────────────────────────────────────────────────────────────

export const mockGetAdminStats = async (): Promise<AdminStats> =>
  rejects(() => mock.adminStats, 400);

export const mockGetApplicantStats = async (userId: string): Promise<ApplicantStats> =>
  rejects(() => {
    const mine = mock.applications.filter((a) => a.ownerUserId === userId);
    return mock.computeApplicantStats(mine);
  }, 350);
