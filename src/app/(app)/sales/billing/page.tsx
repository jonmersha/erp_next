'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getSalesOrders, getSalesInvoices, generateInvoice, SalesOrder } from '../../../../services/billingService';
import { Invoice } from '../../../../services/apArService';
import Badge from '../../../../components/common/Badge';
import Modal from '../../../../components/Modal';

export default function BillingPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Default 30 days

  useEffect(() => {
    if (profile?.companyId) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, invoicesData] = await Promise.all([
        getSalesOrders(profile!.companyId),
        getSalesInvoices(profile!.companyId)
      ]);
      setOrders(ordersData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error(err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setError(null);
    try {
      await generateInvoice(profile!.companyId, selectedOrder.id, selectedOrder.total_amount, dueDate);
      setIsModalOpen(false);
      setSelectedOrder(null);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to generate invoice');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Billing & Invoicing')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Track sales orders and generate official finance invoices')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Order Ref')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Date')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Fulfillment Status')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Total Amount')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Billing Status')}</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text)]/40">
                    {t('No sales orders found.')}
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const invoice = invoices.find(inv => inv.orderId === order.id);
                  const isBilled = !!invoice;
                  
                  return (
                    <tr key={order.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="p-4 text-xs font-mono text-[var(--color-text)]/70">
                        {order.id.split('-')[0].toUpperCase()}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-text)]/70">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 capitalize">
                        {order.status}
                      </td>
                      <td className="p-4 text-right font-bold text-lg">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="p-4">
                        {isBilled ? (
                          <div className="flex items-center gap-1 text-[var(--color-main)] font-bold text-sm">
                            <CheckCircle2 size={16} />
                            {t('Billed')}
                          </div>
                        ) : (
                          <Badge status="pending" text={t('Unbilled')} />
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!isBilled ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsModalOpen(true);
                            }}
                            className="px-4 py-2 bg-[var(--color-text)] border border-[var(--color-text)]/20 text-[var(--color-bg)] hover:opacity-90 rounded-lg font-bold text-sm transition-opacity inline-flex items-center gap-2"
                          >
                            <Send size={16} />
                            {t('Generate Invoice')}
                          </button>
                        ) : (
                          <div className="text-xs text-[var(--color-text)]/40">
                            Inv Ref: {invoice!.id.split('-')[0].toUpperCase()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('Generate Official Invoice')}>
        {selectedOrder && (
          <form onSubmit={handleGenerateInvoice} className="space-y-4">
            <div className="bg-[var(--color-text)]/5 p-4 rounded-xl mb-4 border border-[var(--color-text)]/10">
              <div className="text-sm text-[var(--color-text)]/60 mb-1">{t('Sales Order Reference')}</div>
              <div className="font-bold font-mono">{selectedOrder.id.split('-')[0].toUpperCase()}</div>
              <div className="text-sm text-[var(--color-text)]/60 mt-2 mb-1">{t('Total Amount to Bill')}</div>
              <div className="font-bold text-xl text-[var(--color-main)]">{formatCurrency(selectedOrder.total_amount)}</div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Payment Due Date')}</label>
              <input 
                type="date"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
              <p className="text-xs text-[var(--color-text)]/50 mt-2">
                {t('This invoice will automatically be synchronized with the Finance Accounts Receivable module upon generation.')}
              </p>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
                {t('Cancel')}
              </button>
              <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90 flex items-center gap-2">
                <Send size={18} /> {t('Send to Finance')}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
