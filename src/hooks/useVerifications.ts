import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { verificationService, type VerificationFilters } from '@/services/verificationService';
import type { VerificationType } from '@/types';

export const verificationKeys = {
  all: ['verifications'] as const,
  list: (filters: VerificationFilters) => ['verifications', 'list', filters] as const,
};

export const useVerifications = (filters: VerificationFilters) =>
  useQuery({
    queryKey: verificationKeys.list(filters),
    queryFn: () => verificationService.list(filters),
    placeholderData: (prev) => prev,
  });

export const useCreateVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { applicationId: string; verificationType: VerificationType }) =>
      verificationService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: verificationKeys.all }),
  });
};

export const useDecideVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: 'APPROVED' | 'REJECTED'; remarks: string } }) =>
      verificationService.decide(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: verificationKeys.all }),
  });
};
