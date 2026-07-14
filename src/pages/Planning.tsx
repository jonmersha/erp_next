import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventoryData } from '../hooks/useInventoryData';
import { motion } from 'motion/react';
import { Calendar, ShoppingCart, TrendingUp, Package, Loader2 } from 'lucide-react';
import ProductionPlanList from '../components/planning/ProductionPlanList';
import ProcurementPlanList from '../components/planning/ProcurementPlanList';
import SalesPlanList from '../components/planning/SalesPlanList';

const Planning: React.FC = () => {
  const { profile } = useAuth();
  const { factories, products, materials, warehouses, loading } = useInventoryData();
  const [activeTab, setActiveTab] = useState<'production' | 'procurement' | 'sales'>('production');

  if (loading) return <Loader2 className="animate-spin mx-auto text-[var(--color-main)]" />;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Planning & Forecasting</h2>
        <p className="text-[var(--color-text)]/40 mt-1">Manage production, procurement, and sales targets.</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[var(--color-text)]/5 p-1 rounded-2xl w-fit">
        {[
          { id: 'production', label: 'Production Plan', icon: Calendar },
          { id: 'procurement', label: 'Procurement Plan', icon: ShoppingCart },
          { id: 'sales', label: 'Sales Plan', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' 
                : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
        {activeTab === 'production' && <ProductionPlanList factories={factories} products={products} materials={materials} />}
        {activeTab === 'procurement' && <ProcurementPlanList materials={materials} warehouses={warehouses} factories={factories} />}
        {activeTab === 'sales' && <SalesPlanList products={products} factories={factories} />}
      </div>
    </div>
  );
};

export default Planning;
