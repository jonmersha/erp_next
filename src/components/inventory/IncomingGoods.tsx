import React from 'react';
import { Truck, Clock, ArrowDownLeft } from 'lucide-react';
import { PurchaseOrder } from '../../types';

interface IncomingGoodsProps {
  pendingPOs: PurchaseOrder[];
  onReceive: (po: PurchaseOrder) => void;
}

const IncomingGoods: React.FC<IncomingGoodsProps> = ({ pendingPOs, onReceive }) => {
  return (
    <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
      <div className="p-6 border-b border-[var(--color-text)]/20">
        <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Pending Receipts</h3>
      </div>
      <div className="divide-y divide-[var(--color-text)]/5">
        {(pendingPOs?.length || 0) === 0 ? (
          <div className="p-12 text-center text-[var(--color-text)]/30 italic">No pending purchase orders to receive</div>
        ) : (
          pendingPOs.map(po => (
            <div key={po.id} className="p-6 hover:bg-[var(--color-text)]/[0.02] transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-[var(--color-main)]">PO #{po.id?.slice(0, 8)}</p>
                  <h4 className="font-bold text-[var(--color-text)]">{po.supplierName || 'Unknown Supplier'}</h4>
                  <p className="text-xs text-[var(--color-text)]/40 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Items</p>
                  <p className="font-bold text-[var(--color-text)]">{po.items?.length || 0} types</p>
                </div>
                <button 
                  onClick={() => onReceive(po)}
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  <ArrowDownLeft size={16} />
                  <span>Receive Items</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IncomingGoods;
