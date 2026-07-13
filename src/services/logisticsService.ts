import { Shipment } from '../types';
import { apiService } from './apiService';

export const getShipments = async (companyId: string): Promise<Shipment[]> => {
  return await apiService.get(`logistics/shipments?companyId=${companyId}`);
};

export const addShipment = async (shipment: Omit<Shipment, 'id'>) => {
  return await apiService.post('logistics/shipments', shipment);
};

export const updateShipment = async (id: string, shipment: Partial<Shipment>) => {
  return await apiService.put(`logistics/shipments/${id}`, shipment);
};

export const deleteShipment = async (id: string) => {
  return await apiService.delete(`logistics/shipments/${id}`);
};
