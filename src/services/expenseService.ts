import { apiService } from './apiService';
import { CostCenter, Budget, Expense } from '../types';

export const getCostCenters = (companyId: string): Promise<CostCenter[]> => {
  return apiService.get(`/expenses/cost-centers?companyId=${companyId}`);
};

export const createCostCenter = (data: Partial<CostCenter>): Promise<{ id: string }> => {
  return apiService.post('/expenses/cost-centers', data);
};

export const updateCostCenter = (id: string, data: Partial<CostCenter>): Promise<void> => {
  return apiService.put(`/expenses/cost-centers/${id}`, data);
};

export const getBudgets = (companyId: string, year?: number): Promise<Budget[]> => {
  return apiService.get(`/expenses/budgets?companyId=${companyId}${year ? `&year=${year}` : ''}`);
};

export const createBudget = (data: Partial<Budget>): Promise<{ id: string }> => {
  return apiService.post('/expenses/budgets', data);
};

export const updateBudget = (id: string, data: Partial<Budget>): Promise<void> => {
  return apiService.put(`/expenses/budgets/${id}`, data);
};

export const getExpenses = (companyId: string, costCenterId?: string): Promise<Expense[]> => {
  return apiService.get(`/expenses/expenses?companyId=${companyId}${costCenterId ? `&costCenterId=${costCenterId}` : ''}`);
};

export const createExpense = (data: Partial<Expense>): Promise<{ id: string }> => {
  return apiService.post('/expenses/expenses', data);
};

export const updateExpense = (id: string, data: Partial<Expense>): Promise<void> => {
  return apiService.put(`/expenses/expenses/${id}`, data);
};

export const approveExpense = (id: string, approverId: string): Promise<void> => {
  return apiService.post(`/expenses/expenses/${id}/approve`, { approverId });
};
