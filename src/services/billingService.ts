import { apiService } from './apiService';
import { Invoice } from './apArService';

export interface SalesOrder {
  id: string;
  customerId: string;
  outletId: string;
  status: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  company_id: string;
  created_at: string;
}

export const getSalesOrders = async (companyId: string) => {
  return apiService.get<SalesOrder[]>(`salesOrders?companyId=${companyId}`);
};

export const getSalesInvoices = async (companyId: string) => {
  const allInvoices = await apiService.get<Invoice[]>(`finance/invoices?companyId=${companyId}`);
  return allInvoices.filter(inv => inv.orderType === 'sales');
};

export const generateInvoice = async (companyId: string, orderId: string, amount: number, dueDate: string) => {
  return apiService.post<Invoice>('finance/invoices', {
    companyId,
    orderId,
    orderType: 'sales',
    amount,
    dueDate,
    status: 'issued'
  });
};
