import { Router } from 'express';
import * as controller from '../controllers';
import { authenticate, authorize } from '../middleware/auth';
import { documentUpload } from '../middleware/upload';
import { createRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';
import {
  applicantCreateSchema, applicantUpdateSchema, applicationCreateSchema, applicationUpdateSchema,
  appointmentCreateSchema, appointmentUpdateSchema, documentReviewSchema, documentUploadSchema,
  forgotPasswordSchema, loginSchema, passportGenerateSchema, passportStatusSchema, paymentCreateSchema,
  refreshSchema, registerSchema, resetPasswordSchema, statusSchema, verificationSchema,
} from '../validators';

export const apiRouter = Router();
const authBurstLimit = createRateLimiter('auth', 10, 60);

const authRouter = Router();
authRouter.post('/register', authBurstLimit, validateBody(registerSchema), controller.register);
authRouter.post('/login', authBurstLimit, validateBody(loginSchema), controller.login);
authRouter.post('/refresh', authBurstLimit, validateBody(refreshSchema), controller.refresh);
authRouter.post('/logout', validateBody(refreshSchema), controller.logout);
authRouter.post('/forgot-password', authBurstLimit, validateBody(forgotPasswordSchema), controller.forgotPassword);
authRouter.post('/reset-password', authBurstLimit, validateBody(resetPasswordSchema), controller.resetPassword);
authRouter.get('/me', authenticate, controller.me);
apiRouter.use('/auth', authRouter);

apiRouter.post('/webhooks/payment', createRateLimiter('payment-webhook', 120, 60), controller.paymentWebhook);

const applicantRouter = Router();
applicantRouter.get('/', authenticate, authorize('OFFICER', 'ADMIN'), controller.listApplicants);
applicantRouter.post('/', authenticate, authorize('OFFICER', 'ADMIN'), validateBody(applicantCreateSchema), controller.createApplicant);
applicantRouter.get('/:id', authenticate, controller.getApplicant);
applicantRouter.patch('/:id', authenticate, validateBody(applicantUpdateSchema), controller.updateApplicant);
applicantRouter.delete('/:id', authenticate, authorize('ADMIN'), controller.deleteApplicant);
apiRouter.use('/applicants', applicantRouter);

const applicationRouter = Router();
applicationRouter.get('/', authenticate, controller.listApplications);
applicationRouter.post('/', authenticate, validateBody(applicationCreateSchema), controller.createApplication);
applicationRouter.get('/:id', authenticate, controller.getApplication);
applicationRouter.patch('/:id', authenticate, validateBody(applicationUpdateSchema), controller.updateApplication);
applicationRouter.patch('/:id/status', authenticate, validateBody(statusSchema), controller.updateApplicationStatus);
applicationRouter.delete('/:id', authenticate, controller.deleteApplication);
apiRouter.use('/applications', applicationRouter);

const documentRouter = Router();
documentRouter.post('/', authenticate, documentUpload, validateBody(documentUploadSchema), controller.uploadDocument);
documentRouter.get('/application/:applicationId', authenticate, controller.listDocuments);
documentRouter.patch('/:id/review', authenticate, authorize('OFFICER', 'ADMIN'), validateBody(documentReviewSchema), controller.reviewDocument);
documentRouter.get('/:id/download', authenticate, controller.downloadDocument);
apiRouter.use('/documents', documentRouter);

const appointmentRouter = Router();
appointmentRouter.get('/', authenticate, controller.listAppointments);
appointmentRouter.post('/', authenticate, validateBody(appointmentCreateSchema), controller.bookAppointment);
appointmentRouter.patch('/:id', authenticate, validateBody(appointmentUpdateSchema), controller.rescheduleAppointment);
appointmentRouter.delete('/:id', authenticate, controller.cancelAppointment);
apiRouter.use('/appointments', appointmentRouter);

const paymentRouter = Router();
paymentRouter.get('/', authenticate, controller.listPayments);
paymentRouter.post('/', authenticate, validateBody(paymentCreateSchema), controller.createPayment);
paymentRouter.get('/:id/receipt', authenticate, controller.paymentReceipt);
apiRouter.use('/payments', paymentRouter);

const verificationRouter = Router();
verificationRouter.get('/', authenticate, controller.listVerifications);
verificationRouter.post('/application/:applicationId', authenticate, authorize('OFFICER', 'ADMIN'), validateBody(verificationSchema), controller.reviewApplication);
apiRouter.use('/verifications', verificationRouter);

const passportRouter = Router();
passportRouter.get('/', authenticate, controller.listPassports);
passportRouter.post('/', authenticate, authorize('OFFICER', 'ADMIN'), validateBody(passportGenerateSchema), controller.generatePassport);
passportRouter.patch('/:id/status', authenticate, authorize('OFFICER', 'ADMIN'), validateBody(passportStatusSchema), controller.updatePassportStatus);
apiRouter.use('/passports', passportRouter);