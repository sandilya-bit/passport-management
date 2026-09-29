import { api, unwrap } from '@/api/client';
import { isMockMode, mockListPassports, mockIssuePassport } from '@/api/mockApi';
import type { IssuedPassport, Page, PageRequest } from '@/types';

export const passportService = {
  list(params: PageRequest & { status?: IssuedPassport['status'] | '' }): Promise<Page<IssuedPassport>> {
    if (isMockMode) return mockListPassports(params);
    return unwrap(api.get('/passports', { params }));
  },
  byApplication(applicationId: string): Promise<IssuedPassport | null> {
    if (isMockMode) {
      return import('@/api/mockData').then((m) => m.issuedPassports.find((p) => p.applicationId === applicationId) ?? null);
    }
    return unwrap(api.get(`/passports/by-application/${applicationId}`));
  },
  issue(applicationId: string): Promise<IssuedPassport> {
    if (isMockMode) return mockIssuePassport(applicationId);
    return unwrap(api.post(`/passports/issue/${applicationId}`, {}));
  },
};
