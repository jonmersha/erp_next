import React from 'react';
import { ProcurementPlan, RawMaterial, Product, Factory } from '../types';
import Modal from './Modal';
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
        {plan.status === 'rejected' && plan.rejection_reason && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
            <div className="p-1 bg-red-500/20 text-red-500 rounded-lg mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div>
              <h4 className="text-red-500 font-bold text-sm">Plan Rejected</h4>
              <p className="text-red-500/80 text-sm mt-1">{plan.rejection_reason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
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
