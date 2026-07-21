'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Factory, AlertCircle, Plus, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getProductionRuns, getConsumptionData, recordConsumption } from '../../../../services/consumptionService';
import { apiService } from '../../../../services/apiService';
import Badge from '../../../../components/common/Badge';
import Modal from '../../../../components/Modal';

export default function MaterialConsumptionPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [consumptionData, setConsumptionData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    inventoryId: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.companyId) {
      loadRuns();
      loadInventory();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedRunId) {
      loadConsumption(selectedRunId);
    } else {
      setConsumptionData(null);
    }
  }, [selectedRunId]);

  const loadRuns = async () => {
    try {
      const data = await getProductionRuns(profile!.companyId);
      setRuns(data.filter(r => r.status === 'in_progress' || r.status === 'scheduled'));
    } catch (err) {
      console.error(err);
    }
  };

  const loadInventory = async () => {
    try {
      const data = await apiService.fetchCollection<any>('inventory', profile!.companyId);
      setInventory(data.filter(i => i.itemType === 'material' || i.itemType === 'raw'));
    } catch (err) {
      console.error(err);
    }
  };

  const loadConsumption = async (runId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConsumptionData(runId);
      setConsumptionData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch consumption data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await recordConsumption(selectedRunId, logForm.inventoryId, parseFloat(logForm.quantity), logForm.notes);
      setSuccessMsg('Material consumption recorded successfully.');
      setIsModalOpen(false);
      setLogForm({ inventoryId: '', quantity: '', notes: '' });
      loadConsumption(selectedRunId);
      loadInventory(); // refresh inventory levels
    } catch (err: any) {
      setError(err.message || 'Failed to record consumption');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <Factory size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Material Consumption')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Track and log raw material usage for production runs')}</p>
          </div>
        </div>

        {selectedRunId && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            <Plus size={20} />
            {t('Log Consumption')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 text-green-500 p-4 rounded-xl border border-green-500/20 flex items-center gap-2">
          <CheckCircle2 size={20} />
          {successMsg}
        </div>
      )}

      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-6 rounded-2xl">
        <label className="block text-sm font-bold text-[var(--color-text)]/60 uppercase mb-2">
          {t('Select Active Production Run')}
        </label>
        <select
          className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
          value={selectedRunId}
          onChange={e => setSelectedRunId(e.target.value)}
        >
          <option value="">{t('-- Select a Run --')}</option>
          {runs.map(run => (
            <option key={run.id} value={run.id}>
              {run.id.split('-')[0].toUpperCase()} - {t('Planned')}: {run.quantityPlanned} units ({run.status})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)]"></div>
        </div>
      )}

      {consumptionData && !loading && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[var(--color-text)]/10 bg-[var(--color-bg)]/50">
            <h3 className="text-xl font-bold">{t('Consumption Dashboard')}</h3>
            <p className="text-sm text-[var(--color-text)]/60">{t('Comparing required Bill of Materials vs actual inventory consumed.')}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Material')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Required Qty (BOM)')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Actual Consumed')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Variance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {consumptionData.consumption.map((item: any, idx: number) => {
                  const variance = item.consumedQty - item.requiredQty;
                  const isOver = variance > 0;
                  const isUnder = variance < 0 && item.requiredQty > 0;

                  return (
                    <tr key={idx} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="font-bold">{item.itemName}</div>
                        <div className="text-xs text-[var(--color-text)]/50 font-mono">{item.itemId}</div>
                      </td>
                      <td className="p-4 text-right font-medium">{item.requiredQty.toFixed(2)}</td>
                      <td className="p-4 text-right font-medium">{item.consumedQty.toFixed(2)}</td>
                      <td className="p-4 text-right">
                        <Badge
                          status={isOver ? 'failed' : (isUnder ? 'in_progress' : 'completed')}
                          text={`${variance > 0 ? '+' : ''}${variance.toFixed(2)}`}
                        />
                      </td>
                    </tr>
                  );
                })}
                {consumptionData.consumption.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--color-text)]/40">
                      {t('No BOM available or materials consumed yet.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Consumption Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('Log Manual Consumption')}>
        <form onSubmit={handleLogConsumption} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Select Material Batch')}</label>
            <select
              required
              value={logForm.inventoryId}
              onChange={e => setLogForm({ ...logForm, inventoryId: e.target.value })}
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            >
              <option value="">{t('-- Select Batch from Inventory --')}</option>
              {inventory.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.itemId} - Batch: {inv.batchNumber || 'N/A'} (Avail: {inv.quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Quantity Consumed')}</label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={logForm.quantity}
              onChange={e => setLogForm({ ...logForm, quantity: e.target.value })}
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              placeholder="e.g. 50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Notes / Reason')}</label>
            <textarea
              value={logForm.notes}
              onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              placeholder={t('e.g. Spillage during transfer, recipe adjustment')}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 hover:bg-[var(--color-text)]/5"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90"
            >
              {t('Submit')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
