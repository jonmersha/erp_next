"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProcurementData } from '../../hooks/useProcurementData';
import { 
  ShoppingCart, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import SupplierModal from './SupplierModal';
import PurchaseOrderModal from './PurchaseOrderModal';
import Badge from '../common/Badge';
import { deleteSupplier, approveSupplier, approvePurchaseOrder, approvePurchaseRequisition, rejectPurchaseRequisition } from '../../services/procurementService';
import { useAuth } from '../../context/AuthContext';
import PurchaseRequisitionModal from './PurchaseRequisitionModal';

const Procurement: React.FC = () => {
  const { profile } = useAuth();
  const { suppliers, orders, materials, factories, warehouses, purchaseRequisitions, departments, loading, refreshData } = useProcurementData();
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'suppliers'>('requisitions');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);

  const filteredRequisitions = purchaseRequisitions.filter(pr => 
    pr.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    o.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleApprovePO = async (id: string) => {
    try {
      if (profile?.uid) {
        await approvePurchaseOrder(id, profile.uid);
        await refreshData();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve purchase order');
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
      case 'received': return 'emerald';
      case 'shipped': return 'blue';
      case 'approved': return 'purple';
      case 'pending': return 'amber';
      case 'pending_approval': return 'amber';
      case 'cancelled': return 'red';
      default: return 'gray';
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
            <Badge color="blue" label="+12% vs last month" className="text-[10px]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Active Orders</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{orders.filter(o => o.status !== 'received' && o.status !== 'cancelled').length}</h3>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <Badge color="emerald" label="Optimal" className="text-[10px]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Total Spend</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">${orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0).toLocaleString()}</h3>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Users size={24} />
            </div>
            <Badge color="amber" label="Active" className="text-[10px]" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text)]/40 uppercase tracking-widest">Trusted Suppliers</p>
          <h3 className="text-3xl font-light text-[var(--color-text)] mt-1">{suppliers.length}</h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[var(--color-surface)] rounded-3xl border border-[var(--color-text)]/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--color-text)]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-1 bg-[var(--color-text)]/5 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('requisitions')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'requisitions' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              Requisitions
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              Purchase Orders
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'suppliers' ? 'bg-[var(--color-surface)] text-[var(--color-main)] shadow-sm' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]/60'}`}
            >
              Suppliers
            </button>
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30 group-focus-within:text-[var(--color-main)] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-12 pr-4 py-2.5 bg-[var(--color-text)]/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-main)]/20 transition-all font-sans"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-[var(--color-text)]/30 animate-pulse">Loading {activeTab} data...</div>
          ) : activeTab === 'requisitions' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">PR Code</th>
                  <th className="px-8 py-4">Department</th>
                  <th className="px-8 py-4">Item & Qty</th>
                  <th className="px-8 py-4">Required By</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {filteredRequisitions.map((pr) => (
                  <motion.tr 
                    key={pr.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[var(--color-text)]/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <p className="text-xs font-mono font-bold text-[var(--color-main)]">#{pr.id?.slice(0, 8)}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-[var(--color-text)] text-sm">{pr.departmentName || 'Unknown'}</p>
                      {pr.budget_code && <p className="text-[10px] text-[var(--color-text)]/40">{pr.budget_code}</p>}
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-[var(--color-text)] text-sm">{pr.item_name}</p>
                      <p className="text-[10px] text-[var(--color-text)]/40">{pr.quantity}</p>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-[var(--color-text)]/70">
                      {new Date(pr.required_date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4">
                      <Badge 
                        color={getStatusColor(pr.status) as any} 
                        label={pr.status.replace('_', ' ')} 
                        leftIcon={getStatusIcon(pr.status)}
                        className="text-[10px]"
                      />
                    </td>
                    <td className="px-8 py-4 text-right flex justify-end space-x-2">
                      {pr.status === 'pending_approval' && profile?.uid !== pr.createdBy && profile?.roles?.some(r => ['admin'].includes(r)) && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleApprovePR(pr.id); }}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                            title="Approve PR"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRejectPR(pr.id); }}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Reject PR"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'orders' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">PO Code</th>
                  <th className="px-8 py-4">Supplier</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Created</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {filteredOrders.map((order) => (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[var(--color-text)]/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-4">
                      <p className="text-xs font-mono font-bold text-[var(--color-main)]">#{order.id?.slice(0, 8)}</p>
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-[var(--color-text)] text-sm">{order.supplierName}</p>
                      <p className="text-[10px] text-[var(--color-text)]/40">{order.items?.length || 0} items</p>
                    </td>
                    <td className="px-8 py-4">
                      <Badge 
                        color={getStatusColor(order.status) as any} 
                        label={order.status} 
                        leftIcon={getStatusIcon(order.status)}
                        className="text-[10px]"
                      />
                    </td>
                    <td className="px-8 py-4 font-bold text-sm text-[var(--color-text)]">
                      ${(order.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-8 py-4 text-xs text-[var(--color-text)]/40">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-right flex justify-end space-x-2">
                      {order.status === 'pending_approval' && profile?.uid !== order.createdBy && profile?.roles?.some(r => ['admin'].includes(r)) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleApprovePO(order.id); }}
                          className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg transition-all"
                          title="Approve Purchase Order"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedPO(order); setIsPOModalOpen(true); }}
                        className="p-2 text-[var(--color-text)]/20 hover:text-[var(--color-main)] hover:bg-[var(--color-main)]/5 rounded-lg transition-all"
                        title="View Details"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[var(--color-text)]/30 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-8 py-4">Supplier Name</th>
                  <th className="px-8 py-4">Contact Details</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {filteredSuppliers.map((supplier) => (
                  <motion.tr 
                    key={supplier.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[var(--color-text)]/[0.02] transition-colors group"
                  >
                    <td className="px-8 py-4 font-bold text-sm text-[var(--color-text)]">
                      {supplier.name}
                      {supplier.certificate_url && (
                        <a href={supplier.certificate_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-main)] block font-normal hover:underline mt-1">
                          View License
                        </a>
                      )}
                    </td>
                    <td className="px-8 py-4 text-sm text-[var(--color-text)]/60">
                      <div>{supplier.contact}</div>
                      <div className="text-xs mt-1">{supplier.email || 'N/A'}</div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={supplier.status === 'active' ? 'success' : supplier.status === 'pending_approval' ? 'warning' : 'default'}>
                          {supplier.status === 'active' ? 'Active' : supplier.status === 'pending_approval' ? 'Pending' : 'Inactive'}
                        </Badge>
                        {supplier.is_authorized && <Badge variant="warning">Authorized</Badge>}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right flex justify-end space-x-2">
                      {supplier.status === 'pending_approval' && profile?.uid !== (supplier.createdBy || supplier.created_by) && ['admin', 'factory_manager'].includes(profile?.role || '') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleApproveSupplier(supplier.id); }}
                          className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg transition-all"
                          title="Approve Supplier"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedSupplier(supplier); setIsSupplierModalOpen(true); }}
                        className="p-2 text-[var(--color-text)]/20 hover:text-[var(--color-main)] hover:bg-[var(--color-main)]/5 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-2 text-[var(--color-text)]/20 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (activeTab === 'requisitions' ? filteredRequisitions.length : activeTab === 'orders' ? filteredOrders.length : filteredSuppliers.length) === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-[var(--color-text)]/5 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--color-text)]/20">
              <ShoppingCart size={32} />
            </div>
            <p className="text-[var(--color-text)]/40 font-medium">No results found for your search.</p>
          </div>
        )}
      </div>

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
