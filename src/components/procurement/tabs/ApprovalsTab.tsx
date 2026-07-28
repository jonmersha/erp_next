import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, X, Info } from 'lucide-react';
import Badge from '../../common/Badge';

interface ApprovalItem {
  type: string;
  id: string;
  label: string;
  createdBy: string;
  date: string;
  data: any;
}

interface ApprovalsTabProps {
  pendingApprovals: ApprovalItem[];
  profile: any;
  can: (action: string, subject: string) => boolean;
  handleApproveSupplier: (id: string) => Promise<void>;
  handleApprovePO: (id: string) => Promise<void>;
  handleApprovePR: (id: string) => Promise<void>;
  handleRejectPR: (id: string) => Promise<void>;
}

export default function ApprovalsTab({
  pendingApprovals,
  profile,
  can,
  handleApproveSupplier,
  handleApprovePO,
  handleApprovePR,
  handleRejectPR
}: ApprovalsTabProps) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
          <th className="px-8 py-4">Type</th>
          <th className="px-8 py-4">Reference</th>
          <th className="px-8 py-4">Details</th>
          <th className="px-8 py-4">Date</th>
          <th className="px-8 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--color-text)]/5">
        {pendingApprovals.map((item) => {
          const isCreator = profile?.uid === item.createdBy;
          const canApprove = can('approve', 'procurement');

          return (
            <motion.tr 
              key={`${item.type}-${item.id}`} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hover:bg-[var(--color-text)]/[0.02] transition-colors group"
            >
              <td className="px-8 py-4 font-bold text-sm text-[var(--color-text)]">
                <Badge variant="warning">{item.type}</Badge>
              </td>
              <td className="px-8 py-4">
                <p className="text-xs font-mono font-bold text-[var(--color-main)]">#{item.id?.slice(0, 8)}</p>
              </td>
              <td className="px-8 py-4">
                <p className="font-bold text-[var(--color-text)] text-sm">{item.label}</p>
                {isCreator && (
                  <p className="text-[10px] text-amber-500 mt-1 flex items-center">
                    <Info size={12} className="mr-1" /> Maker-Checker: You created this item.
                  </p>
                )}
              </td>
              <td className="px-8 py-4 text-xs text-[var(--color-text)]/40">
                {new Date(item.date).toLocaleDateString()}
              </td>
              <td className="px-8 py-4 text-right flex justify-end space-x-2">
                {canApprove && (
                  <>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (isCreator) return;
                        if (item.type === 'Supplier') handleApproveSupplier(item.id);
                        else if (item.type === 'Order') handleApprovePO(item.id);
                        else handleApprovePR(item.id);
                      }}
                      disabled={isCreator}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 ${
                        isCreator 
                          ? 'bg-gray-500/10 text-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white'
                      }`}
                      title={isCreator ? "Maker cannot approve their own request" : `Approve ${item.type}`}
                    >
                      <CheckCircle2 size={16} /> <span>Approve</span>
                    </button>
                    {item.type === 'Requisition' && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isCreator) return;
                          handleRejectPR(item.id); 
                        }}
                        disabled={isCreator}
                        className={`p-1.5 rounded-lg transition-all ${
                          isCreator
                            ? 'bg-gray-500/10 text-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white'
                        }`}
                        title={isCreator ? "Maker cannot reject their own request" : "Reject"}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </>
                )}
              </td>
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  );
}
