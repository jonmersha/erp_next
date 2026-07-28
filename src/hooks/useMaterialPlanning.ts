import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

export const useMaterialPlanning = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!profile?.companyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get<any[]>(`procurementPlans?companyId=${profile.companyId}`);
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch material plans');
    } finally {
      setLoading(false);
    }
  }, [profile?.companyId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refreshData: fetchPlans
  };
};
