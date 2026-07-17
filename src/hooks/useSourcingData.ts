import { useState, useEffect, useCallback } from 'react';
import { fetchRFQs, fetchBids } from '../services/sourcingService';
import { useAuth } from '../context/AuthContext';

export const useSourcingData = () => {
  const { profile } = useAuth();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.companyId) return;
    try {
      setLoading(true);
      setError(null);
      const rfqsData = await fetchRFQs(profile.companyId);
      setRfqs(rfqsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load sourcing data');
    } finally {
      setLoading(false);
    }
  }, [profile?.companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadBidsForRFQ = async (rfqId: string) => {
    if (!profile?.companyId) return [];
    try {
      return await fetchBids(rfqId, profile.companyId);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      return [];
    }
  };

  return {
    rfqs,
    loading,
    error,
    refreshData: loadData,
    loadBidsForRFQ
  };
};
