'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, Search, AlertCircle, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getInvoices, createInvoice, recordPayment, updateInvoiceStatus, Invoice } from '../../../../services/apArService';
import Modal from '../../../../components/Modal';
import Badge from '../../../../components/common/Badge';

export default function ApArPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'ap' | 'ar'>('ap');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ orderId: '', orderType: 'purchase', amount: '', dueDate: '' });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer' });

  useEffect(() => {
    if (profile?.companyId) {
      loadInvoices();
    }
  }, [profile]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices(profile!.companyId);
      setInvoices(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createInvoice(profile!.companyId, {
        orderId: invoiceForm.orderId,
        orderType: invoiceForm.orderType as any,
        amount: parseFloat(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
        status: 'issued'
      });
      setIsInvoiceModalOpen(false);
      setInvoiceForm({ orderId: '', orderType: 'purchase', amount: '', dueDate: '' });
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError(null);
    try {
      const amount = parseFloat(paymentForm.amount);
      await recordPayment(profile!.companyId, {
        invoiceId: selectedInvoice.id,
        amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod as any
      });
      
      // If paid full amount, mark as paid
      if (amount >= selectedInvoice.amount) {
        await updateInvoiceStatus(selectedInvoice.id, 'paid', selectedInvoice.amount, selectedInvoice.dueDate);
      }
      
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMethod: 'bank_transfer' });
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    }
  };

  const displayedInvoices = invoices.filter(inv => activeTab === 'ap' ? inv.orderType === 'purchase' : inv.orderType === 'sales');
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Accounts Payable & Receivable')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Manage your incoming and outgoing invoices and payments')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsInvoiceModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          {t('Create Invoice')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--color-text)]/10 mb-6">
        <button
          onClick={() => setActiveTab('ap')}
          className={`pb-4 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'ap' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          {t('Accounts Payable (AP)')}
        </button>
        <button
          onClick={() => setActiveTab('ar')}
          className={`pb-4 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'ar' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          {t('Accounts Receivable (AR)')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Invoice ID')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Order Reference')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Due Date')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Amount')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Status')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)] mx-auto"></div>
                  </td>
                </tr>
              ) : displayedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text)]/40">
                    {t('No invoices found.')}
                  </td>
                </tr>
              ) : (
                displayedInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="p-4 text-xs font-mono text-[var(--color-text)]/70">
                      {inv.id.split('-')[0].toUpperCase()}
                    </td>
                    <td className="p-4 font-medium text-[var(--color-text)]/80">
                      {inv.orderId}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-text)]/70">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right font-bold text-lg">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="p-4">
                      <Badge 
                        status={inv.status === 'paid' ? 'completed' : (inv.status === 'overdue' ? 'failed' : 'pending')} 
                        text={inv.status.toUpperCase()} 
                      />
                    </td>
                    <td className="p-4 text-right">
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentForm({ ...paymentForm, amount: inv.amount.toString() });
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-4 py-2 bg-[var(--color-main)]/10 text-[var(--color-main)] hover:bg-[var(--color-main)] hover:text-white rounded-lg font-bold text-sm transition-colors"
                        >
                          {activeTab === 'ap' ? t('Pay Invoice') : t('Receive Payment')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title={t('Create Manual Invoice')}>
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Invoice Type')}</label>
            <select
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={invoiceForm.orderType}
              onChange={e => setInvoiceForm({...invoiceForm, orderType: e.target.value})}
            >
              <option value="purchase">{t('Accounts Payable (Purchase Invoice)')}</option>
              <option value="sales">{t('Accounts Receivable (Sales Invoice)')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Order Reference / PO Number')}</label>
            <input 
              type="text"
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={invoiceForm.orderId}
              onChange={e => setInvoiceForm({...invoiceForm, orderId: e.target.value})}
              placeholder="e.g. PO-10294"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Total Amount')}</label>
            <input 
              type="number"
              step="0.01"
              required
              min="0.01"
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={invoiceForm.amount}
              onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Due Date')}</label>
            <input 
              type="date"
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={invoiceForm.dueDate}
              onChange={e => setInvoiceForm({...invoiceForm, dueDate: e.target.value})}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
              {t('Cancel')}
            </button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90">
              {t('Create Invoice')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={selectedInvoice?.orderType === 'purchase' ? t('Record Payment Sent') : t('Record Payment Received')}>
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="bg-[var(--color-text)]/5 p-4 rounded-xl mb-4 border border-[var(--color-text)]/10">
            <div className="text-sm text-[var(--color-text)]/60 mb-1">{t('Invoice Reference')}</div>
            <div className="font-bold">{selectedInvoice?.orderId}</div>
            <div className="text-sm text-[var(--color-text)]/60 mt-2 mb-1">{t('Total Amount Due')}</div>
            <div className="font-bold text-lg text-[var(--color-main)]">{selectedInvoice ? formatCurrency(selectedInvoice.amount) : ''}</div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Payment Amount')}</label>
            <input 
              type="number"
              step="0.01"
              required
              max={selectedInvoice?.amount}
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Payment Date')}</label>
            <input 
              type="date"
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={paymentForm.paymentDate}
              onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Payment Method')}</label>
            <select
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
            >
              <option value="bank_transfer">{t('Bank Transfer')}</option>
              <option value="cash">{t('Cash')}</option>
              <option value="check">{t('Check')}</option>
              <option value="credit_card">{t('Credit Card')}</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
              {t('Cancel')}
            </button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90 flex items-center gap-2">
              <CheckCircle2 size={18} /> {t('Confirm Payment')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
