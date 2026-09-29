import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';

export const statsKeys = {
  admin: ['stats', 'admin'] as const,
  applicant: (userId: string) => ['stats', 'applicant', userId] as const,
};

export const useAdminStats = () =>
  useQuery({ queryKey: statsKeys.admin, queryFn: () => statsService.admin() });

export const useApplicantStats = (userId: string) =>
  useQuery({
    queryKey: statsKeys.applicant(userId),
    queryFn: () => statsService.applicant(userId),
    enabled: !!userId,
  });
