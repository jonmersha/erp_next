import { useState, useEffect } from 'react';
import { Employee, Factory } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useHRData = () => {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const companyId = profile.companyId;
        const [employeesData, factoriesData] = await Promise.all([
          fetchCollection('employees', companyId, { orderByField: 'name', orderDir: 'asc' }),
          fetchCollection('factories', companyId)
        ]);

        if (Array.isArray(employeesData)) setEmployees(employeesData as any);
        if (Array.isArray(factoriesData)) setFactories(factoriesData as any);
      } catch (error) {
        console.error("Error fetching HR data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  return {
    employees,
    factories,
    loading
  };
};
