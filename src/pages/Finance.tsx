import React, { useState, useEffect } from 'react';
import { Invoice, Payment, FinancialPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { CreditCard, FileText, Loader2, TrendingUp } from 'lucide-react';
import { getInvoices, getPayments, getFinancialPlans } from '../services/financeService';
import { useTranslation } from 'react-i18next';

const Finance: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<FinancialPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchData();
  }, [profile?.companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const yearlyPlans = plans.filter(p => p.year === currentYear);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Finance')}</h2>
        <p className="text-[var(--color-text)]/40 mt-1">{t('Financial reports, invoices, payments, and yearly plans')}</p>
      </header>

      <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="text-[var(--color-main)]" />
          <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{t('Financial Plan')} ({currentYear})</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
            const plan = yearlyPlans.find(p => p.quarter === q);
            return (
              <div key={q} className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20">
                <p className="font-bold text-[var(--color-text)]">{q}</p>
                <p className="text-xs text-[var(--color-text)]/40">{t('Revenue')}: ${plan ? plan.targetRevenue.toLocaleString() : 0}</p>
                <p className="text-xs text-[var(--color-text)]/40">{t('Expense')}: ${plan ? plan.targetExpense.toLocaleString() : 0}</p>
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
    </div>
  );
};

export default Finance;
