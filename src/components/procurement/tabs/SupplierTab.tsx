import React from 'react';
import { motion } from 'motion/react';
import { Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import Badge from '../../common/Badge';

interface SupplierTabProps {
  filteredSuppliers: any[];
  profile: any;
  handleApproveSupplier: (id: string) => Promise<void>;
  setSelectedSupplier: (supplier: any) => void;
  setIsSupplierModalOpen: (isOpen: boolean) => void;
  handleDeleteSupplier: (id: string) => Promise<void>;
}

export default function SupplierTab({
  filteredSuppliers,
  profile,
  handleApproveSupplier,
  setSelectedSupplier,
  setIsSupplierModalOpen,
  handleDeleteSupplier
}: SupplierTabProps) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
          <th className="px-8 py-4">Supplier</th>
          <th className="px-8 py-4">Contact</th>
          <th className="px-8 py-4">Status</th>
          <th className="px-8 py-4"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--color-text)]/5">
        {filteredSuppliers.map((supplier) => (
          <motion.tr 
            key={supplier.id} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hover:bg-[var(--color-text)]/[0.02] transition-colors group"
          >
            <td className="px-8 py-4 font-bold text-sm text-[var(--color-text)]">
              {supplier.name}
              {supplier.certificate_url && (
                <a href={supplier.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-main)] block font-normal hover:underline mt-1">
                  View License
                </a>
              )}
            </td>
            <td className="px-8 py-4 text-sm text-[var(--color-text)]/60">
              <div>{supplier.contact}</div>
              <div className="text-xs mt-1">{supplier.email || 'N/A'}</div>
            </td>
            <td className="px-8 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={supplier.status === 'active' ? 'success' : supplier.status === 'pending_approval' ? 'warning' : 'neutral'}>
                  {supplier.status === 'active' ? 'Active' : supplier.status === 'pending_approval' ? 'Pending' : 'Inactive'}
                </Badge>
                {supplier.is_authorized && <Badge variant="warning">Authorized</Badge>}
              </div>
            </td>
            <td className="px-8 py-4 text-right flex justify-end space-x-2">
              {supplier.status === 'pending_approval' && profile?.uid !== (supplier.createdBy || supplier.created_by) && ['admin', 'factory_manager'].includes(profile?.role || '') && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleApproveSupplier(supplier.id); }}
                  className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg transition-all"
                  title="Approve Supplier"
                >
                  <CheckCircle2 size={18} />
                </button>
              )}
              <button 
                onClick={() => { setSelectedSupplier(supplier); setIsSupplierModalOpen(true); }}
                className="p-2 text-[var(--color-text)]/20 hover:text-[var(--color-main)] hover:bg-[var(--color-main)]/5 rounded-lg transition-all"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDeleteSupplier(supplier.id)}
                className="p-2 text-[var(--color-text)]/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
