import { apiService } from './apiService';

export const fetchExecutiveReport = async () => {
  return apiService.get<any>('reports/executive');
};

export const fetchSalesReport = async () => {
  return apiService.get<any>('reports/sales');
};

export const fetchProductionReport = async () => {
  return apiService.get<any>('reports/production');
};

export const fetchInventoryReport = async () => {
  return apiService.get<any>('reports/inventory');
};

export const fetchHrReport = async () => {
  return apiService.get<any>('reports/hr');
};
