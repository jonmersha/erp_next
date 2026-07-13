import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

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
        fetch(`/api/crm/customers?companyId=${company.id}`),
        fetch(`/api/crm/tickets?companyId=${company.id}`),
        fetch(`/api/crm/interactions?companyId=${company.id}`)
      ]);

      if (custRes.ok) setCustomers(await custRes.json());
      if (tickRes.ok) setTickets(await tickRes.json());
      if (intRes.ok) setInteractions(await intRes.json());
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
    const response = await fetch('/api/crm/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, companyId: company?.id })
    });
    if (!response.ok) throw new Error('Failed to create customer');
    await fetchCRMData();
  };

  const updateCustomer = async (id: string, data: Partial<Customer>) => {
    const response = await fetch(`/api/crm/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update customer');
    await fetchCRMData();
  };

  const deleteCustomer = async (id: string) => {
    const response = await fetch(`/api/crm/customers/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete customer');
    await fetchCRMData();
  };

  const createTicket = async (data: Partial<Ticket>) => {
    const response = await fetch('/api/crm/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, companyId: company?.id })
    });
    if (!response.ok) throw new Error('Failed to create ticket');
    await fetchCRMData();
  };

  const updateTicket = async (id: string, data: Partial<Ticket>) => {
    const response = await fetch(`/api/crm/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update ticket');
    await fetchCRMData();
  };

  const createInteraction = async (data: Partial<Interaction>) => {
    const response = await fetch('/api/crm/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, companyId: company?.id, userId: profile?.id })
    });
    if (!response.ok) throw new Error('Failed to create interaction');
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
