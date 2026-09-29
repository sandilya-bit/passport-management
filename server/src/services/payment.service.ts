import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma';
import type { AuthUser } from '../middleware/auth';
import { getApplicationForUser } from '../repositories/access.repository';
import { ApiError } from '../utils/api-error';
import { createReference } from '../utils/crypto';

const fees = { FRESH: 1500, REISSUE: 1000 } as const;

export async function createPayment(applicationId: string, user: AuthUser) {
  const application = await getApplicationForUser(applicationId, user);
  if (user.role !== 'APPLICANT') throw new ApiError(403, 'Only applicants can create payments.');
  if (['DRAFT', 'REJECTED', 'CANCELLED'].includes(application.status)) throw new ApiError(409, 'This application is not eligible for payment.');

  const existing = await prisma.payment.findFirst({
    where: { applicationId, status: { in: ['PENDING', 'PAID'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing?.status === 'PAID') throw new ApiError(409, 'This application already has a completed payment.');
  if (existing) return existing;

  return prisma.payment.create({
    data: {
      applicationId,
      amount: fees[application.type],
      currency: 'INR',
      receiptNumber: createReference('RCP'),
    },
  });
}

export async function listPayments(user: AuthUser, applicationId?: string) {
  if (applicationId) await getApplicationForUser(applicationId, user);
  return prisma.payment.findMany({
    where: {
      ...(applicationId ? { applicationId } : {}),
      ...(user.role === 'APPLICANT' ? { application: { applicant: { userId: user.id } } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPaymentReceipt(id: string, user: AuthUser) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { application: { include: { applicant: { include: { user: { select: { email: true } } } } } } },
  });
  if (!payment || (user.role === 'APPLICANT' && payment.application.applicant.userId !== user.id)) throw new ApiError(404, 'Payment was not found.');
  if (payment.status !== 'PAID' || !payment.paidAt) throw new ApiError(409, 'A receipt is available after payment has been confirmed.');

  const document = new PDFDocument({ size: 'A4', margin: 56, info: { Title: `Payment receipt ${payment.receiptNumber}` } });
  const chunks: Buffer[] = [];
  document.on('data', (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });
  document.fontSize(20).text('Passport Application Management System', { align: 'center' });
  document.moveDown().fontSize(16).text('Payment Receipt', { align: 'center' });
  document.moveDown(2).fontSize(11);
  document.text(`Receipt number: ${payment.receiptNumber}`);
  document.text(`Application number: ${payment.application.applicationNumber}`);
  document.text(`Applicant: ${payment.application.applicant.firstName} ${payment.application.applicant.lastName}`);
  document.text(`Email: ${payment.application.applicant.user.email}`);
  document.text(`Amount: ${payment.currency} ${payment.amount.toFixed(2)}`);
  document.text(`Payment reference: ${payment.providerRef ?? 'Not provided'}`);
  document.text(`Paid at: ${payment.paidAt.toISOString()}`);
  document.end();
  return { receiptNumber: payment.receiptNumber, buffer: await finished };
}

export async function applyPaymentWebhook(input: {
  paymentId: string; providerRef: string; status: 'PAID' | 'FAILED'; amount: number; currency: 'INR';
}) {
  return prisma.$transaction(async (transaction) => {
    const payment = await transaction.payment.findUnique({ where: { id: input.paymentId } });
    if (!payment) throw new ApiError(404, 'Payment was not found.');
    if (payment.amount.toNumber() !== input.amount || payment.currency !== input.currency) {
      throw new ApiError(400, 'Webhook amount or currency does not match the payment.');
    }
    if (payment.status === input.status && payment.providerRef === input.providerRef) return payment;
    if (payment.status !== 'PENDING') throw new ApiError(409, 'Payment is already in a final state.');

    return transaction.payment.update({
      where: { id: payment.id },
      data: {
        status: input.status,
        providerRef: input.providerRef,
        paidAt: input.status === 'PAID' ? new Date() : null,
      },
    });
  });
}