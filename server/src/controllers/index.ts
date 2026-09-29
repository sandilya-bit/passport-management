import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import * as authService from '../services/auth.service';
import * as applicationService from '../services/application.service';
import * as appointmentService from '../services/appointment.service';
import * as documentService from '../services/document.service';
import * as passportService from '../services/passport.service';
import * as paymentService from '../services/payment.service';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { asyncHandler } from '../utils/async-handler';
import { paginationSchema, paymentWebhookSchema } from '../validators';
import { env } from '../config/env';

const currentUser = (request: Request) => {
  if (!request.user) throw new ApiError(401, 'Authentication is required.');
  return request.user;
};

const pagination = (request: Request) => {
  const parsed = paginationSchema.safeParse(request.query);
  if (!parsed.success) throw new ApiError(400, 'Invalid pagination parameters.', parsed.error.flatten());
  return parsed.data;
};

export const register = asyncHandler(async (request, response) => {
  response.status(201).json(await authService.register(request.body));
});

export const login = asyncHandler(async (request, response) => {
  response.json(await authService.login(request.body.email, request.body.password));
});

export const refresh = asyncHandler(async (request, response) => {
  response.json(await authService.refresh(request.body.refreshToken));
});

export const logout = asyncHandler(async (request, response) => {
  await authService.logout(request.body.refreshToken);
  response.status(204).end();
});

export const forgotPassword = asyncHandler(async (request, response) => {
  await authService.requestPasswordReset(request.body.email);
  response.status(202).json({ message: 'If the account exists, password reset instructions have been sent.' });
});

export const resetPassword = asyncHandler(async (request, response) => {
  await authService.resetPassword(request.body.token, request.body.password);
  response.status(204).end();
});

export const me = asyncHandler(async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: currentUser(request).id },
    select: { id: true, email: true, role: true, isActive: true, createdAt: true, applicant: true },
  });
  if (!user?.isActive) throw new ApiError(404, 'Account was not found.');
  response.json({ user });
});

export const listApplicants = asyncHandler(async (request, response) => {
  const { page, pageSize } = pagination(request);
  response.json(await applicationService.listApplicants(page, pageSize));
});

export const createApplicant = asyncHandler(async (request, response) => {
  response.status(201).json(await applicationService.createApplicant(request.body));
});

export const getApplicant = asyncHandler(async (request, response) => {
  response.json(await applicationService.getApplicant(request.params.id, currentUser(request)));
});

export const updateApplicant = asyncHandler(async (request, response) => {
  response.json(await applicationService.updateApplicant(request.params.id, request.body, currentUser(request)));
});

export const deleteApplicant = asyncHandler(async (request, response) => {
  await applicationService.deleteApplicant(request.params.id, currentUser(request));
  response.status(204).end();
});

export const listApplications = asyncHandler(async (request, response) => {
  const { page, pageSize } = pagination(request);
  response.json(await applicationService.listApplications(currentUser(request), page, pageSize));
});

export const createApplication = asyncHandler(async (request, response) => {
  response.status(201).json(await applicationService.createApplication(request.body, currentUser(request)));
});

export const getApplication = asyncHandler(async (request, response) => {
  response.json(await applicationService.getApplication(request.params.id, currentUser(request)));
});

export const updateApplication = asyncHandler(async (request, response) => {
  response.json(await applicationService.updateApplication(request.params.id, request.body, currentUser(request)));
});

export const deleteApplication = asyncHandler(async (request, response) => {
  await applicationService.deleteApplication(request.params.id, currentUser(request));
  response.status(204).end();
});

export const updateApplicationStatus = asyncHandler(async (request, response) => {
  response.json(await applicationService.updateApplicationStatus(request.params.id, request.body.status, currentUser(request)));
});

export const listDocuments = asyncHandler(async (request, response) => {
  response.json(await documentService.listApplicationDocuments(request.params.applicationId, currentUser(request)));
});

export const uploadDocument = asyncHandler(async (request, response) => {
  response.status(201).json(await documentService.uploadApplicationDocument(request.body, request.file, currentUser(request)));
});

export const reviewDocument = asyncHandler(async (request, response) => {
  response.json(await documentService.reviewDocument(request.params.id, request.body.status, request.body.remarks, currentUser(request)));
});

export const downloadDocument = asyncHandler(async (request, response) => {
  response.redirect(302, await documentService.getDocumentDownload(request.params.id, currentUser(request)));
});

export const listAppointments = asyncHandler(async (request, response) => {
  const applicationId = typeof request.query.applicationId === 'string' ? request.query.applicationId : undefined;
  response.json(await appointmentService.listAppointments(currentUser(request), applicationId));
});

export const bookAppointment = asyncHandler(async (request, response) => {
  response.status(201).json(await appointmentService.bookAppointment(request.body, currentUser(request)));
});

export const rescheduleAppointment = asyncHandler(async (request, response) => {
  response.json(await appointmentService.rescheduleAppointment(request.params.id, request.body, currentUser(request)));
});

export const cancelAppointment = asyncHandler(async (request, response) => {
  response.json(await appointmentService.cancelAppointment(request.params.id, currentUser(request)));
});

export const listPayments = asyncHandler(async (request, response) => {
  const applicationId = typeof request.query.applicationId === 'string' ? request.query.applicationId : undefined;
  response.json(await paymentService.listPayments(currentUser(request), applicationId));
});

export const createPayment = asyncHandler(async (request, response) => {
  response.status(201).json(await paymentService.createPayment(request.body.applicationId, currentUser(request)));
});

export const paymentReceipt = asyncHandler(async (request, response) => {
  const receipt = await paymentService.createPaymentReceipt(request.params.id, currentUser(request));
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="${receipt.receiptNumber}.pdf"`);
  response.send(receipt.buffer);
});

export const listVerifications = asyncHandler(async (request, response) => {
  const applicationId = typeof request.query.applicationId === 'string' ? request.query.applicationId : undefined;
  response.json(await passportService.listVerifications(applicationId, currentUser(request)));
});

export const reviewApplication = asyncHandler(async (request, response) => {
  response.status(201).json(await passportService.reviewApplication(request.params.applicationId, request.body, currentUser(request)));
});

export const listPassports = asyncHandler(async (request, response) => {
  response.json(await passportService.listPassports(currentUser(request)));
});

export const generatePassport = asyncHandler(async (request, response) => {
  response.status(201).json(await passportService.generatePassport(request.body.applicationId, request.body.passportNumber, currentUser(request)));
});

export const updatePassportStatus = asyncHandler(async (request, response) => {
  response.json(await passportService.updatePassportStatus(request.params.id, request.body.status, currentUser(request)));
});

export const paymentWebhook = asyncHandler(async (request, response) => {
  if (!env.PAYMENT_WEBHOOK_SECRET) throw new ApiError(503, 'Payment webhook is not configured.');
  if (!Buffer.isBuffer(request.body)) throw new ApiError(400, 'Expected a raw JSON webhook body.');
  const signature = request.header('x-pams-signature') ?? '';
  const expected = createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(request.body).digest();
  const received = Buffer.from(signature, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new ApiError(401, 'Invalid payment webhook signature.');

  let payload: unknown;
  try {
    payload = JSON.parse(request.body.toString('utf8'));
  } catch {
    throw new ApiError(400, 'Webhook body must be valid JSON.');
  }
  const parsed = paymentWebhookSchema.safeParse(payload);
  if (!parsed.success) throw new ApiError(400, 'Payment webhook validation failed.', parsed.error.flatten());
  response.json(await paymentService.applyPaymentWebhook(parsed.data));
});