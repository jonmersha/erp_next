import React from 'react';
import { Package, Search, Filter, Warehouse as WarehouseIcon, AlertTriangle } from 'lucide-react';
import { InventoryItem, Warehouse, Factory, RawMaterial, Product } from '../../types';

interface StockLevelsProps {
  inventory: InventoryItem[];
  warehouses: Warehouse[];
  factories: Factory[];
  materials: RawMaterial[];
  products: Product[];
  selectedUnit: string;
  setSelectedUnit: (unit: string) => void;
  search: string;
  setSearch: (search: string) => void;
  getUnitName: (id: string) => string;
}

const StockLevels: React.FC<StockLevelsProps> = ({
  inventory,
  warehouses,
  factories,
  materials,
  products,
  selectedUnit,
  setSelectedUnit,
  search,
  setSearch,
  getUnitName
}) => {
  const filteredInventory = (inventory || []).filter(item => {
    const matchesUnit = selectedUnit === 'all' || item.unitId === selectedUnit;
    const itemName = item.itemType === 'raw' 
      ? materials.find(m => m.id === item.itemId)?.name 
      : products.find(p => p.id === item.itemId)?.name;
    const matchesSearch = (itemName?.toLowerCase() || '').includes(search.toLowerCase());
    return matchesUnit && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={20} />
          <input 
            type="text"
            placeholder="Search materials or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 bg-[var(--color-surface)] px-4 py-2 rounded-2xl border border-[var(--color-text)]/20">
          <Filter size={18} className="text-[var(--color-text)]/20" />
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-transparent focus:outline-none text-sm font-medium text-[var(--color-text)]"
          >
            <option value="all">All Locations</option>
            <optgroup label="Warehouses">
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </optgroup>
            <optgroup label="Factories">
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map(item => {
          const details = item.itemType === 'raw' 
            ? materials.find(m => m.id === item.itemId)
            : products.find(p => p.id === item.itemId);
          
          return (
            <div key={item.id} className="bg-[var(--color-surface)] p-6 rounded-3xl shadow-sm border border-[var(--color-text)]/20 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${item.itemType === 'raw' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {item.itemType === 'raw' ? <Package size={24} /> : <WarehouseIcon size={24} />}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">{item.itemType === 'raw' ? 'Raw Material' : 'Finished Product'}</p>
                  <p className="text-2xl font-serif font-bold text-[var(--color-text)]">{item.quantity}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg text-[var(--color-text)] mb-1">{details?.name || 'Unknown Item'}</h4>
                <p className="text-sm text-[var(--color-text)]/40 flex items-center">
                  <WarehouseIcon size={14} className="mr-1" />
                  {getUnitName(item.unitId)}
                </p>
              </div>
              {item.quantity < 50 && (
                <div className="mt-4 flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded-xl text-xs font-bold">
                  <AlertTriangle size={14} />
                  <span>Low Stock Warning</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockLevels;
