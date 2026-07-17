import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchExecutiveReport,
  fetchSalesReport,
  fetchProductionReport,
  fetchInventoryReport,
  fetchHrReport
} from '../services/reportsService';

export const useReportsData = (tab: string) => {
  const { profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        let result;
        switch (tab) {
          case 'executive':
            result = await fetchExecutiveReport();
            break;
          case 'sales':
            result = await fetchSalesReport();
            break;
          case 'production':
            result = await fetchProductionReport();
            break;
          case 'inventory':
            result = await fetchInventoryReport();
            break;
          case 'hr':
            result = await fetchHrReport();
            break;
          default:
            throw new Error('Unknown tab');
        }
        setData(result.data || result); // apiService might return { data: ... } or just data depending on backend
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error fetching report');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile, tab]);

  return { data, loading, error };
};
