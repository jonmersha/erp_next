import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useHRData } from '../hooks/useHRData';
import { createEmployee, updateEmployee, createDepartment, updateDepartment, deleteDepartment, logAttendance, applyLeave, updateLeaveStatus } from '../services/hrService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Users, UserPlus, Search, Briefcase, Mail, DollarSign, Loader2, XCircle, Edit2, Network, FolderTree, Plus, ZoomIn, ZoomOut, Maximize, LayoutGrid, List, Clock, CalendarRange, Check, X } from 'lucide-react';
import Modal from '../components/Modal';
import StatsCard from '../components/common/StatsCard';

const EmployeeTableRow = ({ emp, setEditingEmployee, setForm, setIsModalOpen }: any) => (
  <tr className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
    <td className="p-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg flex items-center justify-center font-bold">
          {emp.name?.[0] || '?'}
        </div>
        <div>
          <p className="font-bold text-[var(--color-main)]">{emp.name}</p>
          <p className="text-xs text-[var(--color-text)]/60">{emp.email}</p>
        </div>
      </div>
    </td>
    <td className="p-4 font-medium">{emp.role || '-'}</td>
    <td className="p-4 text-[var(--color-text)]/80">{emp.departmentName || <span className="opacity-40 italic">None</span>}</td>
    <td className="p-4 text-[var(--color-text)]/80">{emp.managerName || <span className="opacity-40 italic">None</span>}</td>
    <td className="p-4 text-[var(--color-text)]/80">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '-'}</td>
    <td className="p-4 font-semibold text-[var(--color-main)]">${Number(emp.salary || 0).toLocaleString()}</td>
    <td className="p-4 text-right">
      <button 
        onClick={() => {
          setEditingEmployee(emp.id!);
          setForm({
            name: emp.name, role: emp.role, departmentId: emp.departmentId || '', managerId: emp.managerId || '', email: emp.email,
            salary: Number(emp.salary) || 0, hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            factoryId: emp.factoryId || ''
          });
          setIsModalOpen(true);
        }}
        className="p-1.5 text-[var(--color-main)] bg-[var(--color-main)]/10 hover:bg-[var(--color-main)]/20 rounded-lg transition-colors inline-block"
      >
        <Edit2 size={16} />
      </button>
    </td>
  </tr>
);

const HR: React.FC = () => {
  const { profile } = useAuth();
  const { employees, factories, departments, attendance, leaves, loading } = useHRData();
  const [activeTab, setActiveTab] = useState<'directory' | 'departments' | 'orgChart' | 'attendance' | 'leaves'>('directory');
  const [directoryView, setDirectoryView] = useState<'cards' | 'table'>('table');
  const [groupBy, setGroupBy] = useState<'none' | 'department' | 'role'>('none');
  const [scale, setScale] = useState(1);
  const orgContainerRef = useRef<HTMLDivElement>(null);
  const orgTreeRef = useRef<HTMLDivElement>(null);

  const fitToScreen = () => {
    if (orgContainerRef.current && orgTreeRef.current) {
      const containerWidth = orgContainerRef.current.clientWidth - 64; // padding
      const treeWidth = orgTreeRef.current.scrollWidth;
      if (treeWidth > containerWidth && treeWidth > 0) {
        setScale(containerWidth / treeWidth);
      } else {
        setScale(1);
      }
    }
  };

  useLayoutEffect(() => {
    if (activeTab === 'orgChart') {
      setTimeout(fitToScreen, 100);
    }
  }, [activeTab, departments]);
  
  const [search, setSearch] = useState('');
  
  // Employee Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    role: '',
    departmentId: '',
    managerId: '',
    email: '',
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
    factoryId: ''
  });

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    parentDepartmentId: '',
    managerId: ''
  });

  // Attendance State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: '',
    status: 'present'
  });

  // Leave State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    type: 'annual',
    reason: ''
  });

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee, form, profile);
      } else {
        await createEmployee(form, profile);
      }
      setIsModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingDept) {
        await updateDepartment(editingDept, deptForm, profile);
      } else {
        await createDepartment(deptForm, profile);
      }
      setIsDeptModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to save department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await logAttendance(attendanceForm);
      setIsAttendanceModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to log attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await applyLeave(leaveForm);
      setIsLeaveModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveStatus = async (id: string, status: string) => {
    try {
      await updateLeaveStatus(id, status);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update leave status");
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (emp.role?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (emp.departmentName?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salary || 0), 0);

  // Org Chart Hierarchy Builder
  const buildOrgChart = (parentId: string | null = null) => {
    const children = departments.filter(d => (parentId === null ? !d.parentDepartmentId : d.parentDepartmentId === parentId));
    if (children.length === 0) return null;

    return (
      <ul>
        {children.map(dept => (
          <li key={dept.id} className="group">
            <div className="org-node bg-white p-4 rounded-xl shadow-md border-2 border-blue-600/30 w-48 relative z-10 mx-auto text-center transition-all hover:border-blue-600/60 group">
              <h4 className="font-bold text-gray-900 text-sm leading-tight">
                {dept.name}
              </h4>
              <p className="text-[11px] text-blue-700 mt-1.5 font-bold uppercase tracking-wider">
                {dept.managerName || 'Unassigned'}
              </p>
              
              {/* Quick Actions (visible on hover) */}
              <div className="absolute -right-4 -top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1 bg-white p-1 rounded-xl shadow-lg border border-gray-200 z-20">
                <button 
                  title="Add Sub-Department"
                  onClick={() => {
                    setError(null);
                    setEditingDept(null);
                    setDeptForm({ name: '', description: '', parentDepartmentId: dept.id!, managerId: '' });
                    setIsDeptModalOpen(true);
                  }}
                  className="p-1.5 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button 
                  title="Add Employee to Department"
                  onClick={() => {
                    setError(null);
                    setEditingEmployee(null);
                    setForm({
                      name: '', role: '', departmentId: dept.id!, managerId: dept.managerId || '', email: '',
                      salary: 0, hireDate: new Date().toISOString().split('T')[0], factoryId: ''
                    });
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                >
                  <UserPlus size={14} />
                </button>
                <button 
                  title="Edit Department"
                  onClick={() => {
                    setError(null);
                    setEditingDept(dept.id!);
                    setDeptForm({ name: dept.name, description: dept.description || '', parentDepartmentId: dept.parentDepartmentId || '', managerId: dept.managerId || '' });
                    setIsDeptModalOpen(true);
                  }}
                  className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
            {buildOrgChart(dept.id)}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>{`
        .org-tree ul {
          padding-top: 24px; position: relative;
          transition: all 0.5s;
          display: flex;
          justify-content: center;
        }
        .org-tree li {
          float: left; text-align: center;
          list-style-type: none;
          position: relative;
          padding: 24px 8px 0 8px;
          transition: all 0.5s;
        }
        .org-tree li::before, .org-tree li::after {
          content: '';
          position: absolute; top: 0; right: 50%;
          border-top: 3px solid #2563eb;
          width: 50%; height: 24px;
          opacity: 1;
        }
        .org-tree li::after {
          right: auto; left: 50%;
          border-left: 3px solid #2563eb;
        }
        .org-tree li:only-child::after, .org-tree li:only-child::before {
          display: none;
        }
        .org-tree li:only-child { padding-top: 0; }
        .org-tree li:first-child::before, .org-tree li:last-child::after {
          border: 0 none;
        }
        .org-tree li:last-child::before {
          border-right: 3px solid #2563eb;
          border-radius: 0 8px 0 0;
        }
        .org-tree li:first-child::after {
          border-radius: 8px 0 0 0;
        }
        .org-tree ul ul::before {
          content: '';
          position: absolute; top: 0; left: 50%;
          border-left: 3px solid #2563eb;
          width: 0; height: 24px;
          opacity: 1;
        }
        .org-node {
          display: inline-block;
        }
      `}</style>
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Human Resources</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Manage workforce and organizational structure</p>
        </div>
        <div className="flex space-x-4">
          {activeTab === 'departments' ? (
            <button 
              onClick={() => {
                setError(null);
                setEditingDept(null);
                setDeptForm({ name: '', description: '', parentDepartmentId: '', managerId: '' });
                setIsDeptModalOpen(true);
              }}
              className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
            >
              <Briefcase size={20} />
              <span className="font-bold">Add Department</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                setError(null);
                setEditingEmployee(null);
                setForm({
                  name: '', role: '', departmentId: '', managerId: '', email: '',
                  salary: 0, hireDate: new Date().toISOString().split('T')[0], factoryId: ''
                });
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
            >
              <UserPlus size={20} />
              <span className="font-bold">Add Employee</span>
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><XCircle size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Workforce" value={employees.length} icon={Users} color="indigo" />
        <StatsCard title="Departments" value={departments.length} icon={Briefcase} color="emerald" />
        <StatsCard title="Monthly Payroll" value={`$${totalPayroll.toLocaleString()}`} icon={DollarSign} color="amber" />
      </div>

      <div className="flex space-x-2 border-b border-[var(--color-text)]/10 pb-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('directory')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'directory' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <Users size={16} className="mr-2" /> Directory
        </button>
        <button 
          onClick={() => setActiveTab('departments')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'departments' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <Briefcase size={16} className="mr-2" /> Departments
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'attendance' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <Clock size={16} className="mr-2" /> Attendance
        </button>
        <button 
          onClick={() => setActiveTab('leaves')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'leaves' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <CalendarRange size={16} className="mr-2" /> Leaves
        </button>
        <button 
          onClick={() => setActiveTab('orgChart')}
          className={`whitespace-nowrap px-4 py-2 rounded-lg font-bold transition-all flex items-center ${activeTab === 'orgChart' ? 'bg-[var(--color-main)] text-white' : 'text-[var(--color-text)]/60 hover:bg-[var(--color-main)]/10'}`}
        >
          <Network size={16} className="mr-2" /> Org Chart
        </button>
      </div>

      {activeTab === 'directory' && (
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
          <div className="p-6 border-b border-[var(--color-text)]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Employee Directory</h3>
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              {directoryView === 'table' && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Group By:</span>
                  <select 
                    value={groupBy} 
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="p-1.5 text-sm bg-[var(--color-bg)] rounded-lg border border-[var(--color-text)]/20 focus:outline-none focus:ring-1 focus:ring-[var(--color-main)]/30 text-[var(--color-text)]"
                  >
                    <option value="none">None</option>
                    <option value="department">Department</option>
                    <option value="role">Role</option>
                  </select>
                </div>
              )}
              <div className="flex bg-[var(--color-text)]/5 rounded-lg p-1">
                <button 
                  onClick={() => setDirectoryView('cards')}
                  className={`p-1.5 rounded-md transition-colors ${directoryView === 'cards' ? 'bg-white shadow text-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/80'}`}
                  title="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setDirectoryView('table')}
                  className={`p-1.5 rounded-md transition-colors ${directoryView === 'table' ? 'bg-white shadow text-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/80'}`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={18} />
                <input 
                  type="text"
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-sm text-[var(--color-text)]"
                />
              </div>
            </div>
          </div>
          
          {directoryView === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredEmployees.map((emp) => (
                <motion.div key={emp.id} whileHover={{ y: -5 }} className="bg-[var(--color-bg)]/50 p-6 rounded-3xl border border-[var(--color-text)]/20 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-[var(--color-main)] text-white rounded-2xl flex items-center justify-center font-serif text-xl font-bold">
                      {emp.name?.[0] || '?'}
                    </div>
                    <div className="flex flex-col items-end">
                      <button 
                        onClick={() => {
                          setEditingEmployee(emp.id!);
                          setForm({
                            name: emp.name, role: emp.role, departmentId: emp.departmentId || '', managerId: emp.managerId || '', email: emp.email,
                            salary: Number(emp.salary) || 0, hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            factoryId: emp.factoryId || ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-[var(--color-main)] bg-[var(--color-main)]/10 hover:bg-[var(--color-main)]/20 rounded-lg transition-colors mb-2"
                      >
                        <Edit2 size={14} />
                      </button>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{emp.departmentName || 'No Department'}</p>
                        <p className="font-bold text-[var(--color-text)]">{emp.role || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-[var(--color-text)]">{emp.name || 'Unknown'}</h4>
                    <div className="flex flex-col text-xs text-[var(--color-text)]/60 mt-1 space-y-1">
                      <span className="flex items-center"><Mail size={12} className="mr-1" /> {emp.email || 'No email'}</span>
                      <span className="flex items-center text-[var(--color-main)]"><Network size={12} className="mr-1" /> Reports to: <strong className="ml-1 text-[var(--color-text)]">{emp.managerName || 'None'}</strong></span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[var(--color-text)]/20 flex justify-between items-center">
                    <div className="flex items-center text-[var(--color-main)] font-bold">
                      <DollarSign size={14} className="mr-0.5" />{Number(emp.salary || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--color-text)]/40">
                      Hired: {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[var(--color-text)]">
                <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-text)]/20">
                  <tr>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Employee</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Role</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Department</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Reports To</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Hire Date</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Salary</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-text)]/10">
                  {(() => {
                    if (groupBy === 'none') {
                      return filteredEmployees.map((emp) => (
                        <EmployeeTableRow key={emp.id} emp={emp} setEditingEmployee={setEditingEmployee} setForm={setForm} setIsModalOpen={setIsModalOpen} />
                      ));
                    }
                    
                    const grouped: Record<string, typeof employees> = {};
                    filteredEmployees.forEach(emp => {
                      const key = groupBy === 'department' ? (emp.departmentName || 'No Department') : (emp.role || 'No Role');
                      if (!grouped[key]) grouped[key] = [];
                      grouped[key].push(emp);
                    });

                    return Object.entries(grouped).map(([groupName, emps]) => (
                      <React.Fragment key={groupName}>
                        <tr className="bg-[var(--color-main)]/5 border-t border-[var(--color-main)]/20">
                          <td colSpan={7} className="p-3 font-bold text-[var(--color-main)] uppercase tracking-wider text-xs">
                            {groupName} ({emps.length})
                          </td>
                        </tr>
                        {emps.map(emp => (
                          <EmployeeTableRow key={emp.id} emp={emp} setEditingEmployee={setEditingEmployee} setForm={setForm} setIsModalOpen={setIsModalOpen} />
                        ))}
                      </React.Fragment>
                    ));
                  })()}
                  
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[var(--color-text)]/40">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
          <table className="w-full text-left text-sm text-[var(--color-text)]">
            <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-text)]/20">
              <tr>
                <th className="p-6 font-bold uppercase tracking-wider text-xs opacity-60">Department Name</th>
                <th className="p-6 font-bold uppercase tracking-wider text-xs opacity-60">Description</th>
                <th className="p-6 font-bold uppercase tracking-wider text-xs opacity-60">Department Head</th>
                <th className="p-6 font-bold uppercase tracking-wider text-xs opacity-60">Parent Department</th>
                <th className="p-6 font-bold uppercase tracking-wider text-xs opacity-60">Members</th>
                <th className="p-6 font-bold uppercase tracking-wider text-xs opacity-60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/10">
              {departments.map(dept => (
                <tr key={dept.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="p-6 font-semibold text-[var(--color-main)]">{dept.name}</td>
                  <td className="p-6 text-[var(--color-text)]/80 max-w-xs truncate">{dept.description || '-'}</td>
                  <td className="p-6 font-medium">{dept.managerName || <span className="opacity-40 italic">Unassigned</span>}</td>
                  <td className="p-6 text-[var(--color-text)]/80">{dept.parentDepartmentName || <span className="opacity-40 italic">Root</span>}</td>
                  <td className="p-6">
                    <span className="bg-[var(--color-main)]/10 text-[var(--color-main)] px-3 py-1 rounded-full font-bold text-xs">
                      {employees.filter(e => e.departmentId === dept.id).length}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => {
                        setEditingDept(dept.id!);
                        setDeptForm({ name: dept.name, description: dept.description || '', parentDepartmentId: dept.parentDepartmentId || '', managerId: dept.managerId || '' });
                        setIsDeptModalOpen(true);
                      }}
                      className="p-2 text-[var(--color-main)] bg-[var(--color-main)]/10 hover:bg-[var(--color-main)]/20 rounded-lg transition-colors inline-block"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text)]/40">No departments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
          <div className="p-6 border-b border-[var(--color-text)]/20 flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Attendance Log</h3>
            <button 
              onClick={() => {
                setError(null);
                setAttendanceForm({ employee_id: '', date: new Date().toISOString().split('T')[0], clock_in: '', clock_out: '', status: 'present' });
                setIsAttendanceModalOpen(true);
              }}
              className="px-4 py-2 bg-[var(--color-main)]/10 text-[var(--color-main)] font-bold rounded-xl hover:bg-[var(--color-main)]/20 transition-colors flex items-center"
            >
              <Clock size={16} className="mr-2" /> Log Attendance
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text)]">
              <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-text)]/20">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Employee</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Clock In</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Clock Out</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="p-4 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className="font-bold text-[var(--color-main)]">{record.employeeName}</p>
                      <p className="text-xs text-[var(--color-text)]/60">{record.employeeRole}</p>
                    </td>
                    <td className="p-4">{record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : '-'}</td>
                    <td className="p-4">{record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'absent' ? 'bg-rose-100 text-rose-700' :
                        record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--color-text)]/40">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
          <div className="p-6 border-b border-[var(--color-text)]/20 flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Leave Requests</h3>
            <button 
              onClick={() => {
                setError(null);
                setLeaveForm({ employee_id: '', start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], type: 'annual', reason: '' });
                setIsLeaveModalOpen(true);
              }}
              className="px-4 py-2 bg-[var(--color-main)]/10 text-[var(--color-main)] font-bold rounded-xl hover:bg-[var(--color-main)]/20 transition-colors flex items-center"
            >
              <CalendarRange size={16} className="mr-2" /> Apply Leave
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text)]">
              <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-text)]/20">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Employee</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Leave Type</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Dates</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Reason</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-xs opacity-60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-[var(--color-main)]">{leave.employeeName}</p>
                      <p className="text-xs text-[var(--color-text)]/60">{leave.employeeRole}</p>
                    </td>
                    <td className="p-4 font-medium capitalize">{leave.type.replace('_', ' ')}</td>
                    <td className="p-4">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-[var(--color-text)]/80 max-w-xs truncate" title={leave.reason}>{leave.reason || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {leave.status}
                      </span>
                      {leave.status !== 'pending' && <p className="text-[10px] mt-1 text-[var(--color-text)]/40">by {leave.approverName}</p>}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {leave.status === 'pending' && (
                        <>
                          <button onClick={() => handleLeaveStatus(leave.id, 'approved')} className="p-1.5 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors inline-block" title="Approve">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleLeaveStatus(leave.id, 'rejected')} className="p-1.5 text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors inline-block" title="Reject">
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--color-text)]/40">No leave requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orgChart' && (
        <div ref={orgContainerRef} className="bg-[var(--color-surface)] p-8 rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Company Hierarchy</h3>
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1.5 hover:bg-white rounded shadow-sm text-gray-600 transition-all" title="Zoom Out"><ZoomOut size={16} /></button>
              <div className="px-2 flex items-center font-bold text-sm text-gray-700 min-w-[3rem] justify-center">{Math.round(scale * 100)}%</div>
              <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 hover:bg-white rounded shadow-sm text-gray-600 transition-all" title="Zoom In"><ZoomIn size={16} /></button>
              <button onClick={fitToScreen} className="p-1.5 hover:bg-white rounded shadow-sm text-blue-600 transition-all" title="Fit to Screen"><Maximize size={16} /></button>
            </div>
          </div>
          <div className="w-full overflow-auto pb-16 flex justify-center" style={{ minHeight: '600px' }}>
            <div 
              ref={orgTreeRef}
              className="org-tree origin-top inline-block transition-transform duration-300"
              style={{ transform: `scale(${scale})` }}
            >
              {departments.length === 0 ? (
                <p className="text-[var(--color-text)]/40">No departments found. Create a department to build the org chart.</p>
              ) : (
                buildOrgChart(null)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? "Edit Employee" : "Add New Employee"}>
        <form onSubmit={handleEmployeeSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest">Full Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Department</label>
              <select required value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Role</label>
              <input type="text" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Reports To (Manager)</label>
              <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
                <option value="">No Manager</option>
                {employees.filter(e => e.id !== editingEmployee).map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Salary</label>
              <input type="number" required min="0" value={form.salary} onChange={e => setForm({ ...form, salary: parseInt(e.target.value) || 0 })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Hire Date</label>
              <input type="date" required value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg">
            {submitting ? 'Saving...' : 'Save Employee'}
          </button>
        </form>
      </Modal>

      {/* Department Modal */}
      <Modal isOpen={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} title={editingDept ? "Edit Department" : "Add New Department"}>
        <form onSubmit={handleDeptSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest">Department Name</label>
            <input type="text" required value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest">Description</label>
            <textarea value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Parent Department</label>
              <select value={deptForm.parentDepartmentId} onChange={e => setDeptForm({ ...deptForm, parentDepartmentId: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
                <option value="">None (Top Level)</option>
                {departments.filter(d => d.id !== editingDept).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Department Head</label>
              <select value={deptForm.managerId} onChange={e => setDeptForm({ ...deptForm, managerId: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
                <option value="">Unassigned</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
              </select>
            </div>
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg">
            {submitting ? 'Saving...' : 'Save Department'}
          </button>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title="Log Attendance">
        <form onSubmit={handleAttendanceSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Employee</label>
            <select required value={attendanceForm.employee_id} onChange={e => setAttendanceForm({ ...attendanceForm, employee_id: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Date</label>
            <input type="date" required value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Clock In</label>
              <input type="datetime-local" value={attendanceForm.clock_in} onChange={e => setAttendanceForm({ ...attendanceForm, clock_in: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Clock Out</label>
              <input type="datetime-local" value={attendanceForm.clock_out} onChange={e => setAttendanceForm({ ...attendanceForm, clock_out: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Status</label>
            <select required value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg">
            {submitting ? 'Saving...' : 'Log Attendance'}
          </button>
        </form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleLeaveSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Employee</label>
            <select required value={leaveForm.employee_id} onChange={e => setLeaveForm({ ...leaveForm, employee_id: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Start Date</label>
              <input type="date" required value={leaveForm.start_date} onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">End Date</label>
              <input type="date" required value={leaveForm.end_date} onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Leave Type</label>
            <select required value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20">
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="maternity">Maternity/Paternity Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Reason</label>
            <textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20" />
          </div>
          <button disabled={submitting} type="submit" className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default HR;
