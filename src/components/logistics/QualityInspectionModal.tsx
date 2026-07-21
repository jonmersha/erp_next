import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TestTube, AlertCircle } from 'lucide-react';
import { WeighbridgeLog } from '../../types';
import { createQualityInspection } from '../../services/logisticsService';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  logs: WeighbridgeLog[];
}

const QualityInspectionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, logs }) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    weighbridge_log_id: '',
    moisture: '',
    protein: '',
    ash: '',
    gluten: '',
    status: 'Pending',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createQualityInspection(form, profile);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save quality inspection');
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
            <h2 className="text-2xl font-serif font-bold text-[var(--color-main)] flex items-center gap-2">
              <TestTube size={24} />
              {t('New Quality Inspection')}
            </h2>
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Select Inbound Load (Weighbridge Log)')} *</label>
              <select 
                className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                value={form.weighbridge_log_id}
                onChange={e => setForm({...form, weighbridge_log_id: e.target.value})}
                required
              >
                <option value="">{t('Select Truck / Load')}</option>
                {logs.filter(l => l.reference_type === 'PO').map(l => (
                  <option key={l.id} value={l.id}>
                    {l.truck_plate} - {new Date(l.entry_time).toLocaleString()} ({l.gross_weight} KG Gross)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Moisture %')}</label>
                <input 
                  type="number" step="0.01" min="0" max="100"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                  value={form.moisture}
                  onChange={e => setForm({...form, moisture: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Protein %')}</label>
                <input 
                  type="number" step="0.01" min="0" max="100"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                  value={form.protein}
                  onChange={e => setForm({...form, protein: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Ash %')}</label>
                <input 
                  type="number" step="0.01" min="0" max="100"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                  value={form.ash}
                  onChange={e => setForm({...form, ash: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Gluten %')}</label>
                <input 
                  type="number" step="0.01" min="0" max="100"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                  value={form.gluten}
                  onChange={e => setForm({...form, gluten: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Verdict / Status')} *</label>
                <select 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                  required
                >
                  <option value="Pending">Pending (Hold)</option>
                  <option value="Approved">Approved (Pass)</option>
                  <option value="Rejected">Rejected (Fail)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Lab Notes')}</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 min-h-[100px]"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder={t('Any observations or reasons for rejection...')}
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
                <span>{loading ? t('Saving...') : t('Save Inspection')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QualityInspectionModal;
