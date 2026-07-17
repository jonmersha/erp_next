import { apiService } from './apiService';
import { Vehicle, VehicleRequest, FleetConsumption } from '../types';

export const getVehicles = (companyId: string): Promise<Vehicle[]> => {
  return apiService.get(`/fleet/vehicles?companyId=${companyId}`);
};

export const createVehicle = (data: Partial<Vehicle>): Promise<{ id: string }> => {
  return apiService.post('/fleet/vehicles', data);
};

export const updateVehicle = (id: string, data: Partial<Vehicle>): Promise<void> => {
  return apiService.put(`/fleet/vehicles/${id}`, data);
};

export const getVehicleRequests = (companyId: string): Promise<VehicleRequest[]> => {
  return apiService.get(`/fleet/requests?companyId=${companyId}`);
};

export const createVehicleRequest = (data: Partial<VehicleRequest>): Promise<{ id: string }> => {
  return apiService.post('/fleet/requests', data);
};

export const updateVehicleRequest = (id: string, data: Partial<VehicleRequest>): Promise<void> => {
  return apiService.put(`/fleet/requests/${id}`, data);
};

export const approveVehicleRequest = (id: string, approverId: string, vehicleId: string): Promise<void> => {
  return apiService.post(`/fleet/requests/${id}/approve`, { approverId, vehicleId });
};

export const rejectVehicleRequest = (id: string, approverId: string): Promise<void> => {
  return apiService.post(`/fleet/requests/${id}/reject`, { approverId });
};

export const getFleetConsumptions = (companyId: string, vehicleId?: string): Promise<FleetConsumption[]> => {
  return apiService.get(`/fleet/consumptions?companyId=${companyId}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`);
};

export const createFleetConsumption = (data: Partial<FleetConsumption>): Promise<{ id: string }> => {
  return apiService.post('/fleet/consumptions', data);
};

export const updateFleetConsumption = (id: string, data: Partial<FleetConsumption>): Promise<void> => {
  return apiService.put(`/fleet/consumptions/${id}`, data);
};
