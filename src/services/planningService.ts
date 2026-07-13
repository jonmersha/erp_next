import { ProductionPlan, ProcurementPlan, SalesPlan } from '../types';
import { apiService } from './apiService';

export const getProductionPlans = async (companyId: string) => {
  return await apiService.get<ProductionPlan[]>(`production/plans?companyId=${companyId}`);
};
export const getProcurementPlans = async (companyId: string) => {
  return await apiService.get<ProcurementPlan[]>(`procurement/plans?companyId=${companyId}`);
};
export const getSalesPlans = async (companyId: string) => {
  return await apiService.get<SalesPlan[]>(`sales/plans?companyId=${companyId}`);
};

export const addProductionPlan = async (plan: Omit<ProductionPlan, 'id'>) => {
  return await apiService.post('production/plans', { ...plan, createdAt: new Date().toISOString() });
};

export const updateProductionPlan = async (id: string, plan: Partial<ProductionPlan>) => {
  return await apiService.put(`production/plans/${id}`, plan);
};

export const deleteProductionPlan = async (id: string) => {
  return await apiService.delete(`production/plans/${id}`);
};

export const addProcurementPlan = async (plan: Omit<ProcurementPlan, 'id'>) => {
  return await apiService.post('procurement/plans', { ...plan, createdAt: new Date().toISOString() });
};

export const updateProcurementPlan = async (id: string, plan: Partial<ProcurementPlan>) => {
  return await apiService.put(`procurement/plans/${id}`, plan);
};

export const deleteProcurementPlan = async (id: string) => {
  return await apiService.delete(`procurement/plans/${id}`);
};

export const addSalesPlan = async (plan: Omit<SalesPlan, 'id'>) => {
  return await apiService.post('sales/plans', { ...plan, createdAt: new Date().toISOString() });
};

export const updateSalesPlan = async (id: string, plan: Partial<SalesPlan>) => {
  return await apiService.put(`sales/plans/${id}`, plan);
};

export const deleteSalesPlan = async (id: string) => {
  return await apiService.delete(`sales/plans/${id}`);
};
