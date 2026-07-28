"use client";
import React, { useState } from 'react';
import { useProcurementData } from '../../hooks/useProcurementData';
import { 
  ShoppingCart, 
  Users, 
  Plus, 
  Search, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import SupplierModal from '../../modals/SupplierModal';
import PurchaseOrderModal from '../../modals/PurchaseOrderModal';
import PurchaseRequisitionModal from '../../modals/PurchaseRequisitionModal';
import Badge from '../common/Badge';
import { deleteSupplier, approveSupplier, approvePurchaseOrder, approvePurchaseRequisition, rejectPurchaseRequisition } from '../../services/procurementService';
import { useAuth } from '../../context/AuthContext';

import PurchaseRequisitionTab from './tabs/PurchaseRequisitionTab';
import PurchaseOrderTab from './tabs/PurchaseOrderTab';
import SupplierTab from './tabs/SupplierTab';
import ApprovalsTab from './tabs/ApprovalsTab';
import POLifecycleTracker from './POLifecycleTracker';

const Procurement: React.FC = () => {
  const { profile, can } = useAuth();
  const { suppliers, orders, materials, factories, warehouses, purchaseRequisitions, departments, loading, refreshData } = useProcurementData();
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'suppliers' | 'approvals'>('requisitions');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const filteredRequisitions = purchaseRequisitions.filter(pr => 
    pr.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingApprovals = (profile?.role === 'factory_manager' || profile?.role === 'admin') ? [
    ...purchaseRequisitions.filter(pr => pr.status === 'pending_approval').map(pr => ({ type: 'Requisition', id: pr.id, label: pr.item_name || 'Purchase Requisition', createdBy: pr.createdBy || '', date: pr.createdAt, data: pr })),
    ...orders.filter(o => o.status === 'pending_approval').map(o => ({ type: 'Order', id: o.id, label: o.supplierName || 'Purchase Order', createdBy: o.createdBy || '', date: o.createdAt, data: o })),
    ...suppliers.filter(s => s.status === 'pending_approval').map(s => ({ type: 'Supplier', id: s.id, label: s.name, createdBy: s.createdBy || s.created_by || '', date: s.created_at, data: s })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        await refreshData();
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      }
    }
  };

  const handleApproveSupplier = async (id: string) => {
    try {
      if (profile?.uid) {
        await approveSupplier(id, profile.uid);
        await refreshData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve supplier');
    }
  };

  const handleApprovePO = async (orderId: string) => {
    if (!profile) return;
    try {
      await approvePurchaseOrder(orderId, profile.uid);
      await refreshData();
    } catch (error) {
      console.error('Error approving PO:', error);
      alert('Failed to approve Purchase Order');
    }
  };

  const handleSubmitPO = async (orderId: string) => {
    try {
      const { submitPurchaseOrder } = await import('../../services/procurementService');
      await submitPurchaseOrder(orderId);
      await refreshData();
    } catch (error) {
      console.error('Error submitting PO:', error);
      alert('Failed to submit Purchase Order for approval');
    }
  };

  const handleApprovePR = async (id: string) => {
    try {
      if (profile?.uid) {
        await approvePurchaseRequisition(id, profile.uid);
        await refreshData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve requisition');
    }
  };

  const handleRejectPR = async (id: string) => {
    if (confirm('Are you sure you want to reject this requisition?')) {
      try {
        await rejectPurchaseRequisition(id);
        await refreshData();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to reject requisition');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'success';
      case 'shipped': return 'info';
      case 'approved': return 'success';
      case 'pending': 
      case 'pending_approval': return 'warning';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <CheckCircle2 size={14} />;
      case 'pending': 
      case 'pending_approval': return <Clock size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Procurement Management</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Manage suppliers, purchase orders, and material acquisition.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => { setSelectedSupplier(null); setIsSupplierModalOpen(true); }}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border border-[var(--color-text)]/10 text-sm font-bold hover:bg-[var(--color-text)]/5 transition-all text-[var(--color-text)]"
          >
            <Users size={16} />
            <span>Add Supplier</span>
          </button>
          <button 
            onClick={() => setIsPRModalOpen(true)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl text-sm font-bold hover:bg-[var(--color-main)]/20 transition-all"
          >
            <Plus size={16} />
            <span>New Requisition</span>
          </button>
          <button 
            onClick={() => { setSelectedPO(null); setIsPOModalOpen(true); }}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)] text-white rounded-xl text-sm font-bold shadow-lg shadow-[var(--color-main)]/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
          </button>
        </div>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingCart size={24} />
            </div>
            <Badge variant="info">
              +12% vs last month
            </Badge>
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Active Orders</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{orders.filter(o => o.status !== 'received' && o.status !== 'cancelled').length}</h3>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <Badge variant="success">
              Optimal
            </Badge>
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Total Spend</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">${orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0).toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Users size={24} />
            </div>
            <Badge variant="warning">
              Active
            </Badge>
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Pending Approvals</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{pendingApprovals.length}</h3>
        </div>
      </div>

      {trackingOrderId ? (
        <POLifecycleTracker 
          orderId={trackingOrderId} 
          onClose={() => setTrackingOrderId(null)} 
        />
      ) : (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-text)]/5 shadow-sm overflow-hidden mb-6">
          {/* Search & Tabs */}
          <div className="p-4 md:p-6 border-b border-[var(--color-text)]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex space-x-1 bg-[var(--color-text)]/5 p-1 rounded-xl">
              {['requisitions', 'orders', 'suppliers', 'approvals'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-[var(--color-text)] shadow-sm' 
                      : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5'
                  }`}
                >
                  {tab}
                  {tab === 'approvals' && pendingApprovals.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingApprovals.length}</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text)]/40" size={18} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 bg-[var(--color-text)]/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all text-[var(--color-text)]"
              />
            </div>
          </div>

          {/* Dynamic Table Content */}
          <div className="overflow-x-auto">
            {activeTab === 'requisitions' ? (
              <PurchaseRequisitionTab 
                filteredRequisitions={filteredRequisitions}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ) : activeTab === 'orders' ? (
              <PurchaseOrderTab 
                filteredOrders={filteredOrders}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                setSelectedPO={setSelectedPO}
                setIsPOModalOpen={setIsPOModalOpen}
                onSubmitPO={handleSubmitPO}
                currentUserId={profile?.uid}
                onTrack={(order) => setTrackingOrderId(order.id)}
              />
            ) : activeTab === 'suppliers' ? (
              <SupplierTab 
                filteredSuppliers={filteredSuppliers}
                profile={profile}
                handleApproveSupplier={handleApproveSupplier}
                setSelectedSupplier={setSelectedSupplier}
                setIsSupplierModalOpen={setIsSupplierModalOpen}
                handleDeleteSupplier={handleDeleteSupplier}
              />
            ) : activeTab === 'approvals' ? (
              <ApprovalsTab 
                pendingApprovals={pendingApprovals}
                profile={profile}
                can={can}
                handleApproveSupplier={handleApproveSupplier}
                handleApprovePO={handleApprovePO}
                handleApprovePR={handleApprovePR}
                handleRejectPR={handleRejectPR}
              />
            ) : null}
          </div>

          {!loading && (activeTab === 'requisitions' ? filteredRequisitions.length : activeTab === 'orders' ? filteredOrders.length : activeTab === 'approvals' ? pendingApprovals.length : filteredSuppliers.length) === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-[var(--color-text)]/5 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-text)]/20">
                <ShoppingCart size={32} />
              </div>
              <p className="text-[var(--color-text)]/40 font-medium">No results found for your search.</p>
            </div>
          )}
        </div>
      )}

      <SupplierModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={refreshData}
        supplier={selectedSupplier}
      />

      <PurchaseOrderModal 
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        onSuccess={refreshData}
        order={selectedPO}
        suppliers={suppliers}
        materials={materials}
        factories={factories}
        warehouses={warehouses}
      />

      <PurchaseRequisitionModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        onSuccess={refreshData}
        departments={departments}
        materials={materials}
      />
    </div>
  );
};

export default Procurement;
