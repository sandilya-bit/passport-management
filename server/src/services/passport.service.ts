import { prisma } from '../config/prisma';
import type { AuthUser } from '../middleware/auth';
import { getApplicationForUser } from '../repositories/access.repository';
import { ApiError } from '../utils/api-error';

export async function reviewApplication(
  applicationId: string,
  input: { status: 'APPROVED' | 'REJECTED'; remarks: string },
  user: AuthUser,
) {
  const application = await getApplicationForUser(applicationId, user);
  if (!['OFFICER', 'ADMIN'].includes(user.role)) throw new ApiError(403, 'Only officers can review applications.');
  if (!['UNDER_REVIEW', 'APPOINTMENT_BOOKED'].includes(application.status)) throw new ApiError(409, 'This application is not ready for review.');

  return prisma.$transaction(async (transaction) => {
    const verification = await transaction.verification.create({
      data: { applicationId, reviewerId: user.id, status: input.status, remarks: input.remarks },
    });
    await transaction.application.update({
      where: { id: applicationId },
      data: { status: input.status === 'APPROVED' ? 'VERIFIED' : 'REJECTED' },
    });
    return verification;
  });
}

export async function listVerifications(applicationId: string | undefined, user: AuthUser) {
  if (applicationId) await getApplicationForUser(applicationId, user);
  return prisma.verification.findMany({
    where: {
      ...(applicationId ? { applicationId } : {}),
      ...(user.role === 'APPLICANT' ? { application: { applicant: { userId: user.id } } } : {}),
    },
    include: { reviewer: { select: { id: true, email: true } } },
    orderBy: { reviewedAt: 'desc' },
  });
}

export async function generatePassport(applicationId: string, passportNumber: string, user: AuthUser) {
  const application = await getApplicationForUser(applicationId, user);
  if (!['OFFICER', 'ADMIN'].includes(user.role)) throw new ApiError(403, 'Only officers can generate passport records.');
  if (application.status !== 'VERIFIED') throw new ApiError(409, 'The application must be verified before a passport can be generated.');
  return prisma.$transaction(async (transaction) => {
    const passport = await transaction.passport.create({ data: { applicationId, passportNumber } });
    await transaction.application.update({ where: { id: applicationId }, data: { status: 'APPROVED' } });
    return passport;
  });
}

export async function updatePassportStatus(id: string, status: 'GENERATED' | 'ISSUED' | 'REVOKED', user: AuthUser) {
  const passport = await prisma.passport.findUnique({ where: { id }, include: { application: { include: { applicant: true } } } });
  if (!passport || (user.role === 'APPLICANT' && passport.application.applicant.userId !== user.id)) throw new ApiError(404, 'Passport was not found.');
  if (!['OFFICER', 'ADMIN'].includes(user.role)) throw new ApiError(403, 'Only officers can update passport status.');
  if (status === 'GENERATED') throw new ApiError(409, 'Passport status cannot be reset to generated.');
  if (passport.status === 'REVOKED' || passport.status === 'ISSUED') throw new ApiError(409, 'This passport status is final.');

  const issuedAt = status === 'ISSUED' ? new Date() : null;
  const expiresAt = issuedAt ? new Date(issuedAt) : null;
  if (expiresAt) expiresAt.setFullYear(expiresAt.getFullYear() + 10);
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.passport.update({ where: { id }, data: { status, issuedAt, expiresAt } });
    if (status === 'ISSUED') await transaction.application.update({ where: { id: passport.applicationId }, data: { status: 'PASSPORT_ISSUED' } });
    return updated;
  });
}

export async function listPassports(user: AuthUser) {
  return prisma.passport.findMany({
    where: user.role === 'APPLICANT' ? { application: { applicant: { userId: user.id } } } : {},
    include: { application: { select: { applicationNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });
}