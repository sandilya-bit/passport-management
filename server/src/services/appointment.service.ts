import { prisma } from '../config/prisma';
import type { AuthUser } from '../middleware/auth';
import { getApplicationForUser } from '../repositories/access.repository';
import { ApiError } from '../utils/api-error';

async function assertSlotAvailable(center: string, startsAt: Date, exceptId?: string) {
  const windowStart = new Date(startsAt.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(startsAt.getTime() + 30 * 60 * 1000);
  const conflict = await prisma.appointment.findFirst({
    where: {
      center,
      startsAt: { gt: windowStart, lt: windowEnd },
      status: { in: ['BOOKED', 'RESCHEDULED'] },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (conflict) throw new ApiError(409, 'That center has no available slot at the selected time.');
}

export async function listAppointments(user: AuthUser, applicationId?: string) {
  if (applicationId) await getApplicationForUser(applicationId, user);
  return prisma.appointment.findMany({
    where: {
      ...(applicationId ? { applicationId } : {}),
      ...(user.role === 'APPLICANT' ? { bookedById: user.id } : {}),
    },
    orderBy: { startsAt: 'asc' },
  });
}

export async function bookAppointment(input: { applicationId: string; center: string; startsAt: Date }, user: AuthUser) {
  if (user.role !== 'APPLICANT') throw new ApiError(403, 'Only applicants can book appointments.');
  const application = await getApplicationForUser(input.applicationId, user);
  if (!['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED'].includes(application.status)) throw new ApiError(409, 'This application is not ready for an appointment.');
  await assertSlotAvailable(input.center, input.startsAt);
  const appointment = await prisma.$transaction(async (transaction) => {
    const created = await transaction.appointment.create({ data: { ...input, bookedById: user.id } });
    if (application.status === 'SUBMITTED') {
      await transaction.application.update({ where: { id: application.id }, data: { status: 'APPOINTMENT_BOOKED' } });
    }
    return created;
  });
  return appointment;
}

async function getOwnedAppointment(id: string, user: AuthUser) {
  const appointment = await prisma.appointment.findUnique({ where: { id }, include: { application: { include: { applicant: true } } } });
  if (!appointment || (user.role === 'APPLICANT' && appointment.application.applicant.userId !== user.id)) throw new ApiError(404, 'Appointment was not found.');
  return appointment;
}

export async function rescheduleAppointment(id: string, input: { center?: string; startsAt?: Date }, user: AuthUser) {
  if (user.role !== 'APPLICANT') throw new ApiError(403, 'Only applicants can reschedule appointments.');
  const appointment = await getOwnedAppointment(id, user);
  if (!['BOOKED', 'RESCHEDULED'].includes(appointment.status)) throw new ApiError(409, 'This appointment cannot be rescheduled.');
  const center = input.center ?? appointment.center;
  const startsAt = input.startsAt ?? appointment.startsAt;
  await assertSlotAvailable(center, startsAt, id);
  return prisma.appointment.update({ where: { id }, data: { center, startsAt, status: 'RESCHEDULED' } });
}

export async function cancelAppointment(id: string, user: AuthUser) {
  const appointment = await getOwnedAppointment(id, user);
  if (!['OFFICER', 'ADMIN', 'APPLICANT'].includes(user.role)) throw new ApiError(403, 'You cannot cancel this appointment.');
  if (!['BOOKED', 'RESCHEDULED'].includes(appointment.status)) throw new ApiError(409, 'This appointment cannot be cancelled.');
  return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
}