import { api, unwrap } from '@/api/client';
import {
  isMockMode,
  mockListApplications,
  mockListMyApplications,
  mockCreateApplication,
  mockUpdateApplication,
  mockDeleteApplication,
} from '@/api/mockApi';
import type { ApplicationStatus, ApplicationType, Page, PageRequest, PassportApplication } from '@/types';

export interface ApplicationFilters extends PageRequest {
  status?: ApplicationStatus | '';
  applicationType?: ApplicationType | '';
}

export const applicationService = {
  list(params: ApplicationFilters): Promise<Page<PassportApplication>> {
    if (isMockMode) return mockListApplications(params);
    return unwrap(api.get('/applications', { params }));
  },
  my(userId: string, params: ApplicationFilters): Promise<Page<PassportApplication>> {
    if (isMockMode) return mockListMyApplications(userId, params);
    return unwrap(api.get('/applications/my', { params }));
  },
  byId(id: string): Promise<PassportApplication> {
    return unwrap(api.get(`/applications/${id}`));
  },
  create(payload: { applicantId: string; applicationType: ApplicationType; placeOfIssue: string }): Promise<PassportApplication> {
    if (isMockMode) return mockCreateApplication(payload);
    return unwrap(api.post('/applications', payload));
  },
  update(id: string, payload: Partial<PassportApplication>): Promise<PassportApplication> {
    if (isMockMode) return mockUpdateApplication(id, payload);
    return unwrap(api.put(`/applications/${id}`, payload));
  },
  remove(id: string): Promise<void> {
    if (isMockMode) return mockDeleteApplication(id);
    return unwrap(api.delete(`/applications/${id}`));
  },
};
