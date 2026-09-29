import { z } from 'zod';

const id = z.string().min(1).max(30);
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/);
const dateOfBirth = z.coerce.date().refine((value) => value < new Date(), 'Date of birth must be in the past.');

export const registerSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth,
  phone,
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(3).max(20),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(20).max(500) });
export const forgotPasswordSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()) });
export const resetPasswordSchema = z.object({ token: z.string().min(20).max(500), password: z.string().min(12).max(128) });

export const applicantCreateSchema = z.object({
  userId: id,
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth,
  phone,
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(3).max(20),
});

export const applicantUpdateSchema = applicantCreateSchema.omit({ userId: true }).partial();
export const applicationCreateSchema = z.object({ type: z.enum(['FRESH', 'REISSUE']), notes: z.string().trim().max(2000).optional() });
export const applicationUpdateSchema = z.object({ type: z.enum(['FRESH', 'REISSUE']).optional(), notes: z.string().trim().max(2000).nullable().optional() }).refine((value) => Object.keys(value).length > 0);
export const statusSchema = z.object({ status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'APPOINTMENT_BOOKED', 'VERIFIED', 'APPROVED', 'REJECTED', 'CANCELLED']) });
export const documentUploadSchema = z.object({ applicationId: id, kind: z.enum(['IDENTITY', 'ADDRESS', 'DATE_OF_BIRTH', 'PHOTOGRAPH', 'OTHER']) });
export const documentReviewSchema = z.object({ status: z.enum(['VERIFIED', 'REJECTED']), remarks: z.string().trim().max(1000).optional() });
export const appointmentCreateSchema = z.object({ applicationId: id, center: z.string().trim().min(2).max(200), startsAt: z.coerce.date().refine((value) => value > new Date()) });
export const appointmentUpdateSchema = z.object({ center: z.string().trim().min(2).max(200).optional(), startsAt: z.coerce.date().refine((value) => value > new Date()).optional() }).refine((value) => Object.keys(value).length > 0);
export const paymentCreateSchema = z.object({ applicationId: id });
export const verificationSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']), remarks: z.string().trim().min(1).max(2000) });
export const passportGenerateSchema = z.object({ applicationId: id, passportNumber: z.string().trim().regex(/^[A-Z0-9]{6,20}$/) });
export const passportStatusSchema = z.object({ status: z.enum(['GENERATED', 'ISSUED', 'REVOKED']) });
export const paymentWebhookSchema = z.object({
  paymentId: id,
  providerRef: z.string().trim().min(1).max(255),
  status: z.enum(['PAID', 'FAILED']),
  amount: z.coerce.number().positive(),
  currency: z.literal('INR'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});