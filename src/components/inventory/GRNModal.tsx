import React from 'react';
import Modal from '../Modal';
import { PurchaseOrder, Warehouse } from '../../types';

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPO: PurchaseOrder | null;
  setSelectedPO: (po: PurchaseOrder | null) => void;
  pendingPOs: PurchaseOrder[];
  warehouses: Warehouse[];
  grnForm: { warehouseId: string; notes: string };
  setGrnForm: (form: { warehouseId: string; notes: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

const GRNModal: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  selectedPO,
  setSelectedPO,
  pendingPOs,
  warehouses,
  grnForm,
  setGrnForm,
  onSubmit,
  submitting
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Goods Receiving Note (GRN)">
      <form onSubmit={onSubmit} className="space-y-6">
        {!selectedPO ? (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Select Purchase Order</label>
            <select 
              required
              value={selectedPO?.id || ''}
              onChange={e => setSelectedPO(pendingPOs.find(po => po.id === e.target.value) || null)}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            >
              <option value="">Select Approved PO</option>
              {(pendingPOs || []).map(po => (
                <option key={po.id} value={po.id}>#{po.id?.slice(0, 8)} - {po.supplierName || 'Unknown Supplier'}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 relative">
            <button 
              type="button"
              onClick={() => setSelectedPO(null)}
              className="absolute top-2 right-2 text-emerald-600 hover:text-emerald-800 text-xs font-bold"
            >
              Change PO
            </button>
            <p className="text-sm text-emerald-800 font-medium">Receiving for PO #{selectedPO.id?.slice(0, 8)}</p>
            <div className="mt-2 space-y-1">
              {(selectedPO.items || []).map((item, i) => (
                <p key={i} className="text-xs text-emerald-700">• {item.itemName || 'Unknown Item'}: <span className="font-bold">{item.quantity || 0}</span></p>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Receiving Warehouse</label>
          <select 
            required
            value={grnForm.warehouseId}
            onChange={e => setGrnForm({ ...grnForm, warehouseId: e.target.value })}
            className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
          >
            <option value="">Select Warehouse</option>
            {(warehouses || []).map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Notes</label>
          <textarea 
            value={grnForm.notes}
            onChange={e => setGrnForm({ ...grnForm, notes: e.target.value })}
            className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 h-24 resize-none text-[var(--color-text)]"
            placeholder="Any observations about the received goods..."
          />
        </div>
        <button 
          disabled={submitting || !selectedPO || !grnForm.warehouseId}
          type="submit"
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
        >
          {submitting ? 'Processing...' : 'Confirm Receipt'}
        </button>
      </form>
    </Modal>
  );
};

export default GRNModal;
