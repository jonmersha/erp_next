import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Edit2 } from 'lucide-react';
import Badge from '../../common/Badge';

interface PurchaseOrderTabProps {
  filteredOrders: any[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  setSelectedPO?: (po: any) => void;
  setIsPOModalOpen?: (isOpen: boolean) => void;
  onSubmitPO?: (id: string) => void;
  currentUserId?: string;
  onTrack?: (po: any) => void;
}

export default function PurchaseOrderTab({
  filteredOrders,
  getStatusColor,
  getStatusIcon,
  setSelectedPO,
  setIsPOModalOpen,
  onSubmitPO,
  currentUserId,
  onTrack
}: PurchaseOrderTabProps) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
          <th className="px-8 py-4">PO Number</th>
          <th className="px-8 py-4">Supplier</th>
          <th className="px-8 py-4">Items</th>
          <th className="px-8 py-4">Total Amount</th>
          <th className="px-8 py-4">Status</th>
          <th className="px-8 py-4"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--color-text)]/5">
        {filteredOrders.map((order) => (
          <motion.tr 
            key={order.id} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hover:bg-[var(--color-text)]/[0.02] transition-colors group cursor-pointer"
            onClick={() => { setSelectedPO?.(order); setIsPOModalOpen?.(true); }}
          >
            <td className="px-8 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg flex items-center justify-center">
                  <ShoppingCart size={14} />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-[var(--color-text)]">#{order.id?.slice(0, 8)}</div>
                  <div className="text-xs text-[var(--color-text)]/40 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </td>
            <td className="px-8 py-4 font-bold text-sm text-[var(--color-text)]">
              {order.supplierName}
            </td>
            <td className="px-8 py-4 text-sm text-[var(--color-text)]/60">
              {order.items?.length || 0} items
            </td>
            <td className="px-8 py-4 font-mono text-sm text-[var(--color-text)]">
              ${Number(order.totalAmount || 0).toLocaleString()}
            </td>
            <td className="px-8 py-4">
              <Badge variant={getStatusColor(order.status) as any}>
                <span className="flex items-center space-x-1.5">
                  {getStatusIcon(order.status)}
                  <span>{order.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                </span>
              </Badge>
            </td>
            <td className="px-8 py-4 text-right flex items-center justify-end space-x-2">
              {onTrack && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onTrack(order); }}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors"
                  title="Track Lifecycle"
                >
                  Track
                </button>
              )}
              {order.status === 'pending' && onSubmitPO && order.createdBy === currentUserId && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onSubmitPO(order.id); }}
                  className="px-3 py-1.5 bg-[var(--color-main)]/10 text-[var(--color-main)] text-xs font-bold rounded-lg hover:bg-[var(--color-main)]/20 transition-colors"
                  title="Submit for Approval"
                >
                  Submit
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedPO?.(order); setIsPOModalOpen?.(true); }}
                className="p-2 text-[var(--color-text)]/20 hover:text-[var(--color-main)] hover:bg-[var(--color-main)]/5 rounded-lg transition-all"
                title="Edit / View Details"
              >
                <Edit2 size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
