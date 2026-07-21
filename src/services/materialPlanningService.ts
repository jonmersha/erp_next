import { apiService } from './apiService';

export const createProcurementPlan = async (data: any) => {
  return apiService.post('procurementPlans', data);
};

export const updateProcurementPlan = async (id: string, data: any) => {
  return apiService.put(`procurementPlans/${id}`, data);
};

export const approveProcurementPlan = async (id: string, approverId: string) => {
  return apiService.put(`procurementPlans/${id}/approve`, { approverId });
};

export const deleteProcurementPlan = async (id: string) => {
  return apiService.delete(`procurementPlans/${id}`);
};
