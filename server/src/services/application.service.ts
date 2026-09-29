import { prisma } from '../config/prisma';
import type { AuthUser } from '../middleware/auth';
import { getApplicantForUser, getApplicationForUser } from '../repositories/access.repository';
import { ApiError } from '../utils/api-error';
import { createReference } from '../utils/crypto';

type ApplicantFields = {
  firstName: string; lastName: string; dateOfBirth: Date; phone: string; address: string;
  city: string; state: string; postalCode: string;
};

export async function listApplicants(page: number, pageSize: number) {
  const [items, total] = await prisma.$transaction([
    prisma.applicant.findMany({
      skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, isActive: true } } },
    }),
    prisma.applicant.count(),
  ]);
  return { items, page, pageSize, total };
}

export async function createApplicant(input: ApplicantFields & { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true, applicant: { select: { id: true } } } });
  if (!user || user.role !== 'APPLICANT' || user.applicant) throw new ApiError(409, 'Applicant account is unavailable or already has a profile.');
  return prisma.applicant.create({ data: input, include: { user: { select: { email: true, isActive: true } } } });
}

export async function getApplicant(id: string, user: AuthUser) {
  const applicant = await prisma.applicant.findUnique({ where: { id }, include: { user: { select: { email: true, isActive: true } } } });
  if (!applicant || (user.role === 'APPLICANT' && applicant.userId !== user.id)) throw new ApiError(404, 'Applicant was not found.');
  return applicant;
}

export async function updateApplicant(id: string, input: Partial<ApplicantFields>, user: AuthUser) {
  const applicant = await getApplicant(id, user);
  if (user.role === 'APPLICANT' && applicant.userId !== user.id) throw new ApiError(404, 'Applicant was not found.');
  return prisma.applicant.update({ where: { id }, data: input });
}

export async function deleteApplicant(id: string, user: AuthUser) {
  const applicant = await getApplicant(id, user);
  await prisma.user.update({ where: { id: applicant.userId }, data: { isActive: false } });
  return { deactivated: true };
}

export async function listApplications(user: AuthUser, page: number, pageSize: number) {
  const where = user.role === 'APPLICANT' ? { applicant: { userId: user.id } } : {};
  const [items, total] = await prisma.$transaction([
    prisma.application.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' },
      include: { applicant: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.application.count({ where }),
  ]);
  return { items, page, pageSize, total };
}

export async function createApplication(input: { type: 'FRESH' | 'REISSUE'; notes?: string }, user: AuthUser) {
  if (user.role !== 'APPLICANT') throw new ApiError(403, 'Only applicants can create an application.');
  const applicant = await getApplicantForUser(user.id);
  return prisma.application.create({ data: { ...input, applicationNumber: createReference('PAMS'), applicantId: applicant.id } });
}

export async function getApplication(id: string, user: AuthUser) {
  return getApplicationForUser(id, user);
}

export async function updateApplication(id: string, input: { type?: 'FRESH' | 'REISSUE'; notes?: string | null }, user: AuthUser) {
  const application = await getApplicationForUser(id, user);
  if (user.role !== 'APPLICANT' || !['DRAFT', 'DOCUMENTS_REQUIRED'].includes(application.status)) throw new ApiError(409, 'This application can no longer be edited.');
  return prisma.application.update({ where: { id }, data: input });
}

export async function deleteApplication(id: string, user: AuthUser) {
  const application = await getApplicationForUser(id, user);
  if (user.role !== 'APPLICANT' || application.status !== 'DRAFT') throw new ApiError(409, 'Only draft applications can be deleted.');
  await prisma.application.delete({ where: { id } });
}

const transitions: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['DOCUMENTS_REQUIRED', 'VERIFIED', 'REJECTED'],
  DOCUMENTS_REQUIRED: ['SUBMITTED', 'CANCELLED'],
  APPOINTMENT_BOOKED: ['UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'VERIFIED', 'REJECTED'],
  VERIFIED: ['APPROVED', 'REJECTED'],
};

export async function updateApplicationStatus(id: string, status: string, user: AuthUser) {
  const application = await getApplicationForUser(id, user);
  const applicantMayChange = user.role === 'APPLICANT' && ['SUBMITTED', 'CANCELLED'].includes(status);
  if (user.role === 'APPLICANT' && !applicantMayChange) throw new ApiError(403, 'Applicants cannot set this status.');
  if (user.role !== 'APPLICANT' && !['OFFICER', 'ADMIN'].includes(user.role)) throw new ApiError(403, 'You cannot update application status.');
  if (!transitions[application.status]?.includes(status)) throw new ApiError(409, `Cannot change application status from ${application.status} to ${status}.`);
  return prisma.application.update({ where: { id }, data: { status: status as never } });
}