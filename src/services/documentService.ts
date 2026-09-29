import { api, unwrap } from '@/api/client';
import {
  isMockMode,
  mockListDocuments,
  mockUploadDocument,
  mockDeleteDocument,
  mockSetDocumentVerification,
} from '@/api/mockApi';
import type { DocumentFile, DocumentType, Page, PageRequest, VerificationStatus } from '@/types';

export interface DocumentFilters extends PageRequest {
  applicationId?: string;
  documentType?: DocumentType | '';
  verificationStatus?: VerificationStatus | '';
}

export const documentService = {
  list(params: DocumentFilters): Promise<Page<DocumentFile>> {
    if (isMockMode) return mockListDocuments(params);
    return unwrap(api.get('/documents', { params }));
  },
  async upload(payload: { applicationId: string; documentType: DocumentType; file: File }): Promise<DocumentFile> {
    if (isMockMode) return mockUploadDocument(payload);
    const form = new FormData();
    form.append('file', payload.file);
    return unwrap(
      api.post(`/documents?applicationId=${payload.applicationId}&documentType=${payload.documentType}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
  previewUrl(id: string): string {
    return `${api.defaults.baseURL}/documents/${id}/preview`;
  },
  async download(id: string, fileName: string): Promise<void> {
    if (isMockMode) {
      const { downloadBlob } = await import('@/utils/format');
      downloadBlob(new Blob(['Simulated document content'], { type: 'application/pdf' }), fileName.replace(/\.[^.]+$/, '') + '.pdf');
      return;
    }
    const res = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    const { downloadBlob } = await import('@/utils/format');
    downloadBlob(res.data as Blob, fileName);
  },
  remove(id: string): Promise<void> {
    if (isMockMode) return mockDeleteDocument(id);
    return unwrap(api.delete(`/documents/${id}`));
  },
  setVerification(id: string, status: VerificationStatus): Promise<DocumentFile> {
    if (isMockMode) return mockSetDocumentVerification(id, status);
    return unwrap(api.patch(`/documents/${id}/verification`, { status }));
  },
};
