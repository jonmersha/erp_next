import { useState, useEffect } from 'react';
import { Factory, Product, ProductionRun, Recipe, ProductionPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchCollection } from '../utils/firestore';

export const useProductionData = () => {
  const { profile } = useAuth();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      const [factoriesData, runsData, plansData, productsData, recipesData, usersData, templatesData] = await Promise.all([
        fetchCollection('factories', companyId),
        fetchCollection('productionRuns', companyId, { orderByField: 'startDate', orderDir: 'desc' }),
        fetchCollection('productionPlans', companyId),
        fetchCollection('products', companyId),
        fetchCollection('recipes', companyId),
        fetchCollection('users', companyId),
        fetchCollection('workflowTemplates', companyId)
      ]);

      if (Array.isArray(factoriesData)) setFactories(factoriesData as any);
      if (Array.isArray(runsData)) setRuns(runsData as any);
      if (Array.isArray(plansData)) setPlans(plansData as any);
      if (Array.isArray(productsData)) setProducts(productsData as any);
      if (Array.isArray(recipesData)) setRecipes(recipesData as any);
      if (Array.isArray(usersData)) setUsers(usersData as any);
      if (Array.isArray(templatesData)) setWorkflowTemplates(templatesData as any);
    } catch (error) {
      console.error("Error fetching production data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  return {
    factories,
    runs,
    plans,
    products,
    recipes,
    users,
    workflowTemplates,
    loading,
    refreshData: fetchData
  };
};
