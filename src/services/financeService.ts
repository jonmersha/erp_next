import { Invoice, Payment, FinancialPlan } from '../types';
import { apiService } from './apiService';

export const getInvoices = async (companyId: string): Promise<Invoice[]> => {
  return await apiService.get(`finance/invoices?companyId=${companyId}`);
};

export const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
  return await apiService.post('finance/invoices', invoice);
};

export const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
  return await apiService.put(`finance/invoices/${id}`, invoice);
};

export const getPayments = async (companyId: string): Promise<Payment[]> => {
  return await apiService.get(`finance/payments?companyId=${companyId}`);
};

export const addPayment = async (payment: Omit<Payment, 'id'>) => {
  return await apiService.post('finance/payments', payment);
};

export const getFinancialPlans = async (companyId: string): Promise<FinancialPlan[]> => {
  return await apiService.get(`plans/financial?companyId=${companyId}`);
};

export const addFinancialPlan = async (plan: Omit<FinancialPlan, 'id'>) => {
  return await apiService.post('plans/financial', plan);
};

export const updateFinancialPlan = async (id: string, plan: Partial<FinancialPlan>) => {
  return await apiService.put(`plans/financial/${id}`, plan);
};
