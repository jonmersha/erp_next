import React from 'react';
import { Package, Clock, ArrowUpRight } from 'lucide-react';
import { SalesOrder } from '../../types';
import { useTranslation } from 'react-i18next';

interface OutgoingGoodsProps {
  pendingSOs: SalesOrder[];
  onShip: (so: SalesOrder) => void;
}

const OutgoingGoods: React.FC<OutgoingGoodsProps> = ({ pendingSOs, onShip }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
      <div className="p-6 border-b border-[var(--color-text)]/20">
        <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Pending Shipments</h3>
      </div>
      <div className="divide-y divide-[var(--color-text)]/5">
        {(pendingSOs?.length || 0) === 0 ? (
          <div className="p-12 text-center text-[var(--color-text)]/30 italic">No pending sales orders to ship</div>
        ) : (
          pendingSOs.map(so => (
            <div key={so.id} className="p-6 hover:bg-[var(--color-text)]/[0.02] transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-[var(--color-main)]">SO #{so.id?.slice(0, 8)}</p>
                  <h4 className="font-bold text-[var(--color-text)]">{so.outletName || 'Unknown Outlet'}</h4>
                  <p className="text-xs text-[var(--color-text)]/40 flex items-center mt-1">
                    <Clock size={12} className="mr-1" />
                    {so.createdAt ? new Date(so.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Items</p>
                  <p className="font-bold text-[var(--color-text)]">{so.items?.length || 0} types</p>
                </div>
                <button 
                  onClick={() => onShip(so)}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  <ArrowUpRight size={16} />
                  <span>{t('Ship Items')}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OutgoingGoods;
