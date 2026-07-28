'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Search, ArrowRight, ArrowDown, History, Box, Truck, Hammer } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchBatchTraceability } from '../../../../services/traceabilityService';
import Badge from '../../../../components/common/Badge';

export default function TraceabilityPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [batchNumber, setBatchNumber] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !batchNumber.trim()) return;
    
    setLoading(true);
    setError(null);
    setTraceData(null);
    
    try {
      const data = await fetchBatchTraceability(batchNumber.trim(), profile.companyId);
      setTraceData(data);
    } catch (err: any) {
      setError(err.message || t('Failed to trace batch. It may not exist.'));
    } finally {
      setLoading(false);
    }
  };

  const getIconForReferenceType = (type: string) => {
    switch(type) {
      case 'grn': return <Truck size={20} className="text-blue-500" />;
      case 'production_run': return <Hammer size={20} className="text-orange-500" />;
      case 'sales_order': return <Box size={20} className="text-green-500" />;
      default: return <Package size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Batch Traceability')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Track inventory lifecycle end-to-end')}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-6 rounded-2xl">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-[var(--color-text)]/40" size={20} />
            <input 
              type="text" 
              placeholder={t('Enter Batch Number (e.g. BATCH-001)')}
              className="w-full pl-10 p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? t('Searching...') : t('Trace')}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20">
          {error}
        </div>
      )}

      {traceData && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-bold">{t('Batch Overview')}</h3>
            {traceData.batchDetails.map((detail: any, idx: number) => (
              <div key={idx} className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-4 rounded-xl">
                <p className="text-xs text-[var(--color-text)]/60 uppercase">{detail.itemType}</p>
                <p className="font-bold text-lg">{detail.itemName}</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text)]/60">{t('Current Quantity')}</span>
                    <span className="font-bold">{detail.quantity}</span>
                  </div>
                  {detail.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text)]/60">{t('Expiry Date')}</span>
                      <span className="font-bold">{new Date(detail.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold">{t('Lifecycle Timeline')}</h3>
            <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-6 rounded-2xl relative">
              
              <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-[var(--color-text)]/10" />

              <div className="space-y-8 relative">
                {traceData.timeline.map((event: any, idx: number) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-main)] flex items-center justify-center z-10 shrink-0 mt-1">
                      {getIconForReferenceType(event.referenceType)}
                    </div>
                    <div className="bg-[var(--color-bg)] border border-[var(--color-text)]/5 p-4 rounded-xl flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge 
                            status={event.transactionType === 'in' ? 'completed' : (event.transactionType === 'out' ? 'failed' : 'in_progress')} 
                            text={event.transactionType.toUpperCase()} 
                          />
                          <span className="ml-2 font-bold text-[var(--color-text)]">
                            {event.referenceType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--color-text)]/50">
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <p><span className="text-[var(--color-text)]/60">{t('Quantity')}:</span> {event.transactionType === 'out' ? '-' : '+'}{event.quantity}</p>
                        <p><span className="text-[var(--color-text)]/60">{t('Reference ID')}:</span> {event.referenceId}</p>
                        <p><span className="text-[var(--color-text)]/60">{t('User')}:</span> {event.userName}</p>
                        {event.notes && <p className="text-[var(--color-text)]/80 italic mt-2 bg-[var(--color-text)]/5 p-2 rounded">"{event.notes}"</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {traceData.timeline.length === 0 && (
                  <div className="text-center text-[var(--color-text)]/40 p-4">
                    {t('No transactions found for this batch.')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
