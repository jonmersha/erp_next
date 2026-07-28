import { apiService } from './apiService';

export interface Invoice {
  id: string;
  companyId: string;
  orderId: string;
  orderType: 'purchase' | 'sales';
  amount: number;
  dueDate: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
}

export const getInvoices = async (companyId: string) => {
  return apiService.get<Invoice[]>(`finance/invoices?companyId=${companyId}`);
};

export const createInvoice = async (companyId: string, payload: Partial<Invoice>) => {
  return apiService.post<Invoice>('finance/invoices', { companyId, ...payload });
};

export const updateInvoiceStatus = async (invoiceId: string, status: string, amount: number, dueDate: string) => {
  return apiService.put<any>(`finance/invoices/${invoiceId}`, { status, amount, dueDate });
};

export const recordPayment = async (companyId: string, payload: Partial<Payment>) => {
  return apiService.post<Payment>('finance/payments', { companyId, ...payload });
};
