import { api, unwrap } from '@/api/client';
import {
  isMockMode,
  mockListApplicants,
  mockCreateApplicant,
  mockUpdateApplicant,
  mockDeleteApplicant,
} from '@/api/mockApi';
import type { Applicant, Page, PageRequest } from '@/types';

export interface ApplicantFilters extends PageRequest {
  gender?: string;
}

export const applicantService = {
  list(params: ApplicantFilters): Promise<Page<Applicant>> {
    if (isMockMode) return mockListApplicants(params);
    return unwrap(api.get('/applicants', { params }));
  },
  byId(id: string): Promise<Applicant> {
    return unwrap(api.get(`/applicants/${id}`));
  },
  create(payload: Omit<Applicant, 'id' | 'applicantCode' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
    if (isMockMode) return mockCreateApplicant(payload);
    return unwrap(api.post('/applicants', payload));
  },
  update(id: string, payload: Partial<Applicant>): Promise<Applicant> {
    if (isMockMode) return mockUpdateApplicant(id, payload);
    return unwrap(api.put(`/applicants/${id}`, payload));
  },
  remove(id: string): Promise<void> {
    if (isMockMode) return mockDeleteApplicant(id);
    return unwrap(api.delete(`/applicants/${id}`));
  },
};
