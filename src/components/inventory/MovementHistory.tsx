import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { GRN, DeliveryNote, RawMaterial, Product } from '../../types';

interface MovementHistoryProps {
  grns: GRN[];
  deliveryNotes: DeliveryNote[];
  materials: RawMaterial[];
  products: Product[];
  getUnitName: (id: string) => string;
}

const MovementHistory: React.FC<MovementHistoryProps> = ({
  grns,
  deliveryNotes,
  materials,
  products,
  getUnitName
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
          <div className="p-6 border-b border-[var(--color-text)]/20 flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Recent Receipts (GRNs)</h3>
            <ArrowDownLeft size={20} className="text-emerald-600" />
          </div>
          <div className="divide-y divide-[var(--color-text)]/5 max-h-[600px] overflow-y-auto">
            {(grns?.length || 0) === 0 ? (
              <div className="p-12 text-center text-[var(--color-text)]/30 italic">No receipt history</div>
            ) : (
              grns.map(grn => (
                <div key={grn.id} className="p-4 hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-mono font-bold text-[var(--color-main)]">GRN #{grn.id?.slice(0, 8)}</p>
                      <p className="text-sm font-bold text-[var(--color-text)]">{getUnitName(grn.warehouseId)}</p>
                    </div>
                    <span className="text-[10px] text-[var(--color-text)]/40">{grn.receivedAt ? new Date(grn.receivedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    {grn.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-[var(--color-text)]/60">{materials.find(m => m.id === item.itemId)?.name || 'Unknown Item'}</span>
                        <span className="font-bold text-emerald-600">+{item.quantityReceived}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
          <div className="p-6 border-b border-[var(--color-text)]/20 flex justify-between items-center">
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Recent Shipments (DNs)</h3>
            <ArrowUpRight size={20} className="text-indigo-600" />
          </div>
          <div className="divide-y divide-[var(--color-text)]/5 max-h-[600px] overflow-y-auto">
            {(deliveryNotes?.length || 0) === 0 ? (
              <div className="p-12 text-center text-[var(--color-text)]/30 italic">No shipment history</div>
            ) : (
              deliveryNotes.map(dn => (
                <div key={dn.id} className="p-4 hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-mono font-bold text-[var(--color-main)]">DN #{dn.id?.slice(0, 8)}</p>
                      <p className="text-sm font-bold text-[var(--color-text)]">{getUnitName(dn.warehouseId)}</p>
                    </div>
                    <span className="text-[10px] text-[var(--color-text)]/40">{dn.shippedAt ? new Date(dn.shippedAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    {dn.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-[var(--color-text)]/60">{products.find(p => p.id === item.productId)?.name || 'Unknown Product'}</span>
                        <span className="font-bold text-indigo-600">-{item.quantityShipped}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementHistory;
