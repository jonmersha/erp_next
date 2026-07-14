import React from 'react';
import { ProcurementPlan, RawMaterial, Product, Factory } from '../../types';
import Modal from '../Modal';
import { Edit, Trash2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plan: ProcurementPlan;
  material: RawMaterial | undefined;
  factory: Factory | undefined;
  onSuccess: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProcurementPlanDetailsModal: React.FC<Props> = ({ isOpen, onClose, plan, material, factory, onSuccess, onEdit, onDelete }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Details: ${material?.name || 'Raw Material'}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {factory && <p><span className="font-bold">Factory:</span> {factory.name}</p>}
          <p><span className="font-bold">Total Quantity:</span> {(plan.totalQuantity || 0).toLocaleString()}</p>
          <p><span className="font-bold">Status:</span> <span className="capitalize">{plan.status}</span></p>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <h4 className="font-bold text-lg">Hierarchical Plan</h4>
        </div>
        {(plan.quarterlyPlans || []).map(q => (
          <div key={q.quarter} className="border-b border-black/20 pb-2">
            <p className="font-bold">{q.quarter}: {(q.quantity || 0).toLocaleString()} units</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(q.monthlyPlans || []).map(m => (
                <p key={m.month}>Month {m.month}: {(m.quantity || 0).toLocaleString()} units</p>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end space-x-3 mt-8 border-t border-black/20 pt-4">
          <button 
            onClick={() => { onEdit(); }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[var(--color-main)] text-white hover:bg-[var(--color-main)]/90"
          >
            <Edit size={16} />
            <span>Edit Plan</span>
          </button>
          {plan.status !== 'approved' && (
            <button 
              onClick={() => { onClose(); onDelete(); }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              <Trash2 size={16} />
              <span>Delete Plan</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProcurementPlanDetailsModal;
