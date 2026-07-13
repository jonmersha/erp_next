import React, { useState } from 'react';
import { useHRData } from '../hooks/useHRData';
import { createEmployee, updateEmployee } from '../services/hrService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Users, UserPlus, Search, Briefcase, Mail, DollarSign, Loader2, XCircle, Edit2 } from 'lucide-react';
import Modal from '../components/Modal';
import StatsCard from '../components/common/StatsCard';

const HR: React.FC = () => {
  const { profile } = useAuth();
  const { employees, factories, loading } = useHRData();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
    factoryId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
      setEditingEmployee(null);
      setForm({
        name: '',
        role: '',
        department: '',
        email: '',
        salary: 0,
        hireDate: new Date().toISOString().split('T')[0],
        factoryId: ''
      });
      window.location.reload(); // Refresh the list
    } catch (err: any) {
      console.error("Error saving employee:", err);
      setError(err.message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    (emp.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (emp.role?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (emp.department?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const totalPayroll = employees.reduce((sum, emp) => sum + Number(emp.salary || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Human Resources</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Manage workforce across all production units</p>
        </div>
        <button 
          onClick={() => {
            setError(null);
            setEditingEmployee(null);
            setForm({
              name: '',
              role: '',
              department: '',
              email: '',
              salary: 0,
              hireDate: new Date().toISOString().split('T')[0],
              factoryId: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
        >
          <UserPlus size={20} />
          <span className="font-bold">Add Employee</span>
        </button>
      </header>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Workforce"
          value={employees.length}
          icon={Users}
          color="indigo"
        />
        <StatsCard 
          title="Departments"
          value={new Set(employees.map(e => e.department)).size}
          icon={Briefcase}
          color="emerald"
        />
        <StatsCard 
          title="Monthly Payroll"
          value={`$${totalPayroll.toLocaleString()}`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/5 overflow-hidden">
        <div className="p-6 border-b border-[var(--color-text)]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Employee Directory</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={18} />
            <input 
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-sm text-[var(--color-text)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredEmployees.map((emp) => (
            <motion.div 
              key={emp.id}
              whileHover={{ y: -5 }}
              className="bg-[var(--color-bg)]/50 p-6 rounded-3xl border border-[var(--color-text)]/5 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-[var(--color-main)] text-white rounded-2xl flex items-center justify-center font-serif text-xl font-bold">
                  {emp.name?.[0] || '?'}
                </div>
                <div className="flex flex-col items-end">
                  <button 
                    onClick={() => {
                      setEditingEmployee(emp.id!);
                      setForm({
                        name: emp.name,
                        role: emp.role,
                        department: emp.department,
                        email: emp.email,
                        salary: Number(emp.salary) || 0,
                        hireDate: emp.hireDate ? new Date(emp.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        factoryId: emp.factoryId || ''
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-[var(--color-main)] bg-[var(--color-main)]/10 hover:bg-[var(--color-main)]/20 rounded-lg transition-colors mb-2"
                  >
                    <Edit2 size={14} />
                  </button>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{emp.department || 'N/A'}</p>
                    <p className="font-bold text-[var(--color-text)]">{emp.role || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-serif font-bold text-lg text-[var(--color-text)]">{emp.name || 'Unknown'}</h4>
                <div className="flex items-center text-xs text-[var(--color-text)]/40 mt-1">
                  <Mail size={12} className="mr-1" />
                  {emp.email || 'No email'}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-text)]/5 flex justify-between items-center">
                <div className="flex items-center text-[var(--color-main)] font-bold">
                  <DollarSign size={14} className="mr-0.5" />
                  {Number(emp.salary || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-[var(--color-text)]/40">
                  Hired: {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? "Edit Employee" : "Add New Employee"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-black/40 uppercase tracking-widest">Full Name</label>
            <input 
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              placeholder="e.g., Jane Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Role</label>
              <input 
                type="text"
                required
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
                placeholder="e.g., Quality Manager"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Department</label>
              <input 
                type="text"
                required
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
                placeholder="e.g., Operations"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Email Address</label>
            <input 
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              placeholder="e.g., jane@factory.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Monthly Salary</label>
              <input 
                type="number"
                required
                min="0"
                value={form.salary}
                onChange={e => setForm({ ...form, salary: parseInt(e.target.value) || 0 })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Hire Date</label>
              <input 
                type="date"
                required
                value={form.hireDate}
                onChange={e => setForm({ ...form, hireDate: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Assigned Factory</label>
            <select 
              required
              value={form.factoryId}
              onChange={e => setForm({ ...form, factoryId: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            >
              <option value="">Select Factory</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <button 
            disabled={submitting}
            type="submit"
            className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Add Employee'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default HR;
