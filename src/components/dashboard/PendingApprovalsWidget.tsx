import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchCollection } from '../../utils/firestore';
import { CheckCircle2, Clock, X, ArrowRight, Check, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '../common/Badge';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { approveProductionPlan, rejectProductionPlan, approveProcurementPlan, rejectProcurementPlan, approveSalesPlan, rejectSalesPlan } from '../../services/planningService';
import { approveFinancialPlan, rejectFinancialPlan } from '../../services/financeService';
import { approvePurchaseOrder, approvePurchaseRequisition } from '../../services/procurementService';

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  status: string;
  date: string;
  createdBy: string;
  link: string;
  details?: {label: string, value: string}[];
}

const PendingApprovalsWidget: React.FC = () => {
  const { profile, isAdmin, can } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [unapprovedItems, setUnapprovedItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'action' | 'unapproved'>('action');
  const [rejectionItem, setRejectionItem] = useState<ApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const userRoles = (profile?.roles || []).map((r: string) => r.toLowerCase());
  const isApprover = isAdmin || userRoles.includes('ceo') || userRoles.includes('factory manager') || userRoles.includes('authorizer');


  const handleApproveItem = async (item: any) => {
    try {
      if (!profile?.uid) return;
      if (item.type === 'Production Plan') await approveProductionPlan(item.id, profile.uid);
      else if (item.type === 'Procurement Plan') await approveProcurementPlan(item.id, profile.uid);
      else if (item.type === 'Sales Plan') await approveSalesPlan(item.id, profile.uid);
      else if (item.type === 'Financial Plan') await approveFinancialPlan(item.id, profile.uid);
      else if (item.type === 'Purchase Order') await approvePurchaseOrder(item.id, profile.uid);
      else if (item.type === 'Purchase Requisition') await approvePurchaseRequisition(item.id, profile.uid);
      
      // refresh
      loadApprovals();
    } catch(err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const initiateReject = (item: ApprovalItem) => {
    setRejectionItem(item);
    setRejectionReason('');
  };

  const confirmReject = async () => {
    if (!profile?.uid || !rejectionItem) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    
    setRejecting(true);
    try {
      const { type, id } = rejectionItem;
      if (type === 'Production Plan') await rejectProductionPlan(id, profile.uid, rejectionReason);
      else if (type === 'Procurement Plan') await rejectProcurementPlan(id, profile.uid, rejectionReason);
      else if (type === 'Sales Plan') await rejectSalesPlan(id, profile.uid, rejectionReason);
      else if (type === 'Financial Plan') await rejectFinancialPlan(id, profile.uid, rejectionReason);
      else if (type === 'Purchase Order') await rejectPurchaseOrder(id, profile.uid, rejectionReason);
      else if (type === 'Purchase Requisition') await rejectPurchaseRequisition(id, profile.uid, rejectionReason);
      
      setRejectionItem(null);
      loadApprovals();
    } catch(err: any) {
      alert(err.message || 'Failed to reject');
    } finally {
      setRejecting(false);
    }
  };

  const loadApprovals = async () => {
    if (!profile?.companyId || !isApprover) {
      setLoading(false);
      return;
    }
    setLoading(true);
      try {
        const companyId = profile.companyId;
        
        // Fetch pending items across collections
        const [
          productionPlans,
          procurementPlans,
          salesPlans,
          financialPlans,
          requisitions,
          orders
        ] = await Promise.all([
          fetchCollection('productionPlans', companyId),
          fetchCollection('procurementPlans', companyId),
          fetchCollection('salesPlans', companyId),
          fetchCollection('financialPlans', companyId),
          fetchCollection('purchaseRequisitions', companyId),
          fetchCollection('purchaseOrders', companyId)
        ]);

        const mapped: ApprovalItem[] = [];
        const mappedUnapproved: ApprovalItem[] = [];

        const addItems = (data: any[], typeLabel: string, link: string, titleField: string | ((item: any) => string), detailsFn?: (item: any) => {label: string, value: any}[]) => {
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.status === 'approved' || !item.status) return;
              
              const isActionRequired = item.status === 'pending_approval' && item.createdBy !== profile.uid;
              
              const parsed = {
                id: item.id,
                type: typeLabel,
                title: typeof titleField === 'function' ? titleField(item) : item[titleField] || item.id,
                status: item.status,
                date: item.createdAt?.toDate?.()?.toLocaleDateString() || item.createdAt || new Date().toLocaleDateString(),
                createdBy: item.createdBy || 'Unknown',
                link,
                details: detailsFn ? detailsFn(item) : []
              };

              mappedUnapproved.push(parsed);
              if (isActionRequired) {
                mapped.push(parsed);
              }
            });
          }
        };

        addItems(productionPlans, 'Production Plan', '/production', (item) => `Year ${item.year}`, (item) => [
          { label: 'Total Qty', value: item.totalQuantity || item.total_quantity },
        ]);
        addItems(procurementPlans, 'Procurement Plan', '/procurement', (item) => `Year ${item.year}`, (item) => [
          { label: 'Total Qty', value: item.totalQuantity || item.total_quantity }
        ]);
        addItems(salesPlans, 'Sales Plan', '/sales', (item) => `Year ${item.year}`, (item) => [
          { label: 'Total Qty', value: item.totalQuantity || item.total_quantity }
        ]);
        addItems(financialPlans, 'Financial Plan', '/finance', (item) => `${item.quarter} ${item.year}`, (item) => [
          { label: 'Target Rev', value: item.targetRevenue },
          { label: 'Target Exp', value: item.targetExpense }
        ]);
        addItems(requisitions, 'Purchase Requisition', '/procurement', (item) => item.item_name || item.itemName || 'Requisition', (item) => [
          { label: 'Qty', value: item.quantity },
          { label: 'Required Date', value: item.required_date ? new Date(item.required_date).toLocaleDateString() : 'N/A' }
        ]);
        addItems(orders, 'Purchase Order', '/procurement', (item) => item.supplierName || 'Order', (item) => [
          { label: 'Total Amount', value: item.totalAmount || item.total_amount },
          { label: 'Items', value: item.items?.length || 0 }
        ]);

        setItems(mapped);
        setUnapprovedItems(mappedUnapproved);
      } catch (err) {
        console.error('Failed to load pending approvals', err);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadApprovals();
  }, [profile?.companyId, isApprover, profile?.uid]);

  if (!isApprover) return null;
  if (loading) return null; // Don't block UI while loading widget

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600 transition-all flex items-center justify-between mb-8 group"
      >
        <div className="flex items-center space-x-4 relative z-10">
          <div className="p-3 bg-amber-100 dark:bg-amber-800/50 rounded-full text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={24} />
          
      {rejectionItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl w-full max-w-md border border-[var(--color-text)]/10">
            <h3 className="text-xl font-bold mb-2 text-[var(--color-text)]">Reject {rejectionItem.type}</h3>
            <p className="text-[var(--color-text)]/70 mb-4 text-sm">Please provide a reason for rejecting this document so the creator knows what to fix.</p>
            <textarea
              className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl p-3 text-[var(--color-text)] min-h-[100px] mb-6 focus:outline-none focus:border-[var(--color-main)]"
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={rejecting}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRejectionItem(null)}
                className="px-4 py-2 rounded-xl text-[var(--color-text)]/70 hover:bg-[var(--color-text)]/5 font-medium"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold disabled:opacity-50"
                disabled={rejecting || !rejectionReason.trim()}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
</div>
          <div>
            <h3 className="font-serif font-bold text-lg text-amber-900 dark:text-amber-100">{t('Action Required: Pending Approvals')}</h3>
            <p className="text-amber-700/80 dark:text-amber-300/80 text-sm">{t('You have items waiting for your review and approval.')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">
            {items.length}
          </div>
          <ArrowRight className="text-amber-500/50 group-hover:text-amber-500 transition-colors" />
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--color-surface)] rounded-3xl shadow-2xl w-full max-w-2xl border border-[var(--color-border)] max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)]/50 bg-[var(--color-bg)]/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                    <CheckCircle2 size={20} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">
                    {t('Approvals Dashboard')}
                  </h3>
                </div>
                
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--color-text)]/50 hover:text-[var(--color-text)] hover:bg-[var(--color-text)]/5 p-2 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex px-6 pt-4 space-x-4 border-b border-[var(--color-border)]/50 bg-[var(--color-bg)]/20">
                <button 
                  onClick={() => setActiveTab('action')}
                  className={`pb-3 font-bold text-sm px-2 flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'action' ? 'border-amber-500 text-amber-600' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
                >
                  <span>{t('Action Required')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'action' ? 'bg-amber-500 text-white' : 'bg-[var(--color-text)]/10'}`}>
                    {items.length}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('unapproved')}
                  className={`pb-3 font-bold text-sm px-2 flex items-center space-x-2 border-b-2 transition-colors ${activeTab === 'unapproved' ? 'border-amber-500 text-amber-600' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
                >
                  <span>{t('All Unapproved')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'unapproved' ? 'bg-amber-500 text-white' : 'bg-[var(--color-text)]/10'}`}>
                    {unapprovedItems.length}
                  </span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {(activeTab === 'action' ? items : unapprovedItems).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--color-bg)]/50 rounded-2xl border border-dashed border-[var(--color-border)]">
                    <CheckCircle2 size={48} className="text-[var(--color-text)]/20 mb-4" />
                    <p className="text-[var(--color-text)]/60 font-medium">
                      {activeTab === 'action' ? t('No pending approvals at this time.') : t('No unapproved items found.')}
                    </p>
                    <p className="text-[var(--color-text)]/40 text-sm mt-1">
                      {activeTab === 'action' ? t('You are all caught up!') : t('Everything looks up to date.')}
                    </p>
                  </div>
                ) : (
                  (activeTab === 'action' ? items : unapprovedItems).map(item => (
                    <div key={`${item.type}-${item.id}`} className="flex justify-between items-center bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-border)]/50 hover:border-amber-300 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--color-text)]/50 uppercase tracking-wider">{t(item.type)}</span>
                          <Badge status={item.status} />
                        </div>
                        
                        <p className="font-bold text-[var(--color-text)]">{item.title}</p>
                        {item.details && item.details.length > 0 && (
                          <div className="flex gap-4 mt-2">
                            {item.details.map((d: any, idx: number) => (
                              <div key={idx} className="bg-[var(--color-text)]/5 px-2 py-1 rounded-md text-xs">
                                <span className="text-[var(--color-text)]/50 mr-1">{t(d.label)}:</span>
                                <span className="font-medium text-[var(--color-text)]/80">{d.value}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-[var(--color-text)]/40 mt-1">Submitted: {item.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTab === 'action' && item.createdBy !== profile?.uid && (
                          <>
                            <button 
                              onClick={() => handleApproveItem(item)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors font-medium text-sm"
                            >
                              <Check size={16} />
                              {t('Approve')}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); initiateReject(item); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-medium text-sm"
                            >
                              <XCircle size={16} />
                              {t('Reject')}
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setIsModalOpen(false);
                            router.push(item.link);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-lg hover:bg-[var(--color-main)]/20 transition-colors font-medium text-sm"
                        >
                          {t('Review')}
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      {rejectionItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--color-surface)] p-6 rounded-2xl w-full max-w-md border border-[var(--color-text)]/10">
            <h3 className="text-xl font-bold mb-2 text-[var(--color-text)]">Reject {rejectionItem.type}</h3>
            <p className="text-[var(--color-text)]/70 mb-4 text-sm">Please provide a reason for rejecting this document so the creator knows what to fix.</p>
            <textarea
              className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl p-3 text-[var(--color-text)] min-h-[100px] mb-6 focus:outline-none focus:border-[var(--color-main)]"
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={rejecting}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setRejectionItem(null)}
                className="px-4 py-2 rounded-xl text-[var(--color-text)]/70 hover:bg-[var(--color-text)]/5 font-medium"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold disabled:opacity-50"
                disabled={rejecting || !rejectionReason.trim()}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      </AnimatePresence>
    </>
  );
};

export default PendingApprovalsWidget;
