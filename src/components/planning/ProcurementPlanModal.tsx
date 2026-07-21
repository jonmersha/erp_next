import React, { useState, useEffect } from 'react';
import { Warehouse, RawMaterial, ProcurementPlan, QuarterlyPlan, Factory, Product } from '../../types';
import { addProcurementPlan, updateProcurementPlan } from '../../services/planningService';
import { useAuth } from '../../context/AuthContext';
import { X, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[];
  materials: RawMaterial[];
  factories: Factory[];
  onSuccess: () => void;
  plan?: ProcurementPlan;
}

const ProcurementPlanModal: React.FC<Props> = ({ isOpen, onClose, warehouses, materials, factories, onSuccess, plan }) => {
  const { profile, isAdmin, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Omit<ProcurementPlan, 'id' | 'companyId'>>({
    factoryId: '',
    warehouseId: '',
    materialId: '',
    year: new Date().getFullYear(),
    totalQuantity: 0,
    quarterlyPlans: [
      { quarter: 'Q1', quantity: 0, monthlyPlans: [{month: 1, quantity: 0}, {month: 2, quantity: 0}, {month: 3, quantity: 0}] },
      { quarter: 'Q2', quantity: 0, monthlyPlans: [{month: 4, quantity: 0}, {month: 5, quantity: 0}, {month: 6, quantity: 0}] },
      { quarter: 'Q3', quantity: 0, monthlyPlans: [{month: 7, quantity: 0}, {month: 8, quantity: 0}, {month: 9, quantity: 0}] },
      { quarter: 'Q4', quantity: 0, monthlyPlans: [{month: 10, quantity: 0}, {month: 11, quantity: 0}, {month: 12, quantity: 0}] },
    ],
    status: 'planned',
  });

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        setForm({
          factoryId: plan.factoryId || '',
          warehouseId: plan.warehouseId || '',
          materialId: plan.materialId || '',
          year: plan.year || new Date().getFullYear(),
          totalQuantity: plan.totalQuantity || 0,
          quarterlyPlans: plan.quarterlyPlans?.length ? plan.quarterlyPlans : [
            { quarter: 'Q1', quantity: 0, monthlyPlans: [{month: 1, quantity: 0}, {month: 2, quantity: 0}, {month: 3, quantity: 0}] },
            { quarter: 'Q2', quantity: 0, monthlyPlans: [{month: 4, quantity: 0}, {month: 5, quantity: 0}, {month: 6, quantity: 0}] },
            { quarter: 'Q3', quantity: 0, monthlyPlans: [{month: 7, quantity: 0}, {month: 8, quantity: 0}, {month: 9, quantity: 0}] },
            { quarter: 'Q4', quantity: 0, monthlyPlans: [{month: 10, quantity: 0}, {month: 11, quantity: 0}, {month: 12, quantity: 0}] },
          ],
          status: plan.status || 'planned',
        });
      } else {
        setForm({
          factoryId: '',
          warehouseId: '',
          materialId: '',
          year: new Date().getFullYear(),
          totalQuantity: 0,
          quarterlyPlans: [
            { quarter: 'Q1', quantity: 0, monthlyPlans: [{month: 1, quantity: 0}, {month: 2, quantity: 0}, {month: 3, quantity: 0}] },
            { quarter: 'Q2', quantity: 0, monthlyPlans: [{month: 4, quantity: 0}, {month: 5, quantity: 0}, {month: 6, quantity: 0}] },
            { quarter: 'Q3', quantity: 0, monthlyPlans: [{month: 7, quantity: 0}, {month: 8, quantity: 0}, {month: 9, quantity: 0}] },
            { quarter: 'Q4', quantity: 0, monthlyPlans: [{month: 10, quantity: 0}, {month: 11, quantity: 0}, {month: 12, quantity: 0}] },
          ],
          status: 'planned',
        });
      }
    }
  }, [isOpen, plan]);

  const isApproved = plan?.status === 'approved';
  const canApprove = isAdmin || (hasRole('factory_manager') && profile?.unitId === form.factoryId);

  if (!isOpen) return null;

  const handleAutoDistribute = (quantity: number) => {
    const qQuantity = Math.floor(quantity / 4);
    const mQuantity = Math.floor(qQuantity / 3);
    setForm({
      ...form,
      totalQuantity: quantity,
      quarterlyPlans: (form.quarterlyPlans || []).map(q => ({
        ...q,
        quantity: qQuantity,
        monthlyPlans: (q.monthlyPlans || []).map(m => ({ ...m, quantity: mQuantity }))
      }))
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    setLoading(true);
    try {
      if (plan) {
        await updateProcurementPlan(plan.id, form);
      } else {
        await addProcurementPlan({
          ...form,
          companyId: profile.companyId
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-surface)] p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[var(--color-text)]">{plan ? 'Edit Procurement Plan' : 'New Procurement Plan'}</h3>
          <button onClick={onClose} className="text-[var(--color-text)]"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-[var(--color-text)]" value={form.factoryId || ''} onChange={e => setForm({...form, factoryId: e.target.value})} disabled={isApproved}>
            <option value="">Select Factory (Optional)</option>
            {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-[var(--color-text)]" value={form.warehouseId || ''} onChange={e => setForm({...form, warehouseId: e.target.value})} required disabled={isApproved}>
            <option value="">Select Ordering Warehouse</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-[var(--color-text)]" value={form.materialId || ''} onChange={e => setForm({...form, materialId: e.target.value})} disabled={isApproved} required>
            <option value="">Select Raw Material</option>
            {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input type="number" placeholder="Year" className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-[var(--color-text)]" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value) || 0})} required disabled={isApproved} />
          <div className="flex space-x-2">
            <input type="number" placeholder="Total Annual Quantity" className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-[var(--color-text)]" value={form.totalQuantity} onChange={e => setForm({...form, totalQuantity: parseInt(e.target.value) || 0})} required disabled={isApproved} />
            {!isApproved && (
              <button type="button" onClick={() => handleAutoDistribute(form.totalQuantity)} className="bg-[var(--color-text)]/10 px-4 rounded-xl font-medium hover:bg-[var(--color-text)]/20 whitespace-nowrap text-[var(--color-text)]">
                Auto-Distribute
              </button>
            )}
          </div>
          <select className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-[var(--color-text)]" value={form.status} onChange={e => setForm({...form, status: e.target.value as 'planned' | 'ordered' | 'received' | 'approved'})} required disabled={isApproved}>
            <option value="planned">Planned</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
            {canApprove && <option value="approved">Approved</option>}
          </select>
          
          <div className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mt-4">Quarterly Breakdown</div>
          {(form.quarterlyPlans || []).map((q, qIdx) => (
            <div key={q.quarter} className="p-4 bg-[var(--color-bg)] rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">{q.quarter}</span>
                <input type="number" value={q.quantity} onChange={e => {
                  const newQPlans = (form.quarterlyPlans || []).map((qp, i) => i === qIdx ? { ...qp, quantity: parseInt(e.target.value) || 0 } : qp);
                  const newTotalQuantity = newQPlans.reduce((sum, q) => sum + q.quantity, 0);
                  setForm({...form, quarterlyPlans: newQPlans, totalQuantity: newTotalQuantity});
                }} className="w-20 p-1 rounded border border-[var(--color-text)]/10 bg-[var(--color-surface)]" disabled={isApproved} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(q.monthlyPlans || []).map((m, mIdx) => (
                  <input key={m.month} type="number" value={m.quantity} onChange={e => {
                    const newQPlans = (form.quarterlyPlans || []).map((qp, i) => {
                      if (i === qIdx) {
                        const newMonthlyPlans = (qp.monthlyPlans || []).map((mp, j) => j === mIdx ? { ...mp, quantity: parseInt(e.target.value) || 0 } : mp);
                        return { ...qp, monthlyPlans: newMonthlyPlans, quantity: newMonthlyPlans.reduce((sum, m) => sum + m.quantity, 0) };
                      }
                      return qp;
                    });
                    const newTotalQuantity = newQPlans.reduce((sum, q) => sum + q.quantity, 0);
                    setForm({...form, quarterlyPlans: newQPlans, totalQuantity: newTotalQuantity});
                  }} className="p-1 rounded border border-[var(--color-text)]/10 bg-[var(--color-surface)]" disabled={isApproved} />
                ))}
              </div>
            </div>
          ))}

          {!isApproved && (
            <button type="submit" className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl font-bold" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mx-auto" /> : (plan ? 'Update Plan' : 'Create Plan')}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProcurementPlanModal;
