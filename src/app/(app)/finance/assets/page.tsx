'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getAssets, createAsset, updateAssetStatus, FixedAsset } from '../../../../services/assetsService';
import Modal from '../../../../components/Modal';
import Badge from '../../../../components/common/Badge';

export default function FixedAssetsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    assetName: '',
    assetType: 'machinery',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    salvageValue: '0',
    usefulLifeYears: '5',
    depreciationMethod: 'straight_line'
  });

  useEffect(() => {
    if (profile?.companyId) {
      loadAssets();
    }
  }, [profile]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getAssets(profile!.companyId);
      setAssets(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createAsset({
        companyId: profile!.companyId,
        ...form,
        purchaseCost: parseFloat(form.purchaseCost),
        salvageValue: parseFloat(form.salvageValue),
        usefulLifeYears: parseInt(form.usefulLifeYears),
      } as any);
      setIsModalOpen(false);
      setForm({ ...form, assetName: '', purchaseCost: '' });
      loadAssets();
    } catch (err: any) {
      setError(err.message || 'Failed to register asset');
    }
  };

  const calculateDepreciation = (asset: FixedAsset) => {
    const cost = Number(asset.purchaseCost);
    const salvage = Number(asset.salvageValue);
    const lifeYears = Number(asset.usefulLifeYears);
    
    const purchaseDate = new Date(asset.purchaseDate);
    const today = new Date();
    
    // Calculate years passed (fractional)
    const yearsPassed = Math.max(0, (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    
    // Cap at useful life
    const effectiveYears = Math.min(yearsPassed, lifeYears);
    
    // Straight line method
    const depreciableBase = cost - salvage;
    const annualDepreciation = depreciableBase / lifeYears;
    const accumulatedDepreciation = annualDepreciation * effectiveYears;
    
    const currentBookValue = cost - accumulatedDepreciation;

    return { accumulatedDepreciation, currentBookValue };
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <Truck size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Fixed Assets')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Track machinery, equipment, and calculate depreciation')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          {t('Register Asset')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Asset Name')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Type')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Purchase Date')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Purchase Cost')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Acc. Depreciation')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Book Value')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)] mx-auto"></div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--color-text)]/40">
                    {t('No fixed assets registered yet.')}
                  </td>
                </tr>
              ) : (
                assets.map(asset => {
                  const { accumulatedDepreciation, currentBookValue } = calculateDepreciation(asset);
                  return (
                    <tr key={asset.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="p-4 font-bold">{asset.assetName}</td>
                      <td className="p-4 capitalize text-[var(--color-text)]/70">{asset.assetType}</td>
                      <td className="p-4 text-sm text-[var(--color-text)]/70">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(asset.purchaseCost)}</td>
                      <td className="p-4 text-right text-red-500/80 font-medium">-{formatCurrency(accumulatedDepreciation)}</td>
                      <td className="p-4 text-right font-bold text-[var(--color-main)]">{formatCurrency(currentBookValue)}</td>
                      <td className="p-4">
                        <Badge 
                          status={asset.status === 'active' ? 'completed' : 'pending'} 
                          text={asset.status.toUpperCase()} 
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Asset Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('Register New Fixed Asset')} 
        size="lg"
        helpText="Register a new physical asset. Assets will be automatically tracked for depreciation based on their purchase cost, salvage value, and useful life."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Asset Name')}</label>
              <input 
                type="text"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/20 bg-black/5 focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
                value={form.assetName}
                onChange={e => setForm({...form, assetName: e.target.value})}
                placeholder="e.g. Delivery Truck 01"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Asset Type')}</label>
              <select
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/20 bg-black/5 focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
                value={form.assetType}
                onChange={e => setForm({...form, assetType: e.target.value})}
              >
                <option value="machinery">{t('Machinery')}</option>
                <option value="vehicle">{t('Vehicle')}</option>
                <option value="building">{t('Building')}</option>
                <option value="furniture">{t('Furniture')}</option>
                <option value="electronics">{t('Electronics')}</option>
                <option value="other">{t('Other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Purchase Date')}</label>
              <input 
                type="date"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/20 bg-black/5 focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
                value={form.purchaseDate}
                onChange={e => setForm({...form, purchaseDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Purchase Cost')}</label>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/20 bg-black/5 focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
                value={form.purchaseCost}
                onChange={e => setForm({...form, purchaseCost: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Useful Life (Years)')}</label>
              <input 
                type="number"
                min="1"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/20 bg-black/5 focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
                value={form.usefulLifeYears}
                onChange={e => setForm({...form, usefulLifeYears: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Salvage Value (End of Life)')}</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/20 bg-black/5 focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]"
                value={form.salvageValue}
                onChange={e => setForm({...form, salvageValue: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
              {t('Cancel')}
            </button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90">
              {t('Register Asset')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
