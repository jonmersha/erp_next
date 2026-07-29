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
    // Normalize empty strings to null for numeric fields
    moisture: qiForm.moisture !== '' ? qiForm.moisture : null,
    protein:  qiForm.protein  !== '' ? qiForm.protein  : null,
    ash:      qiForm.ash      !== '' ? qiForm.ash      : null,
    gluten:   qiForm.gluten   !== '' ? qiForm.gluten   : null,
    inspector_id: profile?.uid,
    company_id: profile?.companyId || ''
  });
};

export const updateQualityInspection = async (id: string, qiForm: any) => {
  return await apiService.put(`qualityInspections/${id}`, {
    ...qiForm,
    moisture: qiForm.moisture !== '' ? qiForm.moisture : null,
    protein:  qiForm.protein  !== '' ? qiForm.protein  : null,
    ash:      qiForm.ash      !== '' ? qiForm.ash      : null,
    gluten:   qiForm.gluten   !== '' ? qiForm.gluten   : null,
  });
};

export const createGoodsReceiptNote = async (grnForm: any, profile: UserProfile | null) => {
  return await apiService.post('grns', {
    ...grnForm,
    userId: profile?.uid,
    company_id: profile?.companyId || ''
  });
};

export const createFinanceInvoice = async (invoiceData: any, profile: UserProfile | null) => {
  return await apiService.post('finance/invoices', {
    ...invoiceData,
    companyId: profile?.companyId || ''
  });
};
