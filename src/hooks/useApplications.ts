import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationService, type ApplicationFilters } from '@/services/applicationService';
import type { ApplicationType, PassportApplication } from '@/types';

export const applicationKeys = {
  all: ['applications'] as const,
  list: (filters: ApplicationFilters) => ['applications', 'list', filters] as const,
  mine: (userId: string, filters: ApplicationFilters) => ['applications', 'mine', userId, filters] as const,
  detail: (id: string) => ['applications', 'detail', id] as const,
};

export const useApplications = (filters: ApplicationFilters) =>
  useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => applicationService.list(filters),
    placeholderData: (prev) => prev,
  });

export const useMyApplications = (userId: string, filters: ApplicationFilters) =>
  useQuery({
    queryKey: applicationKeys.mine(userId, filters),
    queryFn: () => applicationService.my(userId, filters),
    enabled: !!userId,
    placeholderData: (prev) => prev,
  });

export const useCreateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { applicantId: string; applicationType: ApplicationType; placeOfIssue: string }) =>
      applicationService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicationKeys.all }),
  });
};

export const useUpdateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PassportApplication> }) =>
      applicationService.update(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(vars.id) });
    },
  });
};

export const useDeleteApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: applicationKeys.all }),
  });
};
