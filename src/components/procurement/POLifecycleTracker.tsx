import React, { useState, useEffect } from 'react';
import { getPOLifecycle, approvePurchaseOrder } from '../../services/procurementService';
import { createFinanceInvoice } from '../../services/logisticsService';
import { 
  CheckCircle2, 
  ArrowRight,
  FileText,
  Truck,
  Box,
  ShieldCheck,
  CreditCard,
  Loader2,
  Plus,
  AlertCircle
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
  const [selectedQCLogId, setSelectedQCLogId] = useState<string | undefined>(undefined);

  // GRN form state
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

  const handleApprovePO = async () => {
    if (!profile?.uid) return;
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

  const handleOpenWeighbridge = () => setShowWeighbridgeModal(true);

  const handleOpenGRN = () => {
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

  const handleSubmitGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrnSubmitting(true);
    try {
      const { createGoodsReceiptNote } = await import('../../services/logisticsService');
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

  const handleOpenQCForLog = (logId: string) => {
    setSelectedQCLogId(logId);
    setShowQCModal(true);
  };

  const handleOpenInvoice = () => {
    setInvoiceForm({ 
      amount: data.po.total_amount?.toString() || '', 
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowInvoiceModal(true);
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createFinanceInvoice({
        orderId, orderType: 'purchase',
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

  const { po, poItems, weighbridgeLogs, qualityInspections = [], grns, qualityChecks, invoices, summary = {} } = data;

  const isApproved = po.status === 'approved' || po.status === 'shipped' || po.status === 'received';
  const hasWeighbridge = weighbridgeLogs && weighbridgeLogs.length > 0;
  const hasGrn = grns && grns.length > 0;
  const hasInvoice = invoices && invoices.length > 0;

  // Per-load inspection map
  const inspectionByLogId = new Map<string, any>();
  (qualityInspections || []).forEach((qi: any) => {
    inspectionByLogId.set(qi.weighbridge_log_id, qi);
  });

  const allLoadsInspected = hasWeighbridge && weighbridgeLogs.every((wl: any) => inspectionByLogId.has(wl.id));
  const totalOrderedQty = summary.totalOrderedQty || poItems?.reduce((s: number, i: any) => s + Number(i.quantity), 0) || 0;
  const totalReceivedWeight = summary.totalReceivedWeight || weighbridgeLogs?.reduce((s: number, l: any) => s + Number(l.net_weight || l.gross_weight || 0), 0) || 0;

  const steps = [
    {
      id: 1, title: 'Requisition & PO', icon: <FileText size={20} />,
      status: isApproved ? 'complete' : 'current',
      details: isApproved ? `Approved PO #${po.id.substring(0, 8)}` : `Status: ${po.status}`,
      actionLabel: (!isApproved && po.status === 'pending_approval' && (profile?.roles?.includes('factory_manager') || profile?.roles?.includes('admin'))) ? 'Approve PO' : null,
      onAction: handleApprovePO
    },
    {
      id: 2, title: 'Inbound Logistics', icon: <Truck size={20} />,
      status: (hasWeighbridge && totalReceivedWeight >= totalOrderedQty) ? 'complete' : (isApproved ? 'current' : 'pending'),
      details: hasWeighbridge 
        ? `${weighbridgeLogs.length} load(s) – ${totalReceivedWeight.toLocaleString()} / ${totalOrderedQty.toLocaleString()} KG`
        : 'Waiting for supplier dispatch',
      actionLabel: (isApproved && totalReceivedWeight < totalOrderedQty) ? 'Log Weighbridge' : (isApproved && hasWeighbridge ? 'Add Another Load' : null),
      onAction: handleOpenWeighbridge
    },
    {
      id: 3, title: 'Goods Receipt Note', icon: <Box size={20} />,
      status: hasGrn ? 'complete' : (hasWeighbridge ? 'current' : 'pending'),
      details: hasGrn ? `GRN #${grns[0].id.substring(0, 8)} (${grns[0].status})` : 'Awaiting physical receipt',
      actionLabel: (!hasGrn && hasWeighbridge) ? 'Create GRN' : null,
      onAction: handleOpenGRN
    },
    {
      id: 4, title: 'Quality Inspection', icon: <ShieldCheck size={20} />,
      status: allLoadsInspected ? 'complete' : (hasWeighbridge ? 'current' : 'pending'),
      details: hasWeighbridge 
        ? `${(qualityInspections || []).length} / ${weighbridgeLogs.length} loads inspected`
        : 'Pending inspection',
      actionLabel: null, // Actions are per-load in the detail table below
      onAction: () => {}
    },
    {
      id: 5, title: 'Financial Settlement', icon: <CreditCard size={20} />,
      status: hasInvoice ? 'complete' : (allLoadsInspected ? 'current' : 'pending'),
      details: hasInvoice ? `Invoice ${invoices[0].status} – $${Number(invoices[0].amount).toLocaleString()}` : 'Pending 3-way match',
      actionLabel: (!hasInvoice && allLoadsInspected) ? 'Process Invoice' : null,
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
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <button onClick={onClose} className="text-[var(--color-text)]/40 hover:text-[var(--color-text)] flex items-center gap-1 text-sm font-medium mb-4 transition-colors">
              <ArrowRight size={16} className="rotate-180" /> Back to Orders
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-light text-[var(--color-text)]">PO Lifecycle Tracker</h2>
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
            <div className="h-full bg-[var(--color-main)] rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="absolute top-6 left-8 right-8 h-0.5 bg-[var(--color-text)]/5 hidden md:block" />
          <div className="absolute top-6 left-8 h-0.5 bg-[var(--color-main)] hidden md:block transition-all duration-1000" 
            style={{ width: `${(completedCount / (steps.length - 1)) * 100}%`, maxWidth: 'calc(100% - 64px)' }} />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all ${
                  step.status === 'complete' ? 'bg-[var(--color-main)] text-[var(--color-bg)]' 
                    : step.status === 'current' ? 'bg-[var(--color-main)]/10 text-[var(--color-main)] border-2 border-[var(--color-main)]'
                    : 'bg-[var(--color-text)]/5 text-[var(--color-text)]/30'
                }`}>
                  {step.status === 'complete' ? <CheckCircle2 size={24} /> : step.icon}
                </div>
                <h4 className={`font-bold text-sm mb-1 ${step.status === 'pending' ? 'text-[var(--color-text)]/40' : 'text-[var(--color-text)]'}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-[var(--color-text)]/60 mb-4 h-8">{step.details}</p>
                {step.actionLabel && (
                  <button onClick={step.onAction} disabled={actionLoading}
                    className="px-4 py-2 bg-[var(--color-text)] text-[var(--color-bg)] text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1">
                    {actionLoading && <Loader2 size={12} className="animate-spin" />}
                    {step.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Inbound Loads & Quality Table ─────────────────────────── */}
        {hasWeighbridge && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Inbound Loads & Quality</h3>
              {isApproved && (
                <button onClick={handleOpenWeighbridge}
                  className="px-3 py-1.5 bg-[var(--color-main)]/10 text-[var(--color-main)] text-xs font-bold rounded-lg hover:bg-[var(--color-main)]/20 transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add Load
                </button>
              )}
            </div>
            <div className="overflow-x-auto border border-[var(--color-text)]/10 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-text)]/[0.03]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">#</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">Truck</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">Driver</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">Gross (KG)</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">Net (KG)</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">Entry Time</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">QC Status</th>
                    <th className="px-4 py-3 font-bold text-[var(--color-text)]/50 text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {weighbridgeLogs.map((log: any, idx: number) => {
                    const inspection = inspectionByLogId.get(log.id);
                    return (
                      <tr key={log.id} className="border-t border-[var(--color-text)]/5 hover:bg-[var(--color-text)]/[0.02]">
                        <td className="px-4 py-3 text-[var(--color-text)]/60">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-[var(--color-text)]">{log.truck_plate}</td>
                        <td className="px-4 py-3 text-[var(--color-text)]/70">{log.driver_name || '–'}</td>
                        <td className="px-4 py-3 text-[var(--color-text)]">{Number(log.gross_weight || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-[var(--color-text)]">{log.net_weight ? Number(log.net_weight).toLocaleString() : '–'}</td>
                        <td className="px-4 py-3 text-[var(--color-text)]/60 text-xs">{new Date(log.entry_time).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {inspection ? (
                            <Badge status={inspection.status === 'Approved' ? 'approved' : inspection.status === 'Rejected' ? 'rejected' : 'pending'} />
                          ) : (
                            <span className="text-xs text-amber-500 font-medium">Not inspected</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!inspection && (
                            <button onClick={() => handleOpenQCForLog(log.id)}
                              className="px-3 py-1.5 bg-blue-500/10 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-500/20 transition-colors">
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[var(--color-text)]/[0.03] border-t border-[var(--color-text)]/10">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-sm text-[var(--color-text)]/60">Total Received:</td>
                    <td className="px-4 py-3 font-bold text-[var(--color-main)]">{totalReceivedWeight.toLocaleString()} KG</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text)]/40">Ordered: {totalOrderedQty.toLocaleString()} KG</td>
                    <td colSpan={2} className="px-4 py-3">
                      {totalReceivedWeight >= totalOrderedQty ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Fully Received</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600">
                          {((totalReceivedWeight / totalOrderedQty) * 100).toFixed(0)}% received
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Order Value</h5>
            <p className="text-2xl font-light text-[var(--color-text)]">${Number(po.total_amount).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Ordered Qty</h5>
            <p className="text-2xl font-light text-[var(--color-text)]">{totalOrderedQty.toLocaleString()} KG</p>
          </div>
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Received</h5>
            <p className={`text-2xl font-light ${totalReceivedWeight >= totalOrderedQty ? 'text-emerald-600' : 'text-amber-500'}`}>
              {totalReceivedWeight.toLocaleString()} KG
            </p>
          </div>
          <div className="p-4 bg-[var(--color-text)]/[0.02] border border-[var(--color-text)]/5 rounded-xl">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]/40 mb-2">Items</h5>
            <p className="text-2xl font-light text-[var(--color-text)]">{poItems?.length || 0} Products</p>
          </div>
        </div>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────── */}

      <WeighbridgeModal
        isOpen={showWeighbridgeModal}
        onClose={() => setShowWeighbridgeModal(false)}
        onSuccess={() => { setShowWeighbridgeModal(false); showToast('Weighbridge log created!', 'success'); fetchData(); }}
        purchaseOrders={orders.length > 0 ? orders : [{ id: orderId, supplierName: po.supplierName, status: po.status } as any]}
        defaultReferenceId={orderId}
        totalOrderedQty={totalOrderedQty}
        totalReceivedWeight={totalReceivedWeight}
      />

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

      <QualityInspectionModal
        isOpen={showQCModal}
        onClose={() => setShowQCModal(false)}
        onSuccess={() => { setShowQCModal(false); showToast('Quality inspection logged!', 'success'); fetchData(); }}
        logs={weighbridgeLogs || []}
        defaultLogId={selectedQCLogId}
      />

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--color-bg)] rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-text)]/10">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-text)]/10">
              <h2 className="text-2xl font-serif font-bold text-[var(--color-main)] flex items-center gap-2">
                <CreditCard size={24} /> Process Invoice (3-Way Match)
              </h2>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 text-[var(--color-text)]/40 hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5 rounded-full transition-all">✕</button>
            </div>
            <form onSubmit={handleSubmitInvoice} className="p-6 space-y-6">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <p className="text-sm font-bold text-emerald-800">3-Way Match Verification</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-emerald-600 font-medium">PO</p>
                    <p className="font-bold text-emerald-800">${Number(po.total_amount).toLocaleString()}</p>
                    <CheckCircle2 size={14} className="mx-auto mt-1 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-600 font-medium">Received</p>
                    <p className="font-bold text-emerald-800">{totalReceivedWeight.toLocaleString()} KG</p>
                    <CheckCircle2 size={14} className="mx-auto mt-1 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-600 font-medium">QC</p>
                    <p className="font-bold text-emerald-800">{(qualityInspections || []).length} inspected</p>
                    {allLoadsInspected && <CheckCircle2 size={14} className="mx-auto mt-1 text-emerald-500" />}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">Invoice Amount *</label>
                <input type="number" step="0.01" min="0" required
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 font-mono text-lg text-[var(--color-text)]"
                  value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} />
                <p className="text-xs text-[var(--color-text)]/40">PO amount: ${Number(po.total_amount).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--color-text)]/70">Due Date *</label>
                <input type="date" required
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-text)]/20 rounded-xl focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
                  value={invoiceForm.dueDate} onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-[var(--color-text)]/10">
                <button type="button" onClick={() => setShowInvoiceModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-all">Cancel</button>
                <button type="submit" disabled={actionLoading}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-[var(--color-main)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-main)]/20 hover:scale-[1.02] transition-all disabled:opacity-50">
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
