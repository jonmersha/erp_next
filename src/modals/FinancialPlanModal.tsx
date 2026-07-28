import React, { useState } from 'react';
import { FinancialPlan } from '../types';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FinancialPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<FinancialPlan>) => Promise<void>;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  initialData?: FinancialPlan;
}

const FinancialPlanModal: React.FC<FinancialPlanModalProps> = ({
  isOpen, onClose, onSave, year, quarter, initialData
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<FinancialPlan>>(initialData || {
    year,
    quarter,
    targetRevenue: 0,
    targetExpense: 0
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text)]">
            {initialData ? t('Edit Financial Plan') : t('Create Financial Plan')} ({quarter} {year})
          </h3>
          <button onClick={onClose} className="text-[var(--color-text)]/50 hover:text-[var(--color-text)]">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">{t('Target Revenue')}</label>
            <input
              type="number"
              value={formData.targetRevenue || ''}
              onChange={(e) => setFormData({ ...formData, targetRevenue: Number(e.target.value) })}
              className="w-full p-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)]"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">{t('Target Expense')}</label>
            <input
              type="number"
              value={formData.targetExpense || ''}
              onChange={(e) => setFormData({ ...formData, targetExpense: Number(e.target.value) })}
              className="w-full p-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)]"
              required
              min="0"
            />
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--color-text)] bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)]/20"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[var(--color-main)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-main)]/20 disabled:opacity-50"
            >
              {submitting ? t('Saving...') : t('Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialPlanModal;
