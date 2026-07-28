import React, { useState, useEffect } from 'react';
import { Invoice, Payment, FinancialPlan } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, FileText, Loader2, TrendingUp, Plus, Edit2, CheckCircle, XCircle, Send } from 'lucide-react';
import { getInvoices, getPayments, getFinancialPlans, addFinancialPlan, updateFinancialPlan, approveFinancialPlan, rejectFinancialPlan } from '../../services/financeService';
import OperationalCosts from '../../components/finance/OperationalCosts';
import FinancialPlanModal from '../../modals/FinancialPlanModal';
import Badge from '../../components/common/Badge';
import { useTranslation } from 'react-i18next';

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { profile, can } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'>('Q1');
  const [editingPlan, setEditingPlan] = useState<FinancialPlan | undefined>(undefined);

  useEffect(() => {
    fetchData();
  }, [profile?.companyId]);

  const fetchData = async () => {
    if (!profile?.companyId) return;
    setLoading(true);
    try {
      const [invData, payData, planData] = await Promise.all([
        getInvoices(profile.companyId),
        getPayments(profile.companyId),
        getFinancialPlans(profile.companyId)
      ]);
      setInvoices(invData);
      setPayments(payData);
      setPlans(planData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (planData: Partial<FinancialPlan>) => {
    if (!profile?.companyId) return;
    try {
      if (editingPlan) {
        await updateFinancialPlan(editingPlan.id, planData);
      } else {
        await addFinancialPlan({
          ...planData as Omit<FinancialPlan, 'id'>,
          companyId: profile.companyId,
          createdBy: profile.uid
        });
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to save plan', error);
    }
  };

  const handleSubmitPlan = async (plan: FinancialPlan) => {
    try {
      await updateFinancialPlan(plan.id, { status: 'pending_approval' });
      await fetchData();
    } catch (error) {
      console.error('Failed to submit plan', error);
    }
  };

  const handleApprove = async (plan: FinancialPlan) => {
    if (!profile?.uid || plan.createdBy === profile.uid) {
      alert(t('You cannot approve your own submission.'));
      return;
    }
    try {
      await approveFinancialPlan(plan.id, profile.uid);
      await fetchData();
    } catch (error) {
      console.error('Failed to approve', error);
    }
  };

  const handleReject = async (plan: FinancialPlan) => {
    if (!profile?.uid || plan.createdBy === profile.uid) {
      alert(t('You cannot reject your own submission.'));
      return;
    }
    try {
      await rejectFinancialPlan(plan.id, profile.uid);
      await fetchData();
    } catch (error) {
      console.error('Failed to reject', error);
    }
  };

  const openPlanModal = (quarter: 'Q1'|'Q2'|'Q3'|'Q4', plan?: FinancialPlan) => {
    setSelectedQuarter(quarter);
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const yearlyPlans = plans.filter(p => p.year === currentYear);
  const canWriteFinance = can('write', 'finance');

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Finance')}</h2>
        <p className="text-[var(--color-text)]/40 mt-1">{t('Financial reports, invoices, payments, and yearly plans')}</p>
      </header>

      <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-[var(--color-main)]" />
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{t('Financial Plan')} ({currentYear})</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => {
            const plan = yearlyPlans.find(p => p.quarter === q);
            return (
              <div key={q} className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 flex flex-col justify-between min-h-[160px]">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-[var(--color-text)] text-lg">{q}</p>
                    {plan && <Badge status={plan.status || 'draft'} />}
                  </div>
                  {plan ? (
                    <>
                      <p className="text-sm text-[var(--color-text)]/60 font-medium">{t('Revenue')}: <span className="text-[var(--color-text)]">${plan.targetRevenue.toLocaleString()}</span></p>
                      <p className="text-sm text-[var(--color-text)]/60 font-medium">{t('Expense')}: <span className="text-[var(--color-text)]">${plan.targetExpense.toLocaleString()}</span></p>
                    </>
                  ) : (
                    <p className="text-sm text-[var(--color-text)]/40 italic">{t('No plan created')}</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  {!plan && canWriteFinance && (
                    <button onClick={() => openPlanModal(q)} className="text-[var(--color-main)] hover:bg-[var(--color-main)]/10 p-1.5 rounded-lg transition-colors">
                      <Plus size={18} />
                    </button>
                  )}
                  {plan && plan.status === 'draft' && canWriteFinance && (
                    <>
                      <button onClick={() => openPlanModal(q, plan)} className="text-[var(--color-main)] hover:bg-[var(--color-main)]/10 p-1.5 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleSubmitPlan(plan)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title={t('Submit for Approval')}>
                        <Send size={18} />
                      </button>
                    </>
                  )}
                  {plan && plan.status === 'pending_approval' && canWriteFinance && plan.createdBy !== profile?.uid && (
                    <>
                      <button onClick={() => handleApprove(plan)} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors" title={t('Approve')}>
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => handleReject(plan)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title={t('Reject')}>
                        <XCircle size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <FileText className="text-[var(--color-main)]" />
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{t('Invoices')}</h3>
          </div>
          <div className="space-y-4">
            {invoices.map(inv => (
              <div key={inv.id} className="flex justify-between items-center p-4 bg-[var(--color-bg)] rounded-xl">
                <div>
                  <p className="font-bold text-[var(--color-text)]">{t('Order')} #{inv.orderId.slice(-4)}</p>
                  <p className="text-xs text-[var(--color-text)]/40">{inv.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-text)]">${inv.amount.toLocaleString()}</p>
                  <p className={`text-xs font-bold uppercase ${inv.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{t(inv.status)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex items-center space-x-2 mb-6">
            <CreditCard className="text-[var(--color-main)]" />
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{t('Payments')}</h3>
          </div>
          <div className="space-y-4">
            {payments.map(pay => (
              <div key={pay.id} className="flex justify-between items-center p-4 bg-[var(--color-bg)] rounded-xl">
                <div>
                  <p className="font-bold text-[var(--color-text)]">{t('Invoice')} #{pay.invoiceId.slice(-4)}</p>
                  <p className="text-xs text-[var(--color-text)]/40">{pay.paymentDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-text)]">${pay.amount.toLocaleString()}</p>
                  <p className="text-xs text-[var(--color-text)]/40 capitalize">{t(pay.paymentMethod.replace('_', ' '))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <OperationalCosts />
      </div>

      <FinancialPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlan}
        year={currentYear}
        quarter={selectedQuarter}
        initialData={editingPlan}
      />
    </div>
  );
};

export default Finance;
