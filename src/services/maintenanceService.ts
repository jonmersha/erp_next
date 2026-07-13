import { MaintenanceLog } from '../types';
import { apiService } from './apiService';

export const getMaintenanceLogs = async (companyId: string): Promise<MaintenanceLog[]> => {
  return await apiService.get(`maintenance/logs?companyId=${companyId}`);
};

export const addMaintenanceLog = async (log: Omit<MaintenanceLog, 'id'>) => {
  return await apiService.post('maintenance/logs', log);
};

export const updateMaintenanceLog = async (id: string, log: Partial<MaintenanceLog>) => {
  return await apiService.put(`maintenance/logs/${id}`, log);
};

export const deleteMaintenanceLog = async (id: string) => {
  return await apiService.delete(`maintenance/logs/${id}`);
};
