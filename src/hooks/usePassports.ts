import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { passportService } from '@/services/passportService';
import type { IssuedPassport } from '@/types';

export const passportKeys = {
  all: ['passports'] as const,
  list: (filters: { page?: number; size?: number; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; status?: IssuedPassport['status'] | '' }) =>
    ['passports', 'list', filters] as const,
  byApplication: (id: string) => ['passports', 'by-application', id] as const,
};

export const usePassports = (
  filters: { page?: number; size?: number; search?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; status?: IssuedPassport['status'] | '' },
) =>
  useQuery({
    queryKey: passportKeys.list(filters),
    queryFn: () => passportService.list(filters),
    placeholderData: (prev) => prev,
  });

export const usePassportByApplication = (applicationId: string) =>
  useQuery({
    queryKey: passportKeys.byApplication(applicationId),
    queryFn: () => passportService.byApplication(applicationId),
    enabled: !!applicationId,
  });

export const useIssuePassport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) => passportService.issue(applicationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: passportKeys.all }),
  });
};
