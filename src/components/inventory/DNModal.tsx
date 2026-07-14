import React from 'react';
import Modal from '../Modal';
import { SalesOrder, Warehouse } from '../../types';

interface DNModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSO: SalesOrder | null;
  setSelectedSO: (so: SalesOrder | null) => void;
  pendingSOs: SalesOrder[];
  warehouses: Warehouse[];
  dnForm: { warehouseId: string; notes: string };
  setDnForm: (form: { warehouseId: string; notes: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

const DNModal: React.FC<DNModalProps> = ({
  isOpen,
  onClose,
  selectedSO,
  setSelectedSO,
  pendingSOs,
  warehouses,
  dnForm,
  setDnForm,
  onSubmit,
  submitting
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delivery Note (Dispatch)">
      <form onSubmit={onSubmit} className="space-y-6">
        {!selectedSO ? (
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Select Sales Order</label>
            <select 
              required
              value={selectedSO?.id || ''}
              onChange={e => setSelectedSO(pendingSOs.find(so => so.id === e.target.value) || null)}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            >
              <option value="">Select Paid SO</option>
              {(pendingSOs || []).map(so => (
                <option key={so.id} value={so.id}>#{so.id?.slice(0, 8)} - {so.outletName || 'Unknown Outlet'}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative">
            <button 
              type="button"
              onClick={() => setSelectedSO(null)}
              className="absolute top-2 right-2 text-indigo-600 hover:text-indigo-800 text-xs font-bold"
            >
              Change SO
            </button>
            <p className="text-sm text-indigo-800 font-medium">Dispatching SO #{selectedSO.id?.slice(0, 8)}</p>
            <div className="mt-2 space-y-1">
              {(selectedSO.items || []).map((item, i) => (
                <p key={i} className="text-xs text-indigo-700">• {item.productName || 'Unknown Product'}: <span className="font-bold">{item.quantity || 0}</span></p>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Dispatch From Warehouse</label>
          <select 
            required
            value={dnForm.warehouseId}
            onChange={e => setDnForm({ ...dnForm, warehouseId: e.target.value })}
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
            value={dnForm.notes}
            onChange={e => setDnForm({ ...dnForm, notes: e.target.value })}
            className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 h-24 resize-none text-[var(--color-text)]"
            placeholder="Shipping details, carrier info, etc..."
          />
        </div>
        <button 
          disabled={submitting || !selectedSO || !dnForm.warehouseId}
          type="submit"
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {submitting ? 'Processing...' : 'Confirm Shipment'}
        </button>
      </form>
    </Modal>
  );
};

export default DNModal;
