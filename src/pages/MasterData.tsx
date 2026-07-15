import React, { useState, useEffect } from 'react';
import { Factory, Warehouse, Product, RawMaterial, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Database, 
  Factory as FactoryIcon, 
  Warehouse as WarehouseIcon, 
  Package, 
  Tag, 
  Plus, 
  Trash2, 
  Loader2,
  ShieldAlert,
  Edit2,
  Store
} from 'lucide-react';
import Modal from '../components/Modal';
import { ImageUpload } from '../components/common/ImageUpload';
import { apiService } from '../services/apiService';
import { fetchCollection } from '../utils/firestore';

const MasterData: React.FC = () => {
  const { t } = useTranslation();
  const { profile, isAdmin } = useAuth();
  
  // Data States
  const [factories, setFactories] = useState<Factory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<'factories' | 'warehouses' | 'products' | 'raw' | 'categories' | 'outlets'>('factories');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form States
  const [factoryForm, setFactoryForm] = useState({ name: '', location: '', managerId: '' });
  const [warehouseForm, setWarehouseForm] = useState({ name: '', location: '', factoryId: '', managerId: '' });
  const [productForm, setProductForm] = useState({ name: '', categoryId: '', packageSize: '', unit: '', price: 0, imageUrl: '' });
  const [rawForm, setRawForm] = useState({ name: '', unit: 'kg' as RawMaterial['unit'] });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [outletForm, setOutletForm] = useState({ name: '', location: '', factory_id: '' });

  const fetchData = async () => {
    if (!profile?.companyId) return;
    try {
      const companyId = profile.companyId;
      
      const [factoriesData, warehousesData, productsData, rawMaterialsData, categoriesData, outletsData, usersData] = await Promise.all([
        fetchCollection<Factory>('factories', companyId),
        fetchCollection<Warehouse>('warehouses', companyId),
        fetchCollection<Product>('products', companyId),
        fetchCollection<RawMaterial>('rawMaterials', companyId),
        fetchCollection<Category>('categories', companyId),
        fetchCollection<any>('outlets', companyId),
        fetchCollection<any>('users', companyId),
      ]);

      setFactories(factoriesData);
      setWarehouses(warehousesData);
      setProducts(productsData);
      setRawMaterials(rawMaterialsData);
      setCategories(categoriesData);
      setOutlets(outletsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.companyId]);

  const canManage = isAdmin || profile?.role === 'admin' || profile?.role === 'factory_manager';

  const handleEdit = (item: any) => {
    setEditingItem(item);
    switch (activeTab) {
      case 'factories': setFactoryForm({ name: item.name, location: item.location, managerId: item.managerId || '' }); break;
      case 'warehouses': setWarehouseForm({ name: item.name, location: item.location, factoryId: item.factoryId, managerId: item.managerId || '' }); break;
      case 'products': setProductForm({ name: item.name, categoryId: item.categoryId, packageSize: item.packageSize, unit: item.unit, price: item.price, imageUrl: item.imageUrl || '' }); break;
      case 'raw': setRawForm({ name: item.name, unit: item.unit }); break;
      case 'categories': setCategoryForm({ name: item.name, description: item.description }); break;
      case 'outlets': setOutletForm({ name: item.name, location: item.location, factory_id: item.factory_id || '' }); break;
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !profile?.companyId) return;
    setSubmitting(true);

    try {
      const collectionMapping: Record<string, string> = {
        factories: 'factories',
        warehouses: 'warehouses',
        products: 'products',
        raw: 'rawMaterials',
        categories: 'categories',
        outlets: 'outlets'
      };

      const colName = collectionMapping[activeTab];
      const formData = {
        ... (activeTab === 'factories' ? factoryForm : 
             activeTab === 'warehouses' ? warehouseForm :
             activeTab === 'products' ? {...productForm, price: Number(productForm.price)} :
             activeTab === 'raw' ? rawForm : 
             activeTab === 'outlets' ? outletForm :
             categoryForm),
        companyId: profile.companyId
      };
      
      if (editingItem) {
        await apiService.updateDocument(colName, editingItem.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await apiService.addDocument(colName, {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }

      await fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
      // Reset forms
      setFactoryForm({ name: '', location: '', managerId: '' });
      setWarehouseForm({ name: '', location: '', factoryId: '', managerId: '' });
      setProductForm({ name: '', categoryId: '', packageSize: '', unit: '', price: 0, imageUrl: '' });
      setRawForm({ name: '', unit: 'kg' });
      setCategoryForm({ name: '', description: '' });
      setOutletForm({ name: '', location: '', factory_id: '' });
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, tab: string) => {
    if (!canManage || !profile?.companyId) return;
    if (window.confirm(t('Are you sure you want to delete this item?'))) {
      try {
        const collectionMapping: Record<string, string> = {
          factories: 'factories',
          warehouses: 'warehouses',
          products: 'products',
          raw: 'rawMaterials',
          categories: 'categories',
          outlets: 'outlets'
        };
        await apiService.deleteDocument(collectionMapping[tab], id);
        await fetchData();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  if (!canManage) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <ShieldAlert size={64} className="text-rose-500" />
        <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">{t('Access Restricted')}</h2>
        <p className="text-[var(--color-text)]/40">{t('Only administrators and managers can access structural data management.')}</p>
      </div>
    );
  }

  const canEdit = canManage;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Master Data')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Manage structural entities and product definitions')}</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
          >
            <Plus size={20} />
            <span className="font-bold">{t('Add')} {t(activeTab === 'categories' ? 'Category' : activeTab === 'factories' ? 'Factory' : activeTab === 'warehouses' ? 'Warehouse' : activeTab === 'products' ? 'Product' : activeTab === 'outlets' ? 'Outlet' : 'Raw Material')}</span>
          </button>
        )}
      </header>

      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'factories', label: 'Factories', icon: FactoryIcon },
          { id: 'warehouses', label: 'Warehouses', icon: WarehouseIcon },
          { id: 'outlets', label: 'Outlets', icon: Store },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'raw', label: 'Raw Materials', icon: Database },
          { id: 'categories', label: 'Categories', icon: Tag },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-[var(--color-main)] text-white shadow-md' : 'bg-[var(--color-surface)] text-[var(--color-text)]/40 border border-[var(--color-text)]/20 hover:bg-[var(--color-text)]/[0.05]'
            }`}
          >
            <tab.icon size={18} />
            <span>{t(tab.label)}</span>
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--color-bg)]/50 text-xs uppercase tracking-widest text-[var(--color-text)]/40 font-bold">
                <th className="px-6 py-4">{t('Name')}</th>
                <th className="px-6 py-4">{t('Details')}</th>
                {canEdit && <th className="px-6 py-4 text-right">{t('Actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5">
              {activeTab === 'factories' && factories.map(f => (
                <tr key={f.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)]">{f.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]/60">
                    {t('Location')}: {f.location} {f.managerId && `• ${t('Manager')}: ${users.find(u => u.uid === f.managerId)?.name || t('Unknown')}`}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => handleEdit(f)} className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(f.id, 'factories')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {activeTab === 'warehouses' && warehouses.map(w => (
                <tr key={w.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)]">{w.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]/60">
                    {t('Location')}: {w.location} {w.managerId && `• ${t('Manager')}: ${users.find(u => u.uid === w.managerId)?.name || t('Unknown')}`} • {factories.find(f => f.id === w.factoryId)?.name || t('No Factory')}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => handleEdit(w)} className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(w.id, 'warehouses')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {activeTab === 'products' && products.map(p => (
                <tr key={p.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)] flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--color-text)]/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-text)]/5 flex items-center justify-center">
                        <Package size={20} className="text-[var(--color-text)]/40" />
                      </div>
                    )}
                    {p.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]/60">
                    {categories.find(c => c.id === p.categoryId)?.name || t('Unknown Category')} • {p.packageSize} • ${p.price}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => handleEdit(p)} className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(p.id, 'products')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {activeTab === 'raw' && rawMaterials.map(r => (
                <tr key={r.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)]">{r.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]/60">{t('Unit')}: {t(r.unit)}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => handleEdit(r)} className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(r.id, 'rawMaterials')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {activeTab === 'categories' && categories.map(c => (
                <tr key={c.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)]">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]/60">{c.description}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => handleEdit(c)} className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(c.id, 'categories')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {activeTab === 'outlets' && outlets.map(o => (
                <tr key={o.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--color-text)]">{o.name}</td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text)]/60">{o.location}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right flex justify-end space-x-2">
                      <button onClick={() => handleEdit(o)} className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(o.id, 'outlets')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} title={`${editingItem ? t('Edit') : t('Add New')} ${t(activeTab === 'categories' ? 'Category' : activeTab === 'factories' ? 'Factory' : activeTab === 'warehouses' ? 'Warehouse' : activeTab === 'products' ? 'Product' : activeTab === 'outlets' ? 'Outlet' : 'Raw Material')}`}>
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'factories' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Factory Name')}</label>
                <input required value={factoryForm.name} onChange={e => setFactoryForm({...factoryForm, name: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Location')}</label>
                <input required value={factoryForm.location} onChange={e => setFactoryForm({...factoryForm, location: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Manager')}</label>
                <select value={factoryForm.managerId} onChange={e => setFactoryForm({...factoryForm, managerId: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]">
                  <option value="">{t('Select Manager (Optional)')}</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            </>
          )}
          {activeTab === 'warehouses' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Warehouse Name')}</label>
                <input required value={warehouseForm.name} onChange={e => setWarehouseForm({...warehouseForm, name: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Location')}</label>
                <input required value={warehouseForm.location} onChange={e => setWarehouseForm({...warehouseForm, location: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Associated Factory')}</label>
                <select required value={warehouseForm.factoryId} onChange={e => setWarehouseForm({...warehouseForm, factoryId: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]">
                  <option value="">{t('Select Factory')}</option>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Manager')}</label>
                <select value={warehouseForm.managerId} onChange={e => setWarehouseForm({...warehouseForm, managerId: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]">
                  <option value="">{t('Select Manager (Optional)')}</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.name} ({u.email})</option>)}
                </select>
              </div>
            </>
          )}
          {activeTab === 'products' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Product Name')}</label>
                <input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Category')}</label>
                  <select required value={productForm.categoryId} onChange={e => setProductForm({...productForm, categoryId: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]">
                    <option value="">{t('Select Category')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Price')} ($)</label>
                  <input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value === '' ? 0 : Number(e.target.value)})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Package Size')}</label>
                  <input required value={productForm.packageSize} onChange={e => setProductForm({...productForm, packageSize: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" placeholder={t('e.g. 500ml, 1kg')} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Base Unit')}</label>
                  <input required value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" placeholder={t('e.g. Bottle, Box')} />
                </div>
              </div>
              <div className="space-y-1 mt-4">
                <ImageUpload 
                  label={t('PRODUCT IMAGE')} 
                  value={productForm.imageUrl} 
                  onChange={url => setProductForm({...productForm, imageUrl: url})} 
                />
              </div>
            </>
          )}
          {activeTab === 'raw' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Material Name')}</label>
                <input required value={rawForm.name} onChange={e => setRawForm({...rawForm, name: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Unit')}</label>
                <select required value={rawForm.unit} onChange={e => setRawForm({...rawForm, unit: e.target.value as any})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]">
                  <option value="kg">{t('Kilogram')} (kg)</option>
                  <option value="liter">{t('Liter')} (l)</option>
                  <option value="unit">{t('Unit')} (pcs)</option>
                  <option value="bag">{t('Bag')}</option>
                </select>
              </div>
            </>
          )}
          {activeTab === 'categories' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Category Name')}</label>
                <input required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Description')}</label>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 h-24 text-[var(--color-text)]" />
              </div>
            </>
          )}
          {activeTab === 'outlets' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Outlet Name')}</label>
                <input required value={outletForm.name} onChange={e => setOutletForm({...outletForm, name: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">{t('Location')}</label>
                <input required value={outletForm.location} onChange={e => setOutletForm({...outletForm, location: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-2">{t('Parent Factory')}</label>
                <select value={outletForm.factory_id} onChange={e => setOutletForm({...outletForm, factory_id: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-[var(--color-text)]">
                  <option value="">{t('Select Factory (Optional)')}</option>
                  {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-[var(--color-main)] text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <span>{editingItem ? t('Update') : t('Create')} {t(activeTab === 'categories' ? 'Category' : activeTab === 'factories' ? 'Factory' : activeTab === 'warehouses' ? 'Warehouse' : activeTab === 'products' ? 'Product' : activeTab === 'outlets' ? 'Outlet' : 'Raw Material')}</span>}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MasterData;
