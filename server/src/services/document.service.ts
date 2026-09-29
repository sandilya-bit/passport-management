import { createHash } from 'node:crypto';
import { prisma } from '../config/prisma';
import { createDocumentDownloadUrl, deleteStoredDocument, uploadDocument } from '../config/cloudinary';
import type { AuthUser } from '../middleware/auth';
import { getApplicationForUser } from '../repositories/access.repository';
import { ApiError } from '../utils/api-error';

export async function uploadApplicationDocument(
  input: { applicationId: string; kind: 'IDENTITY' | 'ADDRESS' | 'DATE_OF_BIRTH' | 'PHOTOGRAPH' | 'OTHER' },
  file: Express.Multer.File | undefined,
  user: AuthUser,
) {
  if (!file) throw new ApiError(400, 'A document file is required.');
  const isValidFile =
    (file.mimetype === 'application/pdf' && file.buffer.subarray(0, 5).toString('ascii') === '%PDF-') ||
    (file.mimetype === 'image/jpeg' && file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff) ||
    (file.mimetype === 'image/png' && file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])));
  if (!isValidFile) throw new ApiError(400, 'The file content does not match its declared document type.');
  const application = await getApplicationForUser(input.applicationId, user);
  const stored = await uploadDocument(file);
  try {
    return await prisma.document.create({
      data: {
        applicationId: application.id,
        uploadedById: user.id,
        kind: input.kind,
        originalName: file.originalname.slice(0, 255),
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
        cloudinaryPublicId: stored.publicId,
        secureUrl: stored.secureUrl,
      },
    });
  } catch (error) {
    await deleteStoredDocument(stored.publicId).catch(() => undefined);
    throw error;
  }
}

export async function listApplicationDocuments(applicationId: string, user: AuthUser) {
  await getApplicationForUser(applicationId, user);
  return prisma.document.findMany({ where: { applicationId }, orderBy: { createdAt: 'desc' } });
}

export async function reviewDocument(id: string, status: 'VERIFIED' | 'REJECTED', remarks: string | undefined, user: AuthUser) {
  const document = await prisma.document.findUnique({ where: { id }, include: { application: { include: { applicant: true } } } });
  if (!document || (user.role === 'APPLICANT' && document.application.applicant.userId !== user.id)) throw new ApiError(404, 'Document was not found.');
  if (user.role === 'APPLICANT') throw new ApiError(403, 'Applicants cannot review documents.');
  return prisma.document.update({
    where: { id },
    data: { status, reviewRemarks: remarks ?? null, reviewedById: user.id },
  });
}

export async function getDocumentDownload(id: string, user: AuthUser) {
  const document = await prisma.document.findUnique({ where: { id }, include: { application: { include: { applicant: true } } } });
  if (!document || (user.role === 'APPLICANT' && document.application.applicant.userId !== user.id)) throw new ApiError(404, 'Document was not found.');
  return createDocumentDownloadUrl(document.cloudinaryPublicId, document.originalName);
}