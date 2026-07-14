import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Supplier, RawMaterial, Product, Factory, Warehouse, PurchaseOrderItem } from '../../types';
import { createPurchaseOrder, updatePurchaseOrder } from '../../services/procurementService';
import { useAuth } from '../../context/AuthContext';
import { X, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import Modal from '../Modal';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order?: PurchaseOrder;
  suppliers: Supplier[];
  materials: RawMaterial[];
  factories: Factory[];
  warehouses: Warehouse[];
}

const PurchaseOrderModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, order, suppliers, materials, factories, warehouses }) => {
  const { t } = useTranslation();
  const { profile, isAdmin, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const isRestrictedWarehouseManager = !isAdmin && hasRole('warehouse_manager');
  const [form, setForm] = useState<any>({
    supplierId: '',
    factoryId: '',
    warehouseId: isRestrictedWarehouseManager ? (profile?.unitId || '') : '',
    status: 'pending',
    items: [{ itemId: '', itemName: '', quantity: 1, price: 0 }],
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    if (isOpen && order) {
      setForm({
        ...order,
        createdAt: new Date(order.createdAt).toISOString(),
      });
    } else if (isOpen) {
      setForm({
        supplierId: '',
        factoryId: '',
        warehouseId: isRestrictedWarehouseManager ? (profile?.unitId || '') : '',
        status: 'pending',
        items: [{ itemId: '', itemName: '', quantity: 1, price: 0 }],
        createdAt: new Date().toISOString(),
      });
    }
  }, [isOpen, order]);

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { itemId: '', itemName: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = form.items.filter((_: any, i: number) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = form.items.map((item: any, i: number) => {
      if (i === index) {
        if (field === 'itemId') {
          const material = materials.find(m => m.id === value);
          return { ...item, itemId: value, itemName: material?.name || '' };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (order) {
        await updatePurchaseOrder(order.id, form, suppliers);
      } else {
        await createPurchaseOrder(form, suppliers, profile);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = form.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.price)), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? 'Edit Purchase Order' : 'New Purchase Order'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Supplier</label>
            <select 
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.supplierId}
              onChange={e => setForm({...form, supplierId: e.target.value})}
            >
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Status</label>
            <select 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.status}
              onChange={e => setForm({...form, status: e.target.value})}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="shipped">Shipped</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Factory</label>
            <select 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.factoryId}
              onChange={e => setForm({...form, factoryId: e.target.value})}
            >
              <option value="">Select Factory</option>
              {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Destination Warehouse</label>
            <select 
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={form.warehouseId}
              onChange={e => setForm({...form, warehouseId: e.target.value})}
              disabled={isRestrictedWarehouseManager}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Order Items</h4>
            <button 
              type="button" 
              onClick={addItem}
              className="flex items-center space-x-1 text-xs text-[var(--color-main)] font-bold"
            >
              <Plus size={14} />
              <span>{t('Add Item')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item: any, index: number) => (
              <div key={index} className="flex flex-col md:flex-row items-end space-y-2 md:space-y-0 md:space-x-2 bg-[var(--color-text)]/5 p-4 rounded-xl relative">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-[var(--color-text)]/40 uppercase mb-1">Material</label>
                  <select 
                    required
                    className="w-full p-2 rounded-lg border border-[var(--color-text)]/10 bg-[var(--color-surface)] text-sm"
                    value={item.itemId}
                    onChange={e => updateItem(index, 'itemId', e.target.value)}
                  >
                    <option value="">Select Material</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="w-full md:w-24">
                  <label className="block text-[10px] font-bold text-[var(--color-text)]/40 uppercase mb-1">Qty</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-2 rounded-lg border border-[var(--color-text)]/10 bg-[var(--color-surface)] text-sm"
                    value={item.quantity}
                    onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))}
                  />
                </div>
                <div className="w-full md:w-24">
                  <label className="block text-[10px] font-bold text-[var(--color-text)]/40 uppercase mb-1">Price</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-2 rounded-lg border border-[var(--color-text)]/10 bg-[var(--color-surface)] text-sm"
                    value={item.price}
                    onChange={e => updateItem(index, 'price', parseFloat(e.target.value))}
                  />
                </div>
                {form.items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)}
                    className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-text)]/20 flex justify-between items-center">
          <span className="text-sm font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Total Amount</span>
          <span className="text-2xl font-serif font-bold text-[var(--color-main)]">${totalAmount.toLocaleString()}</span>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[var(--color-main)] text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 mt-4"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{order ? t('Update Purchase Order') : t('Create Purchase Order')}</span>
        </button>
      </form>
    </Modal>
  );
};

export default PurchaseOrderModal;
