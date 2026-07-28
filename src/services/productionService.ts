import { UserProfile } from '../types';
import { apiService } from './apiService';

export const createProductionRun = async (form: any, profile: UserProfile | null) => {
  const isImmediate = form.status === 'in_progress';
  return await apiService.post('production/runs', {
    ...form,
    quantity: Number(form.quantity),
    quantityProduced: 0,
    startDate: isImmediate ? new Date().toISOString() : new Date(form.startDate).toISOString(),
    status: form.status,
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
