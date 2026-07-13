import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInventoryData } from '../hooks/useInventoryData';
import { receivePurchaseOrder, shipSalesOrder } from '../services/inventoryService';
import { PurchaseOrder, SalesOrder } from '../types';
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  Loader2
} from 'lucide-react';

// Sub-components
import StockLevels from '../components/inventory/StockLevels';
import IncomingGoods from '../components/inventory/IncomingGoods';
import OutgoingGoods from '../components/inventory/OutgoingGoods';
import MovementHistory from '../components/inventory/MovementHistory';
import GRNModal from '../components/inventory/GRNModal';
import DNModal from '../components/inventory/DNModal';

const Inventory: React.FC = () => {
  const { profile } = useAuth();
  const {
    inventory,
    factories,
    warehouses,
    materials,
    products,
    pendingPOs,
    pendingSOs,
    grns,
    deliveryNotes,
    loading,
    refreshData
  } = useInventoryData();

  const [activeTab, setActiveTab] = useState<'stock' | 'incoming' | 'outgoing' | 'history'>('stock');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isDNModalOpen, setIsDNModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);

  const [grnForm, setGrnForm] = useState({ warehouseId: '', notes: '' });
  const [dnForm, setDnForm] = useState({ warehouseId: '', notes: '' });

  const handleReceivePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setSubmitting(true);
    try {
      await receivePurchaseOrder(selectedPO, grnForm.warehouseId, grnForm.notes, profile);
      await refreshData();
      setIsGRNModalOpen(false);
      setSelectedPO(null);
      setGrnForm({ warehouseId: '', notes: '' });
    } catch (error) {
      console.error("Error receiving PO:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShipSO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSO) return;
    setSubmitting(true);
    try {
      await shipSalesOrder(selectedSO, dnForm.warehouseId, dnForm.notes, profile);
      await refreshData();
      setIsDNModalOpen(false);
      setSelectedSO(null);
      setDnForm({ warehouseId: '', notes: '' });
    } catch (error) {
      console.error("Error shipping SO:", error);
      alert(error instanceof Error ? error.message : "Error shipping SO");
    } finally {
      setSubmitting(false);
    }
  };

  const getUnitName = (id: string) => {
    return warehouses.find(w => w.id === id)?.name || factories.find(f => f.id === id)?.name || 'Unknown Unit';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Inventory Management</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Track stock levels and manage material movements</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={() => {
              setSelectedPO(null);
              setGrnForm({ warehouseId: '', notes: '' });
              setIsGRNModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
          >
            <ArrowDownLeft size={20} />
            <span className="font-bold">New GRN</span>
          </button>
          <button 
            onClick={() => {
              setSelectedSO(null);
              setDnForm({ warehouseId: '', notes: '' });
              setIsDNModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-accent)]/90 transition-all"
          >
            <ArrowUpRight size={20} />
            <span className="font-bold">New Delivery Note</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[var(--color-text)]/5 p-1 rounded-2xl w-fit">
        {[
          { id: 'stock', label: 'Stock Levels', icon: Package },
          { id: 'incoming', label: 'Incoming Goods', icon: ArrowDownLeft },
          { id: 'outgoing', label: 'Outgoing Goods', icon: ArrowUpRight },
          { id: 'history', label: 'Movement History', icon: History },
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

      {activeTab === 'stock' && (
        <StockLevels 
          inventory={inventory}
          warehouses={warehouses}
          factories={factories}
          materials={materials}
          products={products}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          search={search}
          setSearch={setSearch}
          getUnitName={getUnitName}
        />
      )}

      {activeTab === 'incoming' && (
        <IncomingGoods 
          pendingPOs={pendingPOs}
          onReceive={(po) => {
            setSelectedPO(po);
            setIsGRNModalOpen(true);
          }}
        />
      )}

      {activeTab === 'outgoing' && (
        <OutgoingGoods 
          pendingSOs={pendingSOs}
          onShip={(so) => {
            setSelectedSO(so);
            setIsDNModalOpen(true);
          }}
        />
      )}

      {activeTab === 'history' && (
        <MovementHistory 
          grns={grns}
          deliveryNotes={deliveryNotes}
          materials={materials}
          products={products}
          getUnitName={getUnitName}
        />
      )}

      <GRNModal 
        isOpen={isGRNModalOpen}
        onClose={() => setIsGRNModalOpen(false)}
        selectedPO={selectedPO}
        setSelectedPO={setSelectedPO}
        pendingPOs={pendingPOs}
        warehouses={warehouses}
        grnForm={grnForm}
        setGrnForm={setGrnForm}
        onSubmit={handleReceivePO}
        submitting={submitting}
      />

      <DNModal 
        isOpen={isDNModalOpen}
        onClose={() => setIsDNModalOpen(false)}
        selectedSO={selectedSO}
        setSelectedSO={setSelectedSO}
        pendingSOs={pendingSOs}
        warehouses={warehouses}
        dnForm={dnForm}
        setDnForm={setDnForm}
        onSubmit={handleShipSO}
        submitting={submitting}
      />
    </div>
  );
};

export default Inventory;
