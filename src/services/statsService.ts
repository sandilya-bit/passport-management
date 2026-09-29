import { isMockMode, mockGetAdminStats, mockGetApplicantStats } from '@/api/mockApi';
import { api, unwrap } from '@/api/client';
import type { AdminStats, ApplicantStats } from '@/types';

export const statsService = {
  admin(): Promise<AdminStats> {
    if (isMockMode) return mockGetAdminStats();
    return unwrap(api.get<AdminStats>('/stats/admin'));
  },
  applicant(userId: string): Promise<ApplicantStats> {
    if (isMockMode) return mockGetApplicantStats(userId);
    return unwrap(api.get<ApplicantStats>(`/stats/applicant/${userId}`));
  },
};
