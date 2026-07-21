'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchCollection } from '../../../../utils/firestore';
import { useMaterialPlanning } from '../../../../hooks/useMaterialPlanning';
import { createProcurementPlan, approveProcurementPlan } from '../../../../services/materialPlanningService';
import Modal from '../../../../components/Modal';
import Badge from '../../../../components/common/Badge';

export default function MaterialPlanningPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plans, loading, refreshData } = useMaterialPlanning();
  
  const [factories, setFactories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    factoryId: '',
    warehouseId: '',
    materialId: '',
    year: new Date().getFullYear(),
    totalQuantity: 0,
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0
  });

  useEffect(() => {
    if (profile?.companyId) {
      fetchCollection('factories', profile.companyId).then(setFactories).catch(console.error);
      fetchCollection('warehouses', profile.companyId).then(setWarehouses).catch(console.error);
      fetchCollection('rawMaterials', profile.companyId).then(setMaterials).catch(console.error);
    }
  }, [profile?.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;

    try {
      const payload = {
        factoryId: form.factoryId,
        warehouseId: form.warehouseId,
        materialId: form.materialId,
        year: form.year,
        totalQuantity: form.totalQuantity,
        companyId: profile.companyId,
        createdBy: profile.id,
        quarterlyPlans: [form.q1, form.q2, form.q3, form.q4]
      };
      
      await createProcurementPlan(payload);
      setIsModalOpen(false);
      setForm({
        factoryId: '',
        warehouseId: '',
        materialId: '',
        year: new Date().getFullYear(),
        totalQuantity: 0,
        q1: 0, q2: 0, q3: 0, q4: 0
      });
      refreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleApprove = async (planId: string) => {
    if (!profile?.id) return;
    try {
      await approveProcurementPlan(planId, profile.id);
      refreshData();
      alert(t('Plan approved successfully!'));
    } catch (e: any) {
      alert(e.message || t('Failed to approve plan.'));
    }
  };

  const getMaterialName = (id: string) => materials.find(m => m.id === id)?.name || id;
  const getFactoryName = (id: string) => factories.find(f => f.id === id)?.name || id;

  if (loading) return <div className="p-8 text-center">{t('Loading...')}</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Material Planning')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Manage annual and quarterly material requirements')}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl border border-transparent hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          <span>{t('Create Plan')}</span>
        </button>
      </div>

      <div className="grid gap-4 mt-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-bold text-[var(--color-text)]">
                  {getMaterialName(plan.materialId)} ({plan.year})
                </h3>
                <Badge 
                  status={plan.status === 'approved' ? 'completed' : (plan.status === 'pending_approval' ? 'pending' : 'in_progress')} 
                  text={plan.status.replace('_', ' ')} 
                />
              </div>
              <p className="text-sm text-[var(--color-text)]/60 mb-2">
                {t('Factory')}: {getFactoryName(plan.factoryId)} | {t('Total')}: {plan.totalQuantity}
              </p>
              <div className="flex space-x-2 text-xs text-[var(--color-text)]/80">
                {plan.quarterlyPlans && Array.isArray(plan.quarterlyPlans) && plan.quarterlyPlans.map((q: number, idx: number) => (
                  <span key={idx} className="bg-[var(--color-bg)] px-2 py-1 rounded border border-[var(--color-text)]/10">
                    Q{idx + 1}: {q}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 w-full md:w-auto mt-4 md:mt-0">
               {plan.status === 'pending_approval' && profile?.id !== plan.createdBy && (
                 <button 
                   onClick={() => handleApprove(plan.id)}
                   className="flex items-center justify-center space-x-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl hover:bg-green-500/20 transition-all flex-1 md:flex-none"
                 >
                   <CheckCircle size={18} />
                   <span>{t('Approve')}</span>
                 </button>
               )}
               {plan.status === 'pending_approval' && profile?.id === plan.createdBy && (
                 <div className="flex items-center space-x-2 text-[var(--color-text)]/40 text-sm">
                   <Clock size={16} />
                   <span>{t('Waiting for approval')}</span>
                 </div>
               )}
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="text-center text-[var(--color-text)]/40 p-8">{t('No material plans found.')}</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('Create Material Plan')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('Factory')}</label>
            <select 
              className="w-full p-2 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.factoryId}
              onChange={e => setForm({...form, factoryId: e.target.value})}
              required
            >
              <option value="">{t('Select Factory')}</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('Material')}</label>
            <select 
              className="w-full p-2 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.materialId}
              onChange={e => setForm({...form, materialId: e.target.value})}
              required
            >
              <option value="">{t('Select Material')}</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('Year')}</label>
              <input 
                type="number" 
                className="w-full p-2 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={form.year}
                onChange={e => setForm({...form, year: Number(e.target.value)})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('Total Quantity')}</label>
              <input 
                type="number" 
                className="w-full p-2 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={form.totalQuantity}
                onChange={e => setForm({...form, totalQuantity: Number(e.target.value)})}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(q => (
              <div key={q}>
                <label className="block text-xs font-medium mb-1">Q{q}</label>
                <input 
                  type="number" 
                  className="w-full p-2 rounded border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                  value={form[`q${q}` as keyof typeof form]}
                  onChange={e => setForm({...form, [`q${q}` as keyof typeof form]: Number(e.target.value)})}
                  required
                />
              </div>
            ))}
          </div>
          <button type="submit" className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl font-bold hover:opacity-90 transition-all">
            {t('Submit Plan')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
