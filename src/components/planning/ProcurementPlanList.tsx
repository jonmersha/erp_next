import React, { useState, useEffect } from 'react';
import { ProcurementPlan, Warehouse, RawMaterial, Factory, Product } from '../../types';
import { getProcurementPlans, deleteProcurementPlan } from '../../services/planningService';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Plus, Info } from 'lucide-react';
import ProcurementPlanModal from './ProcurementPlanModal';
import ProcurementPlanDetailsModal from './ProcurementPlanDetailsModal';

interface Props {
  warehouses: Warehouse[];
  materials: RawMaterial[];
  factories: Factory[];
}

const ProcurementPlanList: React.FC<Props> = ({ warehouses, materials, factories }) => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<ProcurementPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProcurementPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<ProcurementPlan | null>(null);

  const fetchPlans = () => {
    if (profile?.companyId) {
      setLoading(true);
      getProcurementPlans(profile.companyId)
        .then(setPlans)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [profile, warehouses.length, materials.length]);

  const handleDelete = async () => {
    if (planToDelete) {
      try {
        await deleteProcurementPlan(planToDelete.id);
        setPlanToDelete(null);
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4 text-[var(--color-text)]">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Procurement Plans</h3>
        <button 
          onClick={() => { setSelectedPlan(null); setIsModalOpen(true); }}
          className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl"
        >
          <Plus size={16} />
          <span>New Plan</span>
        </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[var(--color-text)]/40 text-sm">
            <th className="pb-2">Factory</th>
            <th className="pb-2">Warehouse</th>
            <th className="pb-2">Raw Material</th>
            <th className="pb-2">Year</th>
            <th className="pb-2">Total Quantity</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => (
            <tr 
              key={plan.id} 
              className="border-t border-[var(--color-text)]/5 cursor-pointer hover:bg-[var(--color-text)]/5"
              onClick={() => setSelectedPlan(plan)}
            >
              <td className="py-3">{factories.find(f => f.id === plan.factoryId)?.name || plan.factoryId || '-'}</td>
              <td className="py-3">{warehouses.find(w => w.id === plan.warehouseId)?.name || plan.warehouseId || '-'}</td>
              <td className="py-3">
                {materials.find(m => m.id === plan.materialId)?.name || plan.materialId || '-'}
              </td>
              <td className="py-3">{plan.year}</td>
              <td className="py-3">{(plan.totalQuantity || 0).toLocaleString()}</td>
              <td className="py-3 capitalize">{plan.status}</td>
              <td className="py-3 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setSelectedPlan(plan)}
                  className="text-[var(--color-main)] hover:text-[var(--color-main)]/80"
                  title="View Details"
                >
                  <Info size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ProcurementPlanModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedPlan(null); }} 
        warehouses={warehouses}
        materials={materials}
        factories={factories}
        onSuccess={fetchPlans}
        plan={selectedPlan || undefined}
      />
      {selectedPlan && !isModalOpen && (
        <ProcurementPlanDetailsModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
          material={materials.find(m => m.id === selectedPlan.materialId)}
          factory={factories.find(f => f.id === selectedPlan.factoryId)}
          onSuccess={fetchPlans}
          onEdit={() => { setIsModalOpen(true); }}
          onDelete={() => { setPlanToDelete(selectedPlan); setSelectedPlan(null); }}
        />
      )}

      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-[var(--color-text)]">Delete Plan</h3>
            <p className="text-[var(--color-text)]/70 mb-6">Are you sure you want to delete this procurement plan? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2 rounded-xl text-[var(--color-text)]/70 hover:bg-[var(--color-text)]/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementPlanList;
