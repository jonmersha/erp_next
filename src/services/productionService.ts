import { UserProfile } from '../types';
import { apiService } from './apiService';

export const createProductionRun = async (form: any, profile: UserProfile | null) => {
  return await apiService.post('production/runs', {
    ...form,
    quantity: Number(form.quantity),
    quantityProduced: 0,
    startDate: new Date(form.startDate).toISOString(),
    status: 'planned',
    companyId: profile?.companyId || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const updateProductionProgress = async (runId: string, quantityProduced: number, status: string) => {
  return await apiService.put(`production/runs/${runId}`, { 
    quantityProduced, 
    status,
    updatedAt: new Date().toISOString()
  });
};
