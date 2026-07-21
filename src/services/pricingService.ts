import { apiService } from './apiService';

export interface PricingRule {
  id: string;
  company_id: string;
  rule_name: string;
  product_id: string | null;
  condition_type: 'quantity_above' | 'customer_tier' | 'season';
  condition_value: string;
  adjustment_type: 'percentage' | 'fixed_amount';
  adjustment_value: number;
  active: number;
  created_at: string;
}

export interface SimulationResult {
  basePrice: number;
  finalPrice: number;
  appliedRules: string[];
}

export const getPricingRules = async (companyId: string) => {
  return apiService.get<PricingRule[]>(`pricing/rules?companyId=${companyId}`);
};

export const getProducts = async (companyId: string) => {
  return apiService.get<any[]>(`products?companyId=${companyId}`);
};

export const createPricingRule = async (payload: Partial<PricingRule>) => {
  return apiService.post<any>('pricing/rules', payload);
};

export const deletePricingRule = async (id: string) => {
  return apiService.delete<any>(`pricing/rules/${id}`);
};

export const simulatePrice = async (payload: { companyId: string, productId: string, quantity: number }) => {
  return apiService.post<SimulationResult>('pricing/simulate', payload);
};
