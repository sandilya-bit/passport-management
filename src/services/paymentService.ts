import { api, unwrap } from '@/api/client';
import { isMockMode, mockListPayments, mockPayFee } from '@/api/mockApi';
import type { Page, PageRequest, Payment } from '@/types';

export interface PaymentFilters extends PageRequest {
  applicationId?: string;
  paymentStatus?: Payment['paymentStatus'] | '';
}

export const paymentService = {
  list(params: PaymentFilters): Promise<Page<Payment>> {
    if (isMockMode) return mockListPayments(params);
    return unwrap(api.get('/payments', { params }));
  },
  pay(payload: { applicationId: string; amount: number; method: Payment['method'] }): Promise<Payment> {
    if (isMockMode) return mockPayFee(payload);
    return unwrap(api.post('/payments', payload));
  },
  async receipt(payment: Payment): Promise<void> {
    const { downloadBlob } = await import('@/utils/format');
    if (isMockMode) {
      const html = `<!doctype html><html><body style="font-family:Inter,Arial;padding:40px">
        <h2>Payment Receipt</h2>
        <p>Receipt No: <b>${payment.receiptNo}</b></p>
        <p>Application: ${payment.applicationId}</p>
        <p>Amount: INR ${payment.amount}</p>
        <p>Status: ${payment.paymentStatus}</p>
        <p>Date: ${new Date(payment.paymentDate).toLocaleString()}</p>
      </body></html>`;
      downloadBlob(new Blob([html], { type: 'text/html' }), `${payment.receiptNo}.html`);
      return;
    }
    const res = await api.get(`/payments/${payment.id}/receipt`, { responseType: 'blob' });
    downloadBlob(res.data as Blob, `${payment.receiptNo}.pdf`);
  },
};
