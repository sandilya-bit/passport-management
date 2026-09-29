import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentService, type PaymentFilters } from '@/services/paymentService';
import type { Payment } from '@/types';

export const paymentKeys = {
  all: ['payments'] as const,
  list: (filters: PaymentFilters) => ['payments', 'list', filters] as const,
};

export const usePayments = (filters: PaymentFilters) =>
  useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentService.list(filters),
    placeholderData: (prev) => prev,
  });

export const usePayFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { applicationId: string; amount: number; method: Payment['method'] }) =>
      paymentService.pay(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
};
