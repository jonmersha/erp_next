import { apiService } from './apiService';

export interface QualityCheck {
  id: string;
  referenceId: string;
  referenceType: 'production_run' | 'grn' | 'inventory';
  itemId: string;
  inspectorId: string;
  checkDate: string;
  status: 'passed' | 'failed' | 'pending' | 'quarantined';
  notes: string;
  companyId: string;
  createdAt: string;
}

export interface QualityInspection {
  id: string;
  weighbridgeLogId: string;
  moisture: number;
  protein: number;
  ash: number;
  gluten: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  inspectorId: string;
  notes: string;
  companyId: string;
  createdAt: string;
}

export const getQualityChecks = async (companyId: string) => {
  return apiService.get<QualityCheck[]>(`quality?companyId=${companyId}`);
};

export const createQualityCheck = async (payload: Partial<QualityCheck>) => {
  return apiService.post<any>('quality', payload);
};

export const getQualityInspections = async (companyId: string) => {
  return apiService.get<QualityInspection[]>(`qualityInspections?companyId=${companyId}`);
};

export const createQualityInspection = async (payload: Partial<QualityInspection>) => {
  return apiService.post<any>('qualityInspections', payload);
};
