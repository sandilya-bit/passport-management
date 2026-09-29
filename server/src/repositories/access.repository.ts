import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import type { AuthUser } from '../middleware/auth';

export async function getApplicantForUser(userId: string) {
  const applicant = await prisma.applicant.findUnique({ where: { userId } });
  if (!applicant) throw new ApiError(404, 'Applicant profile was not found.');
  return applicant;
}

export async function getApplicationForUser(applicationId: string, user: AuthUser) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { applicant: { include: { user: { select: { id: true, email: true } } } } },
  });
  if (!application) throw new ApiError(404, 'Application was not found.');
  if (user.role === 'APPLICANT' && application.applicant.userId !== user.id) throw new ApiError(404, 'Application was not found.');
  return application;
}