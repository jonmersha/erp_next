import { apiService } from './apiService';

export const fetchBatchTraceability = async (batchNumber: string, companyId: string) => {
  return apiService.get<any>(`inventory/traceability/${encodeURIComponent(batchNumber)}?companyId=${companyId}`);
};
