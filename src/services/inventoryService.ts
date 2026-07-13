import { PurchaseOrder, SalesOrder, UserProfile } from '../types';
import { apiService } from './apiService';

export const receivePurchaseOrder = async (
  selectedPO: PurchaseOrder, 
  warehouseId: string, 
  notes: string, 
  profile: UserProfile | null
) => {
  return await apiService.post('inventory/receive-po', { selectedPO, warehouseId, notes, profile });
};

export const transferProductionToWarehouse = async (
  productId: string,
  quantity: number,
  warehouseId: string,
  profile: UserProfile | null
) => {
  return await apiService.post('inventory/transfer-production', { productId, quantity, warehouseId, profile });
};

export const shipSalesOrder = async (
  selectedSO: SalesOrder, 
  warehouseId: string, 
  notes: string, 
  profile: UserProfile | null
) => {
  return await apiService.post('inventory/ship-order', { selectedSO, warehouseId, notes, profile });
};
