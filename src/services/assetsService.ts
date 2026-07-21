import { apiService } from './apiService';

export interface FixedAsset {
  id: string;
  companyId: string;
  assetName: string;
  assetType: 'machinery' | 'vehicle' | 'building' | 'furniture' | 'electronics' | 'other';
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'straight_line' | 'declining_balance';
  status: 'active' | 'sold' | 'scrapped' | 'maintenance';
  createdAt: string;
}

export const getAssets = async (companyId: string) => {
  return apiService.get<FixedAsset[]>(`assets?companyId=${companyId}`);
};

export const createAsset = async (payload: Partial<FixedAsset>) => {
  return apiService.post<any>('assets', payload);
};

export const updateAssetStatus = async (id: string, status: string) => {
  return apiService.put<any>(`assets/${id}/status`, { status });
};
