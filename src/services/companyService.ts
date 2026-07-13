import { Company } from '../types';
import { apiService } from './apiService';

export const getCompany = async (id: string): Promise<Company> => {
  return await apiService.get(`companies/${id}`);
};

export const updateCompany = async (id: string, data: Partial<Company>) => {
  return await apiService.put(`companies/${id}`, data);
};
