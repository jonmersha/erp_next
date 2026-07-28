import { apiService } from './apiService';

export const getProductionRuns = async (companyId: string) => {
  return apiService.get<any[]>(`productionRuns?companyId=${companyId}`);
};

export const getConsumptionData = async (runId: string) => {
  return apiService.get<any>(`productionRuns/${runId}/consumption`);
};

export const recordConsumption = async (runId: string, inventoryId: string, quantity: number, notes?: string) => {
  return apiService.post<any>(`productionRuns/${runId}/consume`, {
    inventoryId,
    quantity,
    notes
  });
};
