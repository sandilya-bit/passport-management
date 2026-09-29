import { api, unwrap } from '@/api/client';
import {
  isMockMode,
  mockListAppointments,
  mockBookAppointment,
  mockRescheduleAppointment,
  mockCancelAppointment,
} from '@/api/mockApi';
import type { Appointment, Page, PageRequest } from '@/types';

export interface AppointmentFilters extends PageRequest {
  status?: Appointment['status'] | '';
  applicationId?: string;
}

export const appointmentService = {
  list(params: AppointmentFilters): Promise<Page<Appointment>> {
    if (isMockMode) return mockListAppointments(params);
    return unwrap(api.get('/appointments', { params }));
  },
  book(payload: {
    applicationId: string;
    appointmentDate: string;
    slotTime: string;
    centerName: string;
  }): Promise<Appointment> {
    if (isMockMode) return mockBookAppointment(payload);
    return unwrap(api.post('/appointments', payload));
  },
  reschedule(id: string, payload: { appointmentDate: string; slotTime: string }): Promise<Appointment> {
    if (isMockMode) return mockRescheduleAppointment(id, payload);
    return unwrap(api.put(`/appointments/${id}`, payload));
  },
  cancel(id: string): Promise<Appointment> {
    if (isMockMode) return mockCancelAppointment(id);
    return unwrap(api.patch(`/appointments/${id}/cancel`, {}));
  },
};
