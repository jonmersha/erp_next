import { apiService, FetchOptions } from '../services/apiService';

export const fetchCollection = async <T = any>(
  collectionName: string, 
  companyId: string, 
  options?: FetchOptions
): Promise<T[]> => {
  return apiService.fetchCollection<T>(collectionName, companyId, options);
};
