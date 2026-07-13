import React, { useState, useEffect } from 'react';
import { ProductionPlan, Factory, Product, Recipe, RawMaterial } from '../../types';
import { getProductionPlans, deleteProductionPlan } from '../../services/planningService';
import { getRecipes, addRecipe } from '../../services/recipeService';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Plus, Info } from 'lucide-react';
import ProductionPlanModal from './ProductionPlanModal';
import ProductionPlanDetailsModal from './ProductionPlanDetailsModal';

interface Props {
  factories: Factory[];
  products: Product[];
  materials: RawMaterial[];
}

const ProductionPlanList: React.FC<Props> = ({ factories, products, materials }) => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<ProductionPlan | null>(null);

  const fetchPlans = () => {
    if (profile?.companyId) {
      setLoading(true);
      Promise.all([
        getProductionPlans(profile.companyId),
        getRecipes(profile.companyId)
      ]).then(async ([fetchedPlans, fetchedRecipes]) => {
        setPlans(fetchedPlans);
        
        // Auto-generate missing recipes
        const existingProductIds = new Set(fetchedRecipes.map(r => r.productId));
        const missingProducts = products.filter(p => !existingProductIds.has(p.id));
        
        let finalRecipes = [...fetchedRecipes];
        
        if (missingProducts.length > 0 && materials.length > 0) {
          const newRecipes = [];
          for (const product of missingProducts) {
            const shuffledMaterials = [...materials].sort(() => 0.5 - Math.random());
            const selectedMaterials = shuffledMaterials.slice(0, Math.min(2, materials.length));
            
            const bom = selectedMaterials.map(m => ({
              materialId: m.id,
              quantity: Math.floor(Math.random() * 5) + 1,
              unit: m.unit || 'kg'
            }));

            const recipeData = {
              productId: product.id,
              name: `${product.name} Standard Recipe`,
              bom,
              processingSteps: [
                { order: 1, description: 'Prepare raw materials according to BOM.', durationMinutes: 30 },
                { order: 2, description: 'Mix ingredients in the main processor.', durationMinutes: 60 },
                { order: 3, description: 'Quality check and packaging.', durationMinutes: 45 }
              ],
              yieldPercentage: 95,
              companyId: profile.companyId,
            };
            
            try {
              const docRef = await addRecipe(recipeData);
              newRecipes.push({ id: docRef.id, ...recipeData });
            } catch (e) {
              console.error("Failed to auto-generate recipe", e);
            }
          }
          finalRecipes = [...finalRecipes, ...newRecipes];
        }
        
        setRecipes(finalRecipes);
      }).finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [profile, products.length, materials.length]);

  const handleDelete = async () => {
    if (planToDelete) {
      try {
        await deleteProductionPlan(planToDelete.id);
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
        <h3 className="text-xl font-bold">Production Plans</h3>
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
              className="border-t border-[var(--color-text)]/5 cursor-pointer hover:bg-[var(--color-text)]/5"
              onClick={() => setSelectedPlan(plan)}
            >
              <td className="py-3">{factories.find(f => f.id === plan.factoryId)?.name || plan.factoryId}</td>
              <td className="py-3">{products.find(p => p.id === plan.productId)?.name || plan.productId}</td>
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
      <ProductionPlanModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedPlan(null); }} 
        factories={factories}
        products={products}
        onSuccess={fetchPlans}
        plan={selectedPlan || undefined}
      />
      {selectedPlan && !isModalOpen && (
        <ProductionPlanDetailsModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
          product={products.find(p => p.id === selectedPlan.productId)}
          recipe={recipes.find(r => r.productId === selectedPlan.productId)}
          materials={materials}
          onSuccess={fetchPlans}
          onEdit={() => { setIsModalOpen(true); }}
          onDelete={() => { setPlanToDelete(selectedPlan); setSelectedPlan(null); }}
        />
      )}

      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-[var(--color-text)]">Delete Plan</h3>
            <p className="text-[var(--color-text)]/70 mb-6">Are you sure you want to delete this production plan? This action cannot be undone.</p>
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

export default ProductionPlanList;
