import { UserProfile } from '../types';
import { apiService } from './apiService';

export const createEmployee = async (form: any, profile: UserProfile | null) => {
  return await apiService.post('employees', {
    ...form,
    salary: Number(form.salary),
    hireDate: new Date(form.hireDate).toISOString(),
    departmentId: form.departmentId || null,
    managerId: form.managerId || null,
    companyId: profile?.companyId || ''
  });
};

export const updateEmployee = async (id: string, form: any, profile: UserProfile | null) => {
  return await apiService.updateDocument('employees', id, {
    ...form,
    salary: Number(form.salary),
    hireDate: new Date(form.hireDate).toISOString(),
    departmentId: form.departmentId || null,
    managerId: form.managerId || null,
    companyId: profile?.companyId || ''
  });
};

export const createDepartment = async (form: any, profile: UserProfile | null) => {
  return await apiService.post('departments', {
    ...form,
    companyId: profile?.companyId || ''
  });
};

export const updateDepartment = async (id: string, form: any, profile: UserProfile | null) => {
  return await apiService.updateDocument('departments', id, {
    ...form,
    companyId: profile?.companyId || ''
  });
};

export const deleteDepartment = async (id: string) => {
  return await apiService.deleteDocument('departments', id);
};

export const fetchAttendance = async () => {
  return await apiService.fetchCollection('attendance');
};

export const logAttendance = async (data: any) => {
  return await apiService.post('attendance', data);
};

export const fetchLeaves = async () => {
  return await apiService.fetchCollection('leaves');
};

export const applyLeave = async (data: any) => {
  return await apiService.post('leaves', data);
};

export const updateLeaveStatus = async (id: string, status: string) => {
  return await apiService.put(`leaves/${id}/status`, { status });
};

