import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useReportsData } from '../hooks/useReportsData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, Factory, Warehouse, DollarSign, Activity, AlertCircle 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const { t } = useTranslation();
  const { isAdmin, can } = useAuth();
  
  // Determine available tabs based on permissions
  const availableTabs = [];
  if (isAdmin) availableTabs.push({ id: 'executive', label: t('Executive Overview'), icon: Activity });
  if (can('read', 'sales') || isAdmin) availableTabs.push({ id: 'sales', label: t('Sales & Revenue'), icon: DollarSign });
  if (can('read', 'production') || isAdmin) availableTabs.push({ id: 'production', label: t('Production Output'), icon: Factory });
  if (can('read', 'inventory') || isAdmin) availableTabs.push({ id: 'inventory', label: t('Supply Chain'), icon: Warehouse });
  if (can('read', 'hr') || isAdmin) availableTabs.push({ id: 'hr', label: t('Human Resources'), icon: Users });

  const [activeTab, setActiveTab] = useState('');
  
  React.useEffect(() => {
    if (!activeTab && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  const { data, loading, error } = useReportsData(activeTab || 'executive');

  if (!availableTabs.length) {
    return <div className="p-8 text-center text-[var(--color-text)]/60">{t("You don't have permission to view reports.")}</div>;
  }

  const renderExecutive = () => {
    if (!data || typeof data.totalSales === 'undefined') return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><DollarSign size={24} /></div>
            <h3 className="font-bold text-[var(--color-text)]/60 uppercase text-xs tracking-wider">{t('Total Revenue')}</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">${Number(data.totalSales).toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Factory size={24} /></div>
            <h3 className="font-bold text-[var(--color-text)]/60 uppercase text-xs tracking-wider">{t('Active Runs')}</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{data.activeRuns || 0}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl"><Warehouse size={24} /></div>
            <h3 className="font-bold text-[var(--color-text)]/60 uppercase text-xs tracking-wider">{t('Inventory Units')}</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{Number(data.totalInventoryItems || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl"><Users size={24} /></div>
            <h3 className="font-bold text-[var(--color-text)]/60 uppercase text-xs tracking-wider">{t('Active Staff')}</h3>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{data.totalEmployees || 0}</p>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    if (!data || !data.monthlySales) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <h3 className="font-bold text-[var(--color-text)] uppercase tracking-widest text-xs mb-6">{t('Monthly Revenue')}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text)" opacity={0.1} />
                <XAxis dataKey="month" stroke="var(--color-text)" opacity={0.5} />
                <YAxis stroke="var(--color-text)" opacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-text)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <h3 className="font-bold text-[var(--color-text)] uppercase tracking-widest text-xs mb-6">{t('Orders by Status')}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusCounts || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                  {(data.statusCounts || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderProduction = () => {
    if (!data || !data.factoryOutput) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <h3 className="font-bold text-[var(--color-text)] uppercase tracking-widest text-xs mb-6">{t('Factory Output')}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.factoryOutput}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text)" opacity={0.1} />
                <XAxis dataKey="factory" stroke="var(--color-text)" opacity={0.5} />
                <YAxis stroke="var(--color-text)" opacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-text)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="output" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    if (!data || !data.lowStockAlerts) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <h3 className="font-bold text-[var(--color-text)] uppercase tracking-widest text-xs mb-6">{t('Low Stock Alerts')}</h3>
          <div className="space-y-4">
            {data.lowStockAlerts.length === 0 ? (
              <p className="text-[var(--color-text)]/60 text-sm">{t('No low stock alerts.')}</p>
            ) : (
              data.lowStockAlerts.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="font-bold text-[var(--color-text)] text-sm">{item.item_id}</span>
                  </div>
                  <span className="font-bold text-red-500">{item.quantity} Units</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHr = () => {
    if (!data || !data.employeesByDepartment) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
          <h3 className="font-bold text-[var(--color-text)] uppercase tracking-widest text-xs mb-6">{t('Employees by Department')}</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.employeesByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-text)" opacity={0.1} />
                <XAxis dataKey="department" stroke="var(--color-text)" opacity={0.5} />
                <YAxis stroke="var(--color-text)" opacity={0.5} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-text)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--color-text)] mb-2">
            {t('Reports & Analytics')}
          </h1>
          <p className="text-[var(--color-text)]/60">
            {t('Insights and performance metrics.')}
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-[var(--color-text)]/10">
        {availableTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold text-sm transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[var(--color-main)] text-white' 
                  : 'text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[var(--color-main)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 text-red-500 rounded-3xl border border-red-500/20">
            {error}
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'executive' && renderExecutive()}
            {activeTab === 'sales' && renderSales()}
            {activeTab === 'production' && renderProduction()}
            {activeTab === 'inventory' && renderInventory()}
            {activeTab === 'hr' && renderHr()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
