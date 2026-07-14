import React, { useState, useEffect } from 'react';
import { SalesPlan, Product, Factory } from '../../types';
import { getSalesPlans, deleteSalesPlan, approveSalesPlan } from '../../services/planningService';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Plus, Info, CheckCircle2 } from 'lucide-react';
import SalesPlanModal from './SalesPlanModal';
import SalesPlanDetailsModal from './SalesPlanDetailsModal';

interface Props {
  products: Product[];
  factories: Factory[];
}

const SalesPlanList: React.FC<Props> = ({ products, factories }) => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<SalesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SalesPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<SalesPlan | null>(null);

  const fetchPlans = () => {
    if (profile?.companyId) {
      setLoading(true);
      getSalesPlans(profile.companyId)
        .then(setPlans)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [profile, products.length, factories.length]);

  const handleDelete = async () => {
    if (planToDelete) {
      try {
        await deleteSalesPlan(planToDelete.id);
        setPlanToDelete(null);
        fetchPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const handleApprove = async (plan: SalesPlan) => {
    try {
      if (profile?.uid) {
        await approveSalesPlan(plan.id, profile.uid);
        fetchPlans();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve plan');
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4 text-[var(--color-text)]">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Sales Plans</h3>
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
            <th className="pb-2">Product</th>
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
              className="border-t border-[var(--color-text)]/20 cursor-pointer hover:bg-[var(--color-text)]/5"
              onClick={() => setSelectedPlan(plan)}
            >
              <td className="py-3">{factories.find(f => f.id === plan.factoryId)?.name || plan.factoryId}</td>
              <td className="py-3">{products.find(p => p.id === plan.productId)?.name || plan.productId}</td>
              <td className="py-3">{plan.year}</td>
              <td className="py-3">{(plan.totalQuantity || 0).toLocaleString()}</td>
              <td className="py-3 capitalize">{plan.status}</td>
              <td className="py-3 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                {plan.status === 'pending_approval' && profile?.uid !== plan.createdBy && ['admin', 'sales_manager'].includes(profile?.role || '') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleApprove(plan); }}
                    className="text-[var(--color-main)] hover:text-[var(--color-main)]/80"
                    title="Approve Plan"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
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
      <SalesPlanModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedPlan(null); }} 
        products={products}
        factories={factories}
        onSuccess={fetchPlans}
        plan={selectedPlan || undefined}
      />
      {selectedPlan && !isModalOpen && (
        <SalesPlanDetailsModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
          product={products.find(p => p.id === selectedPlan.productId)}
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
            <p className="text-[var(--color-text)]/70 mb-6">Are you sure you want to delete this sales plan? This action cannot be undone.</p>
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

export default SalesPlanList;
