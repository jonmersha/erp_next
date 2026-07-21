'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Search, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getJournalEntries, createManualJournalEntry, JournalEntry, ManualEntryPayload } from '../../../../services/ledgerService';
import Modal from '../../../../components/Modal';

export default function GeneralLedgerPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({ startDate: '', endDate: '', accountType: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalDescription, setModalDescription] = useState('');
  const [modalEntries, setModalEntries] = useState<ManualEntryPayload[]>([
    { accountType: '', amount: 0, entryType: 'debit' },
    { accountType: '', amount: 0, entryType: 'credit' }
  ]);

  const accountTypes = ['inventory', 'accounts_payable', 'accounts_receivable', 'cash', 'cogs', 'revenue', 'expense'];

  useEffect(() => {
    if (profile?.companyId) {
      loadEntries();
    }
  }, [profile, filters]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await getJournalEntries(profile!.companyId, filters);
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = () => {
    setModalEntries([...modalEntries, { accountType: '', amount: 0, entryType: 'debit' }]);
  };

  const handleRemoveLine = (index: number) => {
    setModalEntries(modalEntries.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof ManualEntryPayload, value: any) => {
    const updated = [...modalEntries];
    updated[index] = { ...updated[index], [field]: value };
    setModalEntries(updated);
  };

  const totalDebit = modalEntries.filter(e => e.entryType === 'debit').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalCredit = modalEntries.filter(e => e.entryType === 'credit').reduce((sum, e) => sum + (e.amount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    setError(null);
    try {
      await createManualJournalEntry(profile!.companyId, modalDate, modalDescription, modalEntries);
      setIsModalOpen(false);
      setModalEntries([
        { accountType: '', amount: 0, entryType: 'debit' },
        { accountType: '', amount: 0, entryType: 'credit' }
      ]);
      setModalDescription('');
      loadEntries();
    } catch (err: any) {
      setError(err.message || 'Failed to post entry');
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('General Ledger')}</h1>
            <p className="text-[var(--color-text)]/60">{t('View all journal entries and post manual adjustments')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          <Plus size={20} />
          {t('Post Manual Entry')}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Start Date')}</label>
          <input 
            type="date"
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={filters.startDate}
            onChange={e => setFilters({...filters, startDate: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('End Date')}</label>
          <input 
            type="date"
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={filters.endDate}
            onChange={e => setFilters({...filters, endDate: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Account Type')}</label>
          <select
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={filters.accountType}
            onChange={e => setFilters({...filters, accountType: e.target.value})}
          >
            <option value="">{t('All Accounts')}</option>
            {accountTypes.map(type => (
              <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Date')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Reference')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Account')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Description')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Debit')}</th>
                <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Credit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)] mx-auto"></div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--color-text)]/40">
                    {t('No journal entries found.')}
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-xs font-mono text-[var(--color-text)]/50">
                      {entry.referenceType.toUpperCase()}
                      <br/>
                      {entry.referenceId.slice(0, 8)}...
                    </td>
                    <td className="p-4 font-medium capitalize">
                      {entry.accountType.replace('_', ' ')}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-text)]/70">
                      {entry.description}
                    </td>
                    <td className="p-4 text-right font-medium text-[var(--color-main)]">
                      {entry.entryType === 'debit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {entry.entryType === 'credit' ? formatCurrency(entry.amount) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('Post Manual Entry')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Date')}</label>
              <input 
                type="date"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={modalDate}
                onChange={e => setModalDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Description / Memo')}</label>
              <input 
                type="text"
                required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={modalDescription}
                onChange={e => setModalDescription(e.target.value)}
                placeholder={t('e.g. Month-end adjustment')}
              />
            </div>
          </div>

          <div className="border border-[var(--color-text)]/10 rounded-xl overflow-hidden">
            <div className="bg-[var(--color-bg)] p-3 grid grid-cols-[1fr_150px_150px_50px] gap-4 font-bold text-sm text-[var(--color-text)]/60">
              <div>{t('Account')}</div>
              <div>{t('Debit/Credit')}</div>
              <div className="text-right">{t('Amount')}</div>
              <div></div>
            </div>
            <div className="divide-y divide-[var(--color-text)]/5 max-h-[40vh] overflow-y-auto">
              {modalEntries.map((entry, idx) => (
                <div key={idx} className="p-3 grid grid-cols-[1fr_150px_150px_50px] gap-4 items-center">
                  <select
                    required
                    className="w-full p-2 rounded-lg border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                    value={entry.accountType}
                    onChange={e => handleLineChange(idx, 'accountType', e.target.value)}
                  >
                    <option value="">{t('Select Account')}</option>
                    {accountTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                  <select
                    className="w-full p-2 rounded-lg border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                    value={entry.entryType}
                    onChange={e => handleLineChange(idx, 'entryType', e.target.value as 'debit'|'credit')}
                  >
                    <option value="debit">{t('Debit')}</option>
                    <option value="credit">{t('Credit')}</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full p-2 rounded-lg border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-right"
                    value={entry.amount || ''}
                    onChange={e => handleLineChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveLine(idx)}
                    className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex justify-center"
                    disabled={modalEntries.length <= 2}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-3 bg-[var(--color-bg)] border-t border-[var(--color-text)]/10 flex justify-between items-center">
              <button
                type="button"
                onClick={handleAddLine}
                className="text-sm font-bold text-[var(--color-main)] hover:underline flex items-center gap-1"
              >
                <Plus size={16} /> {t('Add Line')}
              </button>
              <div className="flex gap-8 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[var(--color-text)]/60 font-bold">{t('Total Debit')}</span>
                  <span className="font-mono text-lg">{formatCurrency(totalDebit)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[var(--color-text)]/60 font-bold">{t('Total Credit')}</span>
                  <span className="font-mono text-lg">{formatCurrency(totalCredit)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {!isBalanced ? (
              <div className="text-red-500 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={16} />
                {t('Debits and Credits must balance to post entry.')}
              </div>
            ) : (
              <div className="text-green-500 text-sm font-bold flex items-center gap-2">
                {t('Entry is balanced and ready to post.')}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 hover:bg-[var(--color-text)]/5 font-bold"
              >
                {t('Cancel')}
              </button>
              <button
                type="submit"
                disabled={!isBalanced}
                className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('Post Entry')}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
}
