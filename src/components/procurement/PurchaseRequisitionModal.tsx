import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertCircle } from 'lucide-react';
import { RawMaterial } from '../../types';
import { createPurchaseRequisition } from '../../services/procurementService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface PRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: any[];
  materials: RawMaterial[];
}

const PurchaseRequisitionModal: React.FC<PRModalProps> = ({ isOpen, onClose, onSuccess, departments, materials }) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    department_id: '',
    item_id: '',
    item_name: '',
    quantity: '',
    required_date: '',
    budget_code: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const material = materials.find(m => m.id === formData.item_id);
      await createPurchaseRequisition({
        ...formData,
        item_name: material?.name || formData.item_name
      }, profile);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create requisition');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }} 
          animate={{ scale: 1, y: 0 }} 
          exit={{ scale: 0.95, y: 20 }} 
          className="w-full max-w-2xl bg-[var(--color-bg)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-text)]/10"
        >
          <div className="flex justify-between items-center p-6 border-b border-[var(--color-text)]/10">
            <h2 className="text-2xl font-serif font-bold text-[var(--color-main)]">{t('New Purchase Requisition')}</h2>
            <button onClick={onClose} className="p-2 text-[var(--color-text)]/40 hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Department')} *</label>
                <select 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all"
                  value={formData.department_id}
                  onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                  required
                >
                  <option value="">{t('Select Department')}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Required Date')} *</label>
                <input 
                  type="date" 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all"
                  value={formData.required_date}
                  onChange={e => setFormData({ ...formData, required_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Material / Item')} *</label>
                <select 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all"
                  value={formData.item_id}
                  onChange={e => setFormData({ ...formData, item_id: e.target.value })}
                  required
                >
                  <option value="">{t('Select Item')}</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Quantity')} *</label>
                <input 
                  type="number" 
                  min="0.01" step="0.01"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Budget Code')}</label>
                <input 
                  type="text" 
                  placeholder="e.g. BDG-2026-IT"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all"
                  value={formData.budget_code}
                  onChange={e => setFormData({ ...formData, budget_code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Justification / Notes')}</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all min-h-[100px]"
                placeholder={t('Explain the business need...')}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-[var(--color-text)]/10">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-all"
              >
                {t('Cancel')}
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-main)]/20 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                <Send size={18} />
                <span>{loading ? t('Submitting...') : t('Submit Requisition')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PurchaseRequisitionModal;
