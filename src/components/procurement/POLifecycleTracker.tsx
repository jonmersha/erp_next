import React, { useState, useEffect } from 'react';
import { getPOLifecycle, approvePurchaseOrder } from '../../services/procurementService';
import { createGoodsReceiptNote, createFinanceInvoice } from '../../services/logisticsService';
import { 
  CheckCircle2, 
  ArrowRight,
  FileText,
  Truck,
  Box,
  ShieldCheck,
  CreditCard,
  Loader2
} from 'lucide-react';
import Badge from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useProcurementData } from '../../hooks/useProcurementData';
import WeighbridgeModal from '../../modals/WeighbridgeModal';
import GRNModal from '../../modals/GRNModal';
import QualityInspectionModal from '../../modals/QualityInspectionModal';

interface POLifecycleTrackerProps {
  orderId: string;
  onClose: () => void;
}

export default function POLifecycleTracker({ orderId, onClose }: POLifecycleTrackerProps) {
  const { profile } = useAuth();
  const { orders, warehouses } = useProcurementData();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [showWeighbridgeModal, setShowWeighbridgeModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // GRN form state (GRNModal requires external state)
  const [grnSelectedPO, setGrnSelectedPO] = useState<any>(null);
  const [grnForm, setGrnForm] = useState({ warehouseId: '', notes: '' });
  const [grnSubmitting, setGrnSubmitting] = useState(false);

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', dueDate: '' });

  useEffect(() => {
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getPOLifecycle(orderId);
      setData(result);
    } catch (error) {
      console.error('Failed to fetch lifecycle:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Action Handlers ───────────────────────────────────────────────

  /** Step 1: Approve the PO (Maker-Checker enforced) */
  const handleApprovePO = async () => {
    if (!profile?.uid) return;
    // Maker-Checker: creator cannot approve
    if (profile.uid === data.po.created_by) {
      showToast('You cannot approve a PO you created (Maker-Checker rule).', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await approvePurchaseOrder(orderId, profile.uid);
      showToast('Purchase Order approved successfully!', 'success');
      await fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to approve PO', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  /** Step 2: Open Weighbridge Modal */
  const handleOpenWeighbridge = () => {
    setShowWeighbridgeModal(true);
  };

  /** Step 3: Open GRN Modal */
  const handleOpenGRN = () => {
    // Pre-select the current PO in the GRN modal
    const currentPO = orders.find(o => o.id === orderId) || {
      id: data.po.id,
      supplierName: data.po.supplierName,
      status: data.po.status,
      items: data.poItems?.map((item: any) => ({
        itemName: item.item_name || item.itemName || 'Item',
        quantity: item.quantity
      })) || []
    };
    setGrnSelectedPO(currentPO);
    setGrnForm({ warehouseId: '', notes: '' });
    setShowGRNModal(true);
  };

  /** Step 3: Submit GRN */
  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrnSubmitting(true);
    try {
      await createGoodsReceiptNote({
        purchase_order_id: orderId,
        warehouse_id: grnForm.warehouseId,
        notes: grnForm.notes
      }, profile);
      showToast('GRN created successfully!', 'success');
      setShowGRNModal(false);
      await fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to create GRN', 'error');
    } finally {
      setGrnSubmitting(false);
    }
  };

  /** Step 4: Open Quality Inspection Modal */
  const handleOpenQC = () => {
    setShowQCModal(true);
  };

  /** Step 5: Open Invoice Modal */
  const handleOpenInvoice = () => {
    setInvoiceForm({ 
      amount: data.po.total_amount?.toString() || '', 
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowInvoiceModal(true);
  };

  /** Step 5: Submit Invoice */
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createFinanceInvoice({
        orderId: orderId,
        orderType: 'purchase',
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
        status: 'issued'
      }, profile);
      showToast('Invoice created successfully!', 'success');
      setShowInvoiceModal(false);
      await fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to create invoice', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 text-center text-[var(--color-text)]/60 flex items-center justify-center gap-2">
        <Loader2 size={20} className="animate-spin" /> Loading lifecycle data...
      </div>
    );
  }

  if (!data || !data.po) {
    return <div className="p-8 text-center text-red-500">Failed to load purchase order data.</div>;
  }

  const { po, poItems, weighbridgeLogs, grns, qualityChecks, invoices } = data;

  // Determine state
  const isApproved = po.status === 'approved' || po.status === 'shipped' || po.status === 'received';
  const hasWeighbridge = weighbridgeLogs && weighbridgeLogs.length > 0;
  const hasGrn = grns && grns.length > 0;
  const hasQc = qualityChecks && qualityChecks.length > 0;
  const hasInvoice = invoices && invoices.length > 0;

  const steps = [
    {
      id: 1,
      title: 'Requisition & PO',
      icon: <FileText size={20} />,
      status: isApproved ? 'complete' : 'current',
      details: isApproved ? `Approved PO #${po.id.substring(0, 8)}` : `Status: ${po.status}`,
      actionLabel: (!isApproved && po.status === 'pending_approval' && (profile?.roles?.includes('factory_manager') || profile?.roles?.includes('admin'))) 
        ? 'Approve PO' : null,
      onAction: handleApprovePO
    },
    {
      id: 2,
      title: 'Inbound Logistics',
      icon: <Truck size={20} />,
      status: hasWeighbridge ? 'complete' : (isApproved ? 'current' : 'pending'),
      details: hasWeighbridge ? `Truck ${weighbridgeLogs[0].truck_plate} – ${Number(weighbridgeLogs[0].gross_weight).toLocaleString()} KG` : 'Waiting for supplier dispatch',
      actionLabel: (!hasWeighbridge && isApproved) ? 'Log Weighbridge' : null,
      onAction: handleOpenWeighbridge
    },
    {
      id: 3,
      title: 'Goods Receipt Note',
      icon: <Box size={20} />,
      status: hasGrn ? 'complete' : (hasWeighbridge ? 'current' : 'pending'),
      details: hasGrn ? `GRN #${grns[0].id.substring(0, 8)} (${grns[0].status})` : 'Awaiting physical receipt',
      actionLabel: (!hasGrn && hasWeighbridge) ? 'Create GRN' : null,
      onAction: handleOpenGRN
    },
    {
      id: 4,
      title: 'Quality Inspection',
      icon: <ShieldCheck size={20} />,
      status: hasQc ? 'complete' : (hasGrn ? 'current' : 'pending'),
      details: hasQc ? `QC: ${qualityChecks[0].status}` : 'Pending inspection',
      actionLabel: (!hasQc && hasGrn) ? 'Log Inspection' : null,
      onAction: handleOpenQC
    },
    {
      id: 5,
      title: 'Financial Settlement',
      icon: <CreditCard size={20} />,
      status: hasInvoice ? 'complete' : (hasQc ? 'current' : 'pending'),
      details: hasInvoice ? `Invoice ${invoices[0].status} – $${Number(invoices[0].amount).toLocaleString()}` : 'Pending 3-way match',
      actionLabel: (!hasInvoice && hasQc) ? 'Process Invoice' : null,
      onAction: handleOpenInvoice
    }
  ];

  const completedCount = steps.filter(s => s.status === 'complete').length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <>
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-text)]/5 shadow-sm p-6 mb-6">
        {/* Toast */}
        {toast && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : null}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <button 
              onClick={onClose}
              className="text-[var(--color-text)]/40 hover:text-[var(--color-text)] flex items-center gap-1 text-sm font-medium mb-4 transition-colors"
            >
              <ArrowRight size={16} className="rotate-180" /> Back to Orders
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-light text-[var(--color-text)]">
                PO Lifecycle Tracker
              </h2>
              <Badge status={po.status} />
            </div>
            <p className="text-[var(--color-text)]/60 text-sm mt-1">
              Tracking order <span className="font-mono bg-[var(--color-text)]/5 px-1 py-0.5 rounded text-xs">{po.id.substring(0, 8)}</span> from {po.supplierName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40">Progress</p>
            <p className="text-2xl font-light text-[var(--color-main)]">{completedCount}/{steps.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="w-full h-1.5 bg-[var(--color-text)]/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--color-main)] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="absolute top-6 left-8 right-8 h-0.5 bg-[var(--color-text)]/5 hidden md:block" />
          <div 
            className="absolute top-6 left-8 h-0.5 bg-[var(--color-main)] hidden md:block transition-all duration-1000" 
            style={{ width: `${(completedCount / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 64px)' }}
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${
                    step.status === 'complete' 
                      ? 'bg-[var(--color-main)] text-[var(--color-bg)]' 
                      : step.status === 'current'
                        ? 'bg-[var(--color-main)]/10 text-[var(--color-main)] border-2 border-[var(--color-main)]'
                        : 'bg-[var(--color-text)]/5 text-[var(--color-text)]/30'
                  }`}
                >
                  {step.status === 'complete' ? <CheckCircle2 size={24} /> : step.icon}
                </div>
                
                <h4 className={`font-bold text-sm mb-1 ${step.status === 'pending' ? 'text-[var(--color-text)]/40' : 'text-[var(--color-text)]'}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-[var(--color-text)]/60 mb-4 h-8">
                  {step.details}
                </p>

                {step.actionLabel && (
                  <button 
                    onClick={step.onAction}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading && <Loader2 size={12} className="animate-spin" />}
                    {step.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Order Value</h5>
            <p className="text-2xl font-light text-[var(--color-text)]">${Number(po.total_amount).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Items</h5>
            <p className="text-2xl font-light text-[var(--color-text)]">{poItems?.length || 0} Products</p>
          </div>
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Last Updated</h5>
            <p className="text-xl font-light text-[var(--color-text)]">{new Date(po.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────── */}

      {/* Step 2: Weighbridge Modal */}
      <WeighbridgeModal
        isOpen={showWeighbridgeModal}
        onClose={() => setShowWeighbridgeModal(false)}
        onSuccess={() => {
          setShowWeighbridgeModal(false);
          showToast('Weighbridge log created successfully!', 'success');
          fetchData();
        }}
        purchaseOrders={orders.length > 0 ? orders : [{ id: orderId, supplierName: po.supplierName, status: po.status } as any]}
        defaultReferenceId={orderId}
      />

      {/* Step 3: GRN Modal */}
      <GRNModal
        isOpen={showGRNModal}
        onClose={() => setShowGRNModal(false)}
        selectedPO={grnSelectedPO}
        setSelectedPO={setGrnSelectedPO}
        pendingPOs={orders.filter(o => o.status === 'approved')}
        warehouses={warehouses}
        grnForm={grnForm}
        setGrnForm={setGrnForm}
        onSubmit={handleSubmitGRN}
        submitting={grnSubmitting}
      />

      {/* Step 4: Quality Inspection Modal */}
      <QualityInspectionModal
        isOpen={showQCModal}
        onClose={() => setShowQCModal(false)}
        onSuccess={() => {
          setShowQCModal(false);
          showToast('Quality inspection logged successfully!', 'success');
          fetchData();
        }}
        logs={weighbridgeLogs || []}
        defaultLogId={hasWeighbridge ? weighbridgeLogs[0].id : undefined}
      />

      {/* Step 5: Invoice Modal (inline) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--color-bg)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-text)]/10">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-text)]/10">
              <h2 className="text-2xl font-serif font-bold text-[var(--color-main)] flex items-center gap-2">
                <CreditCard size={24} />
                Process Invoice (3-Way Match)
              </h2>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-[var(--color-text)]/40 hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5 rounded-full transition-all">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-6">
              {/* 3-Way Match Summary */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <p className="text-sm font-bold text-emerald-800">3-Way Match Verification</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-emerald-600 font-medium">Purchase Order</p>
                    <p className="font-bold text-emerald-800">${Number(po.total_amount).toLocaleString()}</p>
                    <CheckCircle2 size={14} className="mx-auto mt-1 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-600 font-medium">GRN</p>
                    <p className="font-bold text-emerald-800">{hasGrn ? 'Received' : 'N/A'}</p>
                    {hasGrn ? <CheckCircle2 size={14} className="mx-auto mt-1 text-emerald-500" /> : null}
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-600 font-medium">Quality</p>
                    <p className="font-bold text-emerald-800">{hasQc ? qualityChecks[0].status : 'N/A'}</p>
                    {hasQc ? <CheckCircle2 size={14} className="mx-auto mt-1 text-emerald-500" /> : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">Invoice Amount *</label>
                <input 
                  type="number" step="0.01" min="0"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 font-mono text-lg text-[var(--color-text)]"
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
                  required
                />
                <p className="text-xs text-[var(--color-text)]/40">PO amount: ${Number(po.total_amount).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">Due Date *</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
                  value={invoiceForm.dueDate}
                  onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
                  required
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-[var(--color-text)]/10">
                <button 
                  type="button" 
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-main)]/20 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>{actionLoading ? 'Processing...' : 'Issue Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
