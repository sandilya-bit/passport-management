import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService, type AppointmentFilters } from '@/services/appointmentService';
import type { Appointment } from '@/types';

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (filters: AppointmentFilters) => ['appointments', 'list', filters] as const,
};

export const useAppointments = (filters: AppointmentFilters) =>
  useQuery({
    queryKey: appointmentKeys.list(filters),
    queryFn: () => appointmentService.list(filters),
    placeholderData: (prev) => prev,
  });

export const useBookAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      applicationId: string;
      appointmentDate: string;
      slotTime: string;
      centerName: string;
    }) => appointmentService.book(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
};

export const useRescheduleAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { appointmentDate: string; slotTime: string } }) =>
      appointmentService.reschedule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
};

export const useCancelAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: appointmentKeys.all }),
  });
};
