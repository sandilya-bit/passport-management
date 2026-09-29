import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicantService, type ApplicantFilters } from '@/services/applicantService';
import type { Applicant } from '@/types';

export const applicantKeys = {
  all: ['applicants'] as const,
  list: (filters: ApplicantFilters) => ['applicants', 'list', filters] as const,
};

export const useApplicants = (filters: ApplicantFilters) =>
  useQuery({
    queryKey: applicantKeys.list(filters),
    queryFn: () => applicantService.list(filters),
    placeholderData: (prev) => prev,
  });

export const useCreateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Applicant, 'id' | 'applicantCode' | 'createdAt' | 'updatedAt'>) =>
      applicantService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicantKeys.all }),
  });
};

export const useUpdateApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Applicant> }) =>
      applicantService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicantKeys.all }),
  });
};

export const useDeleteApplicant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicantService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicantKeys.all }),
  });
};
