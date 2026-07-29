import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PurchaseOrder } from '../types';
import { createWeighbridgeLog, updateWeighbridgeLogOut } from '../services/logisticsService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrders: PurchaseOrder[];
  log?: any;                    // If provided, it's an update (Exit Weight)
  defaultReferenceId?: string;  // When set, locks reference type = PO and reference ID to this value
  totalOrderedQty?: number;     // Total KG ordered on the PO
  totalReceivedWeight?: number; // KG already received across all previous loads
}

const WeighbridgeModal: React.FC<Props> = ({
  isOpen, onClose, onSuccess,
  purchaseOrders, log,
  defaultReferenceId,
  totalOrderedQty = 0,
  totalReceivedWeight = 0
}) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    reference_type: 'PO',
    reference_id: log?.reference_id || defaultReferenceId || '',
    truck_plate: log?.truck_plate || '',
    driver_name: log?.driver_name || '',
    gross_weight: log?.gross_weight || '',
    tare_weight: log?.tare_weight || ''
  });

  // Sync form when defaultReferenceId changes (e.g. tracker re-opens)
  useEffect(() => {
    if (defaultReferenceId) {
      setForm(f => ({ ...f, reference_type: 'PO', reference_id: defaultReferenceId }));
    }
  }, [defaultReferenceId]);

  const remainingQty = Math.max(0, totalOrderedQty - totalReceivedWeight);
  const isFromTracker = Boolean(defaultReferenceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (log) {
        const gross = Number(log.gross_weight);
        const tare = Number(form.tare_weight);
        const net = gross - tare;
        await updateWeighbridgeLogOut(log.id, { tare_weight: tare, net_weight: net });
      } else {
        await createWeighbridgeLog(form, profile);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save weighbridge log');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const progressPercent = totalOrderedQty > 0
    ? Math.min(100, (totalReceivedWeight / totalOrderedQty) * 100)
    : 0;

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
          className="w-full max-w-lg bg-[var(--color-bg)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-text)]/10"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[var(--color-text)]/10">
            <h2 className="text-2xl font-serif font-bold text-[var(--color-main)] flex items-center gap-2">
              <Scale size={24} />
              {log ? t('Log Exit (Tare Weight)') : t('Log Entry (Gross Weight)')}
            </h2>
            <button onClick={onClose} className="p-2 text-[var(--color-text)]/40 hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                <AlertCircle size={16} />
                <p>{error}</p>
              </div>
            )}

            {!log ? (
              <>
                {/* ── Locked Reference Banner (from lifecycle tracker) ── */}
                {isFromTracker ? (
                  <div className="rounded-2xl border border-[var(--color-main)]/20 bg-[var(--color-main)]/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-main)]/70">Reference</p>
                        <p className="text-sm font-bold text-[var(--color-text)] mt-0.5">
                          Purchase Order &nbsp;
                          <span className="font-mono bg-[var(--color-text)]/5 px-1.5 py-0.5 rounded text-xs">
                            #{defaultReferenceId!.substring(0, 8)}
                          </span>
                        </p>
                      </div>
                      <CheckCircle2 size={20} className="text-[var(--color-main)]" />
                    </div>

                    {totalOrderedQty > 0 && (
                      <>
                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-[var(--color-text)]/60">
                            <span>Received: <strong className="text-[var(--color-text)]">{totalReceivedWeight.toLocaleString()} KG</strong></span>
                            <span>Ordered: <strong className="text-[var(--color-text)]">{totalOrderedQty.toLocaleString()} KG</strong></span>
                          </div>
                          <div className="w-full h-2 bg-[var(--color-text)]/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-main)] rounded-full transition-all duration-700"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text)]/60">
                            Remaining to receive:
                          </span>
                          <span className={`font-bold ${remainingQty <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {remainingQty <= 0 ? 'Fully received ✓' : `${remainingQty.toLocaleString()} KG`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* ── Manual Reference Selection (standalone mode) ── */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Reference Type')}</label>
                      <select
                        className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                        value={form.reference_type}
                        onChange={e => setForm({ ...form, reference_type: e.target.value })}
                        required
                      >
                        <option value="PO">Purchase Order</option>
                        <option value="SO">Sales Order</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Reference ID')}</label>
                      <select
                        className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                        value={form.reference_id}
                        onChange={e => setForm({ ...form, reference_id: e.target.value })}
                      >
                        <option value="">{t('Select PO (Optional)')}</option>
                        {purchaseOrders.filter(po => po.status !== 'received').map(po => (
                          <option key={po.id} value={po.id}>
                            #{po.id.slice(0, 8)} – {po.supplierName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Truck & Driver */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Truck Plate')} *</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 uppercase"
                      value={form.truck_plate}
                      onChange={e => setForm({ ...form, truck_plate: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Driver Name')}</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20"
                      value={form.driver_name}
                      onChange={e => setForm({ ...form, driver_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Gross Weight */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--color-text)]/70">
                    {t('Gross Weight (KG)')} *
                    {isFromTracker && remainingQty > 0 && (
                      <span className="ml-2 text-xs font-normal text-amber-600">
                        (max remaining: {remainingQty.toLocaleString()} KG net)
                      </span>
                    )}
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 font-mono text-lg"
                    value={form.gross_weight}
                    onChange={e => setForm({ ...form, gross_weight: e.target.value })}
                    required
                  />
                  <p className="text-xs text-[var(--color-text)]/40">{t('Total weight of truck + cargo upon entry.')}</p>
                </div>
              </>
            ) : (
              /* ── Exit / Tare Weight mode ── */
              <div className="space-y-4">
                <div className="p-4 bg-[var(--color-text)]/5 rounded-xl space-y-2">
                  <p className="text-sm text-[var(--color-text)]/60">Truck Plate: <strong className="text-[var(--color-text)]">{log.truck_plate}</strong></p>
                  <p className="text-sm text-[var(--color-text)]/60">Gross Weight: <strong className="text-[var(--color-text)]">{log.gross_weight} KG</strong></p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--color-text)]/70">{t('Tare Weight (KG)')} *</label>
                  <input
                    type="number" step="0.01" min="0" max={log.gross_weight}
                    className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 font-mono text-lg"
                    value={form.tare_weight}
                    onChange={e => setForm({ ...form, tare_weight: e.target.value })}
                    required
                  />
                  <p className="text-xs text-[var(--color-text)]/40">{t('Weight of the empty truck upon exit.')}</p>
                </div>
                {form.tare_weight && (
                  <div className="p-4 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl text-center">
                    <p className="text-sm font-bold uppercase tracking-widest opacity-80">{t('Net Weight (Calculated)')}</p>
                    <p className="text-3xl font-serif font-bold mt-1">
                      {(Number(log.gross_weight) - Number(form.tare_weight)).toFixed(2)} KG
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex justify-end space-x-3 border-t border-[var(--color-text)]/10">
              <button type="button" onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-all">
                {t('Cancel')}
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-main)]/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                <span>{loading ? t('Saving...') : t('Save Record')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeighbridgeModal;
