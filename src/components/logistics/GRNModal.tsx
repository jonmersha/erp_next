import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileCheck, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createGoodsReceiptNote } from '../../services/logisticsService';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/apiService';

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrders: any[];
}

const GRNModal: React.FC<GRNModalProps> = ({ isOpen, onClose, onSuccess, purchaseOrders }) => {
  const { t } = useTranslation();
  const { profile, company } = useAuth();
  
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    warehouseId: '',
    receiptDate: new Date().toISOString().slice(0, 16)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && profile?.companyId) {
      apiService.get(`warehouses?companyId=${profile.companyId}`).then(data => {
        if (Array.isArray(data)) setWarehouses(data);
      }).catch(console.error);
    }
  }, [isOpen, profile?.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createGoodsReceiptNote(formData, profile);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create GRN', error);
      alert('Failed to generate GRN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedPOs = purchaseOrders.filter(po => po.status === 'approved' || po.status === 'shipped');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--color-bg)] rounded-3xl shadow-2xl z-50 overflow-hidden border border-[var(--color-text)]/10"
          >
            <div className="p-6 border-b border-[var(--color-text)]/10 flex justify-between items-center bg-[var(--color-surface)]">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl">
                  <FileCheck size={24} />
                </div>
                <h2 className="text-xl font-bold">{t('Generate GRN')}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--color-text)]/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/70 mb-2">{t('Select Purchase Order')}</label>
                  <select 
                    required
                    value={formData.purchaseOrderId}
                    onChange={e => setFormData({...formData, purchaseOrderId: e.target.value})}
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 focus:border-[var(--color-main)] transition-all"
                  >
                    <option value="">Select PO...</option>
                    {approvedPOs.map(po => (
                      <option key={po.id} value={po.id}>PO-{po.id.slice(0,8)} (Total: {po.total_amount})</option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--color-text)]/40 mt-1">
                    This will receive all items listed on the approved PO into inventory.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/70 mb-2">{t('Receiving Warehouse')}</label>
                  <select 
                    required
                    value={formData.warehouseId}
                    onChange={e => setFormData({...formData, warehouseId: e.target.value})}
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 focus:border-[var(--color-main)] transition-all"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--color-text)]/70 mb-2">{t('Receipt Date')}</label>
                  <input 
                    type="datetime-local"
                    required
                    value={formData.receiptDate}
                    onChange={e => setFormData({...formData, receiptDate: e.target.value})}
                    className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 focus:border-[var(--color-main)] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-text)]/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 rounded-xl transition-all"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[var(--color-main)] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Package size={18} />
                  <span>{isSubmitting ? t('Generating...') : t('Receive Goods')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GRNModal;
