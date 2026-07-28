import React from 'react';
import { motion } from 'motion/react';
import { FileText, MoreVertical } from 'lucide-react';
import Badge from '../../common/Badge';

interface PurchaseRequisitionTabProps {
  filteredRequisitions: any[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
}

export default function PurchaseRequisitionTab({
  filteredRequisitions,
  getStatusColor,
  getStatusIcon
}: PurchaseRequisitionTabProps) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
          <th className="px-8 py-4">PR Number</th>
          <th className="px-8 py-4">Department</th>
          <th className="px-8 py-4">Item Details</th>
          <th className="px-8 py-4">Required Date</th>
          <th className="px-8 py-4">Status</th>
          <th className="px-8 py-4"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--color-text)]/5">
        {filteredRequisitions.map((pr) => (
          <motion.tr 
            key={pr.id} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hover:bg-[var(--color-text)]/[0.02] transition-colors group"
          >
            <td className="px-8 py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                  <FileText size={14} />
                </div>
                <div>
                  <div className="font-mono font-bold text-sm text-[var(--color-text)]">#{pr.id?.slice(0, 8)}</div>
                  <div className="text-xs text-[var(--color-text)]/40 mt-0.5">{new Date(pr.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </td>
            <td className="px-8 py-4 font-bold text-sm text-[var(--color-text)]">
              {pr.departmentName}
            </td>
            <td className="px-8 py-4 text-sm text-[var(--color-text)]/60">
              <div className="font-medium text-[var(--color-text)]">{pr.item_name}</div>
              <div className="text-xs mt-1">Qty: {pr.quantity}</div>
            </td>
            <td className="px-8 py-4 text-sm font-medium text-[var(--color-text)]/60">
              {pr.required_date ? new Date(pr.required_date).toLocaleDateString() : 'N/A'}
            </td>
            <td className="px-8 py-4">
              <Badge variant={getStatusColor(pr.status) as any}>
                <span className="flex items-center space-x-1.5">
                  {getStatusIcon(pr.status)}
                  <span>{pr.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                </span>
              </Badge>
            </td>
            <td className="px-8 py-4 text-right">
              <button className="p-2 text-[var(--color-text)]/20 hover:text-[var(--color-main)] hover:bg-[var(--color-main)]/5 rounded-lg transition-all">
                <MoreVertical size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
