import { Supplier, PurchaseOrder, PurchaseOrderItem, UserProfile } from '../types';
import { apiService } from './apiService';

export const createPurchaseOrder = async (
  poForm: any, 
  suppliers: Supplier[], 
  profile: UserProfile | null
) => {
  const totalAmount = poForm.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const supplier = suppliers.find(s => s.id === poForm.supplierId);
  
  return await apiService.post('procurement/orders', {
    ...poForm,
    factoryId: poForm.factoryId || null,
    warehouseId: poForm.warehouseId || null,
    supplierName: supplier?.name || 'Unknown',
    totalAmount,
    createdBy: profile?.uid,
    createdAt: new Date(poForm.createdAt).toISOString(),
    companyId: profile?.companyId || ''
  });
};

export const updatePurchaseOrder = async (
  orderId: string, 
  poForm: any, 
  suppliers: Supplier[]
) => {
  const totalAmount = poForm.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const supplier = suppliers.find(s => s.id === poForm.supplierId);
  
  return await apiService.put(`procurement/orders/${orderId}`, {
    ...poForm,
    factoryId: poForm.factoryId || null,
    warehouseId: poForm.warehouseId || null,
    supplierName: supplier?.name || 'Unknown',
    totalAmount,
    createdAt: new Date(poForm.createdAt).toISOString()
  });
};

export const createSupplier = async (supplierForm: any, profile: UserProfile | null) => {
  return await apiService.post('procurement/suppliers', {
    ...supplierForm,
    createdBy: profile?.uid,
    companyId: profile?.companyId || ''
  });
};

export const updateSupplier = async (supplierId: string, supplierForm: any) => {
  return await apiService.put(`procurement/suppliers/${supplierId}`, supplierForm);
};

export const deleteSupplier = async (supplierId: string) => {
  return await apiService.delete(`procurement/suppliers/${supplierId}`);
};

export const updateOrderStatus = async (orderId: string, status: PurchaseOrder['status']) => {
  return await apiService.put(`procurement/orders/${orderId}`, { status });
};

export const approvePurchaseOrder = async (orderId: string, approverId: string) => {
  return await apiService.put(`procurement/orders/${orderId}/approve`, { approverId });
};

export const approveSupplier = async (supplierId: string, approverId: string) => {
  return await apiService.put(`procurement/suppliers/${supplierId}/approve`, { approverId });
};
