import { apiService } from './apiService';
import { QualityCheck } from './labService';

export interface QualityChecklist {
  id: string;
  name: string;
  category: 'production' | 'receiving' | 'inventory';
  items: any[];
  companyId: string;
  createdAt?: string;
}

export interface NonConformanceReport {
  id: string;
  qualityCheckId: string;
  issueDescription: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved';
  rcaDetails?: string;
  capaDetails?: string;
  disposition?: 'pending' | 'quarantine' | 'rework' | 'disposal' | 'accept_as_is' | 'return_to_vendor';
  resolutionNotes?: string;
  companyId: string;
  createdBy: string;
  resolvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getQualityChecklists = async (companyId: string) => {
  return apiService.get<QualityChecklist[]>(`quality/checklists?companyId=${companyId}`);
};

export const createQualityChecklist = async (payload: Partial<QualityChecklist>) => {
  return apiService.post<any>('quality/checklists', payload);
};

export const updateQualityChecklist = async (id: string, payload: Partial<QualityChecklist>) => {
  return apiService.put<any>(`quality/checklists/${id}`, payload);
};

export const deleteQualityChecklist = async (id: string) => {
  return apiService.delete<any>(`quality/checklists/${id}`);
};

export const getNCRs = async (companyId: string) => {
  return apiService.get<NonConformanceReport[]>(`quality/ncrs?companyId=${companyId}`);
};

export const updateNCR = async (id: string, payload: Partial<NonConformanceReport>) => {
  return apiService.put<any>(`quality/ncrs/${id}`, payload);
};

export const createInspection = async (payload: Partial<QualityCheck>) => {
  return apiService.post<any>('quality', payload);
};

export const updateInspection = async (id: string, payload: Partial<QualityCheck>) => {
  return apiService.put<any>(`quality/${id}`, payload);
};
