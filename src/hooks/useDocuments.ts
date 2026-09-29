import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentService, type DocumentFilters } from '@/services/documentService';
import type { DocumentType, VerificationStatus } from '@/types';

export const documentKeys = {
  all: ['documents'] as const,
  list: (filters: DocumentFilters) => ['documents', 'list', filters] as const,
};

export const useDocuments = (filters: DocumentFilters) =>
  useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => documentService.list(filters),
    placeholderData: (prev) => prev,
  });

export const useUploadDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { applicationId: string; documentType: DocumentType; file: File }) =>
      documentService.upload(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
};

export const useSetDocumentVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VerificationStatus }) =>
      documentService.setVerification(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
};
