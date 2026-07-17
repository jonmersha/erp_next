import { apiService } from './apiService';
import { UserProfile } from '../types';

export const createWeighbridgeLog = async (logForm: any, profile: UserProfile | null) => {
  return await apiService.post('weighbridge', {
    ...logForm,
    company_id: profile?.companyId || ''
  });
};

export const updateWeighbridgeLogOut = async (id: string, logForm: any) => {
  return await apiService.put(`weighbridge/${id}/out`, logForm);
};

export const createQualityInspection = async (qiForm: any, profile: UserProfile | null) => {
  return await apiService.post('qualityInspections', {
    ...qiForm,
    inspector_id: profile?.uid,
    company_id: profile?.companyId || ''
  });
};

export const createGoodsReceiptNote = async (grnForm: any, profile: UserProfile | null) => {
  return await apiService.post('grns', {
    ...grnForm,
    userId: profile?.uid,
    company_id: profile?.companyId || ''
  });
};
