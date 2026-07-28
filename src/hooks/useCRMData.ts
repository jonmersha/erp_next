import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  company_id: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  customer_id: string;
  type: 'feedback' | 'complaint' | 'inquiry';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_notes: string | null;
  company_id: string;
  created_at: string;
}

export interface Interaction {
  id: string;
  customer_id: string;
  interaction_type: 'sales' | 'support' | 'delivery' | 'general';
  notes: string;
  interaction_date: string;
  user_id: string | null;
  company_id: string;
  created_at: string;
}

export const useCRMData = () => {
  const { profile, company } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCRMData = useCallback(async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const [custRes, tickRes, intRes] = await Promise.all([
        apiService.get<Customer[]>(`/crm/customers?companyId=${company.id}`).catch(() => []),
        apiService.get<Ticket[]>(`/crm/tickets?companyId=${company.id}`).catch(() => []),
        apiService.get<Interaction[]>(`/crm/interactions?companyId=${company.id}`).catch(() => [])
      ]);

      setCustomers(custRes);
      setTickets(tickRes);
      setInteractions(intRes);
    } catch (error) {
      console.error('Error fetching CRM data:', error);
    } finally {
      setLoading(false);
    }
  }, [company?.id]);

  useEffect(() => {
    fetchCRMData();
  }, [fetchCRMData]);

  // Mutations
  const createCustomer = async (data: Partial<Customer>) => {
    await apiService.post('/crm/customers', { ...data, companyId: company?.id });
    await fetchCRMData();
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    await apiService.put(`/crm/customers/${id}`, data);
    await fetchCRMData();
  };

  const deleteCustomer = async (id: string) => {
    await apiService.delete(`/crm/customers/${id}`);
    await fetchCRMData();
  };

  const createTicket = async (data: Partial<Ticket>) => {
    await apiService.post('/crm/tickets', { ...data, companyId: company?.id });
    await fetchCRMData();
  };

  const updateTicket = async (id: string, data: Partial<Ticket>) => {
    await apiService.put(`/crm/tickets/${id}`, data);
    await fetchCRMData();
  };

  const createInteraction = async (data: Partial<Interaction>) => {
    await apiService.post('/crm/interactions', { ...data, companyId: company?.id, userId: profile?.id });
    await fetchCRMData();
  };

  return {
    customers,
    tickets,
    interactions,
    loading,
    refreshData: fetchCRMData,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createTicket,
    updateTicket,
    createInteraction
  };
};
