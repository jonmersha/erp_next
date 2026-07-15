import React, { useState } from 'react';
import { useQualityData, addQualityCheck, updateQualityCheck } from '../hooks/useQualityData';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { QualityCheck } from '../types';
import { useTranslation } from 'react-i18next';

const Quality: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { qualityChecks, productionRuns, grns, inventory, loading, refreshData } = useQualityData();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    referenceType: 'production_run' as 'production_run' | 'grn' | 'inventory',
    referenceId: '',
    itemId: '',
    status: 'pending' as 'passed' | 'failed' | 'pending' | 'quarantined',
    notes: ''
  });

  if (loading) {
    return <div className="p-8 text-center text-[var(--color-text)]/40">{t('Loading Quality module...')}</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      await addQualityCheck({
        ...form,
        companyId: profile.companyId,
        inspectorId: profile.name || 'Current User',
        checkDate: new Date().toISOString()
      });
      setShowForm(false);
      setForm({
        referenceType: 'production_run',
        referenceId: '',
        itemId: '',
        status: 'pending',
        notes: ''
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to save quality check', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateQualityCheck(id, { status: newStatus });
      await refreshData();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="text-emerald-500" />;
      case 'failed': return <XCircle className="text-red-500" />;
      case 'quarantined': return <AlertTriangle className="text-amber-500" />;
      default: return <Clock className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Quality Management')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Manage QA inspections, compliance, and product standards.')}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition-colors shadow-lg shadow-[var(--color-main)]/20"
        >
          <Plus size={20} />
          <span>{t('New Inspection')}</span>
        </button>
      </header>

      {showForm && (
        <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-xl">
          <h3 className="text-xl font-bold text-[var(--color-main)] mb-6">{t('Create Inspection Record')}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Inspection Target')}</label>
                <select 
                  value={form.referenceType}
                  onChange={e => setForm({ ...form, referenceType: e.target.value as any, referenceId: '' })}
                  className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
                >
                  <option value="production_run">{t('Production Run')}</option>
                  <option value="grn">{t('Goods Receipt Note (GRN)')}</option>
                  <option value="inventory">{t('Inventory Batch')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Reference ID')}</label>
                {form.referenceType === 'production_run' && (
                  <select
                    required
                    value={form.referenceId}
                    onChange={e => setForm({ ...form, referenceId: e.target.value })}
                    className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]"
                  >
                    <option value="">{t('Select Production Run')}</option>
                    {productionRuns.map(run => (
                      <option key={run.id} value={run.id}>{t('Run')} #{run.id.slice(0, 8)} ({t('Factory')} {run.factoryId.slice(0, 4)})</option>
                    ))}
                  </select>
                )}
                {form.referenceType === 'grn' && (
                  <select
                    required
                    value={form.referenceId}
                    onChange={e => setForm({ ...form, referenceId: e.target.value })}
                    className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]"
                  >
                    <option value="">{t('Select GRN')}</option>
                    {grns.map(grn => (
                      <option key={grn.id} value={grn.id}>{t('GRN')} #{grn.id.slice(0, 8)}</option>
                    ))}
                  </select>
                )}
                {form.referenceType === 'inventory' && (
                  <select
                    required
                    value={form.referenceId}
                    onChange={e => setForm({ ...form, referenceId: e.target.value })}
                    className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]"
                  >
                    <option value="">{t('Select Inventory Batch')}</option>
                    {inventory.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.itemType} - {t('Batch')} {inv.batchNumber}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Initial Status')}</label>
                <select 
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as any })}
                  className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
                >
                  <option value="pending">{t('Pending')}</option>
                  <option value="passed">{t('Passed')}</option>
                  <option value="quarantined">{t('Quarantined')}</option>
                  <option value="failed">{t('Failed')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Component/Item ID (Optional)')}</label>
                <input 
                  type="text"
                  value={form.itemId}
                  onChange={e => setForm({ ...form, itemId: e.target.value })}
                  placeholder={t('e.g. PRD-XYZ')}
                  className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Inspection Notes')}</label>
              <textarea 
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder={t('Enter observations, non-compliances, or measurements...')}
                className="w-full p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)] resize-none"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-[var(--color-text)]/20">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-3 font-bold text-[var(--color-text)]/40 hover:text-[var(--color-text)] transition-colors"
              >
                {t('Cancel')}
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="bg-[var(--color-main)] text-white px-8 py-3 rounded-full font-bold hover:bg-opacity-90 transition-colors shadow-lg shadow-[var(--color-main)]/20 disabled:opacity-50"
              >
                {submitting ? t('Saving...') : t('Save Record')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-text)]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-[var(--color-text)]/40 bg-[var(--color-text)]/[0.02]">
              <tr>
                <th className="px-6 py-4 font-bold">{t('ID / Date')}</th>
                <th className="px-6 py-4 font-bold">{t('Target')}</th>
                <th className="px-6 py-4 font-bold">{t('Inspector / Notes')}</th>
                <th className="px-6 py-4 font-bold">{t('Status')}</th>
                <th className="px-6 py-4 font-bold text-center">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5">
              {qualityChecks.map(check => (
                <tr key={check.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-[var(--color-main)]">#{check.id.slice(0, 8)}</div>
                    <div className="text-xs text-[var(--color-text)]/40">{new Date(check.checkDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold capitalize">{check.referenceType === 'production_run' ? t('Production Run') : check.referenceType === 'grn' ? t('Goods Receipt Note (GRN)') : t('Inventory Batch')}</div>
                    <div className="text-xs font-mono text-[var(--color-text)]/60">{t('Ref')}: {check.referenceId.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--color-text)]">{check.inspectorId || t('System')}</div>
                    <div className="text-xs text-[var(--color-text)]/60 line-clamp-1 max-w-[200px]">{check.notes || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(check.status)}
                      <span className="font-bold capitalize">{t(check.status.charAt(0).toUpperCase() + check.status.slice(1))}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={check.status}
                      onChange={(e) => handleUpdateStatus(check.id, e.target.value)}
                      className="bg-transparent text-xs font-bold border border-[var(--color-text)]/10 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="pending">{t('Pending')}</option>
                      <option value="passed">{t('Passed')}</option>
                      <option value="quarantined">{t('Quarantined')}</option>
                      <option value="failed">{t('Failed')}</option>
                    </select>
                  </td>
                </tr>
              ))}
              {qualityChecks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text)]/40 italic">
                    {t('No quality inspection records found.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Quality;
