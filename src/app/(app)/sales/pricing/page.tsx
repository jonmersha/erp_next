'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Plus, AlertCircle, Play, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getPricingRules, createPricingRule, deletePricingRule, simulatePrice, getProducts, PricingRule, SimulationResult } from '../../../../services/pricingService';
import Modal from '../../../../components/Modal';

export default function DynamicPricingPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    rule_name: '',
    product_id: '',
    condition_type: 'quantity_above',
    condition_value: '',
    adjustment_type: 'percentage',
    adjustment_value: ''
  });

  const [simulation, setSimulation] = useState({
    productId: '',
    quantity: '1'
  });
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    if (profile?.companyId) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesData, productsData] = await Promise.all([
        getPricingRules(profile!.companyId),
        getProducts(profile!.companyId)
      ]);
      setRules(rulesData);
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load dynamic pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createPricingRule({
        companyId: profile!.companyId,
        ruleName: form.rule_name,
        productId: form.product_id || null,
        conditionType: form.condition_type as any,
        conditionValue: form.condition_value,
        adjustmentType: form.adjustment_type as any,
        adjustmentValue: parseFloat(form.adjustment_value)
      } as any);
      setIsModalOpen(false);
      setForm({ rule_name: '', product_id: '', condition_type: 'quantity_above', condition_value: '', adjustment_type: 'percentage', adjustment_value: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create pricing rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this rule?'))) return;
    try {
      await deletePricingRule(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete rule');
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulation.productId || !simulation.quantity) return;
    setError(null);
    try {
      const res = await simulatePrice({
        companyId: profile!.companyId,
        productId: simulation.productId,
        quantity: parseInt(simulation.quantity)
      });
      setSimResult(res);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Dynamic Pricing')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Configure intelligent rules to adjust prices on the fly')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all text-sm"
        >
          <Plus size={16} />
          {t('Create Rule')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--color-text)]/10 bg-[var(--color-bg)]/50">
              <h2 className="font-bold text-lg">{t('Active Pricing Rules')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                    <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Rule Name')}</th>
                    <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Target')}</th>
                    <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Condition')}</th>
                    <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Adjustment')}</th>
                    <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-text)]/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)] mx-auto"></div>
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[var(--color-text)]/40">
                        {t('No active pricing rules. Create one to get started.')}
                      </td>
                    </tr>
                  ) : (
                    rules.map(rule => {
                      const prod = products.find(p => p.id === rule.product_id);
                      return (
                        <tr key={rule.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                          <td className="p-4 font-medium">
                            {rule.rule_name}
                          </td>
                          <td className="p-4 text-sm text-[var(--color-text)]/70">
                            {prod ? prod.name : t('All Products')}
                          </td>
                          <td className="p-4 text-sm">
                            <span className="font-mono bg-[var(--color-text)]/5 px-2 py-1 rounded">
                              {rule.condition_type === 'quantity_above' ? 'QTY > ' + rule.condition_value : rule.condition_type + ' = ' + rule.condition_value}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-[var(--color-main)]">
                            {rule.adjustment_value > 0 ? '+' : ''}{rule.adjustment_value}{rule.adjustment_type === 'percentage' ? '%' : ' USD'}
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-600 transition-colors p-2">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[var(--color-main)]/5 border border-[var(--color-main)]/20 rounded-2xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-[var(--color-main)]">
              <Play size={20} />
              <h2 className="font-bold text-lg">{t('Price Simulator')}</h2>
            </div>
            <p className="text-sm text-[var(--color-text)]/60 mb-6">
              {t('Test your active rules engine. Select a product and quantity to see the final computed price.')}
            </p>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Product')}</label>
                <select 
                  required
                  className="w-full p-3 rounded-xl border border-[var(--color-main)]/20 bg-[var(--color-bg)]"
                  value={simulation.productId}
                  onChange={e => setSimulation({...simulation, productId: e.target.value})}
                >
                  <option value="">{t('Select Product')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Simulated Quantity')}</label>
                <input 
                  type="number" min="1" required
                  className="w-full p-3 rounded-xl border border-[var(--color-main)]/20 bg-[var(--color-bg)]"
                  value={simulation.quantity}
                  onChange={e => setSimulation({...simulation, quantity: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90 transition-opacity">
                {t('Run Simulation')}
              </button>
            </form>

            {simResult && (
              <div className="mt-6 pt-6 border-t border-[var(--color-main)]/20 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-text)]/60">{t('Base Price')}:</span>
                  <span className="font-mono line-through">{formatCurrency(simResult.basePrice)}</span>
                </div>
                
                {simResult.appliedRules.length > 0 && (
                  <div>
                    <span className="text-xs text-[var(--color-main)] font-bold uppercase tracking-wider">{t('Rules Applied')}:</span>
                    <ul className="mt-1 space-y-1">
                      {simResult.appliedRules.map((r, i) => (
                        <li key={i} className="text-sm bg-[var(--color-main)]/10 px-2 py-1 rounded inline-block mr-2 mb-1">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold">{t('Final Price')}:</span>
                  <span className="text-2xl font-bold text-[var(--color-main)]">{formatCurrency(simResult.finalPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={t('Create Dynamic Rule')}
        helpText="Create a dynamic pricing rule. For example, give a 10% discount if the order quantity is greater than 100 bags."
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Rule Name')}</label>
            <input 
              type="text" required placeholder={t('e.g., Bulk Discount for Flour')}
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.rule_name}
              onChange={e => setForm({...form, rule_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Target Product (Optional)')}</label>
            <select 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.product_id}
              onChange={e => setForm({...form, product_id: e.target.value})}
            >
              <option value="">{t('All Products')}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Condition Type')}</label>
              <select 
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={form.condition_type}
                onChange={e => setForm({...form, condition_type: e.target.value})}
              >
                <option value="quantity_above">{t('Quantity Above (>X)')}</option>
                <option value="customer_tier">{t('Customer Tier')}</option>
                <option value="season">{t('Season/Event')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Condition Value')}</label>
              <input 
                type="text" required placeholder={t('e.g., 50 or VIP')}
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={form.condition_value}
                onChange={e => setForm({...form, condition_value: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Adjustment Type')}</label>
              <select 
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={form.adjustment_type}
                onChange={e => setForm({...form, adjustment_type: e.target.value})}
              >
                <option value="percentage">{t('Percentage (%)')}</option>
                <option value="fixed_amount">{t('Fixed Amount (USD)')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Adjustment Value')}</label>
              <input 
                type="number" step="0.01" required placeholder={t('e.g., -10 for discount')}
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={form.adjustment_value}
                onChange={e => setForm({...form, adjustment_value: e.target.value})}
              />
              <p className="text-xs text-[var(--color-text)]/50 mt-1">{t('Use negative numbers for discounts.')}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
              {t('Cancel')}
            </button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90">
              {t('Save Rule')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
