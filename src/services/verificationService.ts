import { api, unwrap } from '@/api/client';
import {
  isMockMode,
  mockListVerifications,
  mockCreateVerification,
  mockDecideVerification,
} from '@/api/mockApi';
import type { Page, PageRequest, Verification, VerificationType } from '@/types';

export interface VerificationFilters extends PageRequest {
  applicationId?: string;
  verificationType?: VerificationType | '';
  status?: Verification['status'] | '';
}

export const verificationService = {
  list(params: VerificationFilters): Promise<Page<Verification>> {
    if (isMockMode) return mockListVerifications(params);
    return unwrap(api.get('/verifications', { params }));
  },
  byId(id: string): Promise<Verification> {
    return unwrap(api.get(`/verifications/${id}`));
  },
  create(payload: { applicationId: string; verificationType: VerificationType }): Promise<Verification> {
    if (isMockMode) return mockCreateVerification(payload);
    return unwrap(api.post('/verifications', payload));
  },
  decide(id: string, payload: { status: 'APPROVED' | 'REJECTED'; remarks: string }): Promise<Verification> {
    if (isMockMode) return mockDecideVerification(id, payload);
    return unwrap(api.post(`/verifications/${id}/decision`, payload));
  },
};
