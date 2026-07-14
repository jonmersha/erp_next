import React, { useState, useEffect } from 'react';
import { Recipe, Product } from '../types';
import { getRecipes, addRecipe } from '../services/recipeService';
import { useAuth } from '../context/AuthContext';
import { useInventoryData } from '../hooks/useInventoryData';
import { Loader2, Plus, BookOpen } from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

const Recipes: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { products, materials, loading: inventoryLoading } = useInventoryData();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecipe, setNewRecipe] = useState<Omit<Recipe, 'id'>>({
    productId: '',
    name: '',
    bom: [],
    processingSteps: [],
    yieldPercentage: 100,
    companyId: '',
  });
  const [newIngredient, setNewIngredient] = useState({ materialId: '', quantity: 0 });
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const data = await getRecipes(profile.companyId);
        setRecipes(data);
      } catch (error) {
        console.error("Error fetching recipes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    setNewRecipe(prev => ({ ...prev, companyId: profile.companyId }));
    
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  const handleAddRecipe = async () => {
    if (!profile?.companyId) return;
    try {
      await addRecipe(newRecipe);
      setIsModalOpen(false);
      setNewRecipe({
        productId: '',
        name: '',
        bom: [],
        processingSteps: [],
        yieldPercentage: 100,
        companyId: profile.companyId,
      });
      // Refresh
      const updatedRecipes = await getRecipes(profile.companyId);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error("Error adding recipe:", error);
    }
  };

  const handleAutoGenerate = async () => {
    if (!profile?.companyId || materials.length === 0) return;
    setGenerating(true);
    try {
      const existingProductIds = new Set(recipes.map(r => r.productId));
      const missingProducts = products.filter(p => !existingProductIds.has(p.id));

      for (const product of missingProducts) {
        // Pick 2 random materials for the BOM
        const shuffledMaterials = [...materials].sort(() => 0.5 - Math.random());
        const selectedMaterials = shuffledMaterials.slice(0, Math.min(2, materials.length));
        
        const bom = selectedMaterials.map(m => ({
          materialId: m.id,
          quantity: Math.floor(Math.random() * 5) + 1,
          unit: m.unit || 'kg'
        }));

        await addRecipe({
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
        });
      }

      // Refresh
      const updatedRecipes = await getRecipes(profile.companyId);
      setRecipes(updatedRecipes);
    } catch (error) {
      console.error("Error generating recipes:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || inventoryLoading) return <Loader2 className="animate-spin mx-auto text-[var(--color-main)]" />;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Recipe & BOM Management</h2>
        <p className="text-[var(--color-text)]/40 mt-1">Define product recipes and ingredient requirements.</p>
      </header>

      <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text)]">Recipes</h3>
          <div className="flex space-x-3">
            <button 
              onClick={handleAutoGenerate}
              disabled={generating || materials.length === 0}
              className="flex items-center space-x-2 bg-[var(--color-text)]/10 text-[var(--color-text)] px-4 py-2 rounded-xl hover:bg-[var(--color-text)]/20 disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
              <span>{t('Auto-Generate')}</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl"
            >
              <Plus size={16} />
              <span>{t('New Recipe')}</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <div key={recipe.id} className="border border-[var(--color-text)]/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="text-[var(--color-main)]" />
                <h4 className="font-bold text-lg text-[var(--color-text)]">{recipe.name}</h4>
              </div>
              <p className="text-sm text-[var(--color-text)]/60">Product: {products.find(p => p.id === recipe.productId)?.name}</p>
              <div className="text-sm text-[var(--color-text)]/40">
                <p>Ingredients: {recipe.bom.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('New Recipe')}>
        <div className="space-y-4 text-[var(--color-text)]">
          <input
            type="text"
            placeholder="Recipe Name"
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl"
            value={newRecipe.name}
            onChange={e => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
          />
          <select
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl"
            value={newRecipe.productId}
            onChange={e => setNewRecipe(prev => ({ ...prev, productId: e.target.value }))}
          >
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          
          <div className="space-y-2">
            <h4 className="font-bold">BOM Ingredients</h4>
            {newRecipe.bom.map((ing, i) => <div key={i} className="text-sm">{ing.materialId}: {ing.quantity}</div>)}
            <div className="flex space-x-2">
              <input type="text" placeholder="Material ID" className="flex-1 p-2 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded" value={newIngredient.materialId} onChange={e => setNewIngredient(prev => ({...prev, materialId: e.target.value}))} />
              <input type="number" placeholder="Qty" className="w-20 p-2 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded" value={newIngredient.quantity} onChange={e => setNewIngredient(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))} />
              <button onClick={() => {
                setNewRecipe(prev => ({...prev, bom: [...prev.bom, newIngredient]}));
                setNewIngredient({materialId: '', quantity: 0});
              }} className="bg-[var(--color-main)] text-white p-2 rounded">+</button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold">Processing Steps</h4>
            {newRecipe.processingSteps.map((step, i) => <div key={i} className="text-sm">{step.order}. {step.description} ({step.durationMinutes} mins)</div>)}
            <div className="flex space-x-2">
              <input type="text" placeholder="Step description" className="flex-1 p-2 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded" value={newStep} onChange={e => setNewStep(e.target.value)} />
              <button onClick={() => {
                setNewRecipe(prev => ({...prev, processingSteps: [...prev.processingSteps, {
                  order: prev.processingSteps.length + 1,
                  description: newStep,
                  durationMinutes: 30
                }]}));
                setNewStep('');
              }} className="bg-[var(--color-main)] text-white p-2 rounded">+</button>
            </div>
          </div>

          <button 
            onClick={handleAddRecipe}
            className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl"
          >
            {t('Save Recipe')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Recipes;
