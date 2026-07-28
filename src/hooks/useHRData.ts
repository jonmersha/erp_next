import { useState, useEffect } from 'react';
import { Employee, Factory, Department } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useHRData = () => {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const companyId = profile.companyId;
        const [employeesData, factoriesData, departmentsData, attendanceData, leavesData] = await Promise.all([
          fetchCollection('employees', companyId, { orderByField: 'name', orderDir: 'asc' }),
          fetchCollection('factories', companyId),
          fetchCollection('departments', companyId),
          fetchCollection('attendance', companyId),
          fetchCollection('leaves', companyId)
        ]);

        if (Array.isArray(employeesData)) setEmployees(employeesData as any);
        if (Array.isArray(factoriesData)) setFactories(factoriesData as any);
        if (Array.isArray(departmentsData)) setDepartments(departmentsData as any);
        if (Array.isArray(attendanceData)) setAttendance(attendanceData as any);
        if (Array.isArray(leavesData)) setLeaves(leavesData as any);
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
    departments,
    attendance,
    leaves,
    loading
  };
};
