'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Plus, CheckCircle, Clock, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { fetchCollection } from '../../../../utils/firestore';
import { useSourcingData } from '../../../../hooks/useSourcingData';
import { createRFQ, submitBid, awardBid } from '../../../../services/sourcingService';
import Modal from '../../../../components/Modal';
import Badge from '../../../../components/common/Badge';

export default function SourcingPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'rfqs' | 'bids'>('rfqs');
  const { rfqs, refreshData, loadBidsForRFQ } = useSourcingData();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [bids, setBids] = useState<any[]>([]);

  // Modals
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  // Form states
  const [rfqForm, setRfqForm] = useState({ title: '', description: '', deadline: '', items: [] as { rawMaterialId: string, quantity: number }[] });
  const [bidForm, setBidForm] = useState({ supplierId: '', totalAmount: 0, deliveryTimeDays: 0, notes: '' });

  useEffect(() => {
    if (profile?.companyId) {
      fetchCollection('suppliers', profile.companyId).then(setSuppliers).catch(console.error);
      fetchCollection('rawMaterials', profile.companyId).then(setRawMaterials).catch(console.error);
    }
  }, [profile?.companyId]);

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;
    try {
      await createRFQ({
        ...rfqForm,
        companyId: profile.companyId,
        createdBy: profile.id
      });
      setIsRfqModalOpen(false);
      setRfqForm({ title: '', description: '', deadline: '', items: [] });
      refreshData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddRfqItem = () => {
    setRfqForm({ ...rfqForm, items: [...rfqForm.items, { rawMaterialId: '', quantity: 0 }] });
  };

  const handleUpdateRfqItem = (index: number, field: string, value: any) => {
    const newItems = [...rfqForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setRfqForm({ ...rfqForm, items: newItems });
  };

  const openBids = async (rfqId: string) => {
    setSelectedRfqId(rfqId);
    setActiveTab('bids');
    const b = await loadBidsForRFQ(rfqId);
    setBids(b);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId || !selectedRfqId) return;
    try {
      await submitBid(selectedRfqId, {
        ...bidForm,
        companyId: profile.companyId
      });
      setIsBidModalOpen(false);
      setBidForm({ supplierId: '', totalAmount: 0, deliveryTimeDays: 0, notes: '' });
      openBids(selectedRfqId);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAwardBid = async (bidId: string) => {
    if (!profile?.companyId || !selectedRfqId) return;
    try {
      await awardBid(selectedRfqId, bidId, profile.id);
      openBids(selectedRfqId);
      refreshData();
      alert(t('Bid awarded successfully!'));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderSuppliers = () => (
    <div className="grid gap-4 mt-6">
      {suppliers.map(s => (
        <div key={s.id} className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-4 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[var(--color-text)]">{s.name}</h3>
            <p className="text-sm text-[var(--color-text)]/60">{s.contact} | {s.email}</p>
          </div>
          <div className="flex space-x-4">
            <Badge status={s.status === 'active' ? 'completed' : 'pending'} text={s.status} />
            <Badge status={s.risk_rating < 3 ? 'completed' : (s.risk_rating > 3 ? 'failed' : 'in_progress')} text={`Risk: ${s.risk_rating}`} />
          </div>
        </div>
      ))}
      {suppliers.length === 0 && <p className="text-center text-[var(--color-text)]/40 p-8">{t('No suppliers found.')}</p>}
    </div>
  );

  const renderRFQs = () => (
    <div className="mt-6 space-y-4">
      {rfqs.map(rfq => (
        <div key={rfq.id} className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-bold text-[var(--color-text)]">{rfq.title}</h3>
              <Badge status={rfq.status === 'awarded' ? 'completed' : (rfq.status === 'published' ? 'in_progress' : 'pending')} text={rfq.status} />
            </div>
            <p className="text-sm text-[var(--color-text)]/60 mb-2">{rfq.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {rfq.items?.map((item: any) => (
                <span key={item.id} className="bg-[var(--color-bg)] px-2 py-1 rounded text-xs text-[var(--color-text)]/80">
                  {item.quantity} x {item.rawMaterialName}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4 w-full md:w-auto mt-4 md:mt-0">
             <button 
                onClick={() => openBids(rfq.id)}
                className="flex items-center justify-center space-x-2 bg-[var(--color-bg)] text-[var(--color-text)] px-4 py-2 rounded-xl border border-[var(--color-text)]/10 hover:bg-[var(--color-text)]/5 transition-all flex-1 md:flex-none"
             >
                <span>{t('View Bids')}</span>
             </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBids = () => {
    if (!selectedRfqId) return <div className="p-8 text-center">{t('Select an RFQ to view its bids.')}</div>;
    const rfq = rfqs.find(r => r.id === selectedRfqId);

    return (
      <div className="mt-6">
        <div className="mb-6 p-4 bg-[var(--color-main)]/5 border border-[var(--color-main)]/20 rounded-xl flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[var(--color-main)]">{rfq?.title}</h3>
            <p className="text-sm text-[var(--color-text)]/60">{t('Deadline')}: {new Date(rfq?.deadline).toLocaleDateString()}</p>
          </div>
          {rfq?.status !== 'awarded' && (
            <button 
              onClick={() => setIsBidModalOpen(true)}
              className="bg-[var(--color-main)] text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              + {t('Submit Bid')}
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {bids.map(bid => (
            <div key={bid.id} className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center">
              <div>
                <h4 className="font-bold text-lg">{bid.supplierName}</h4>
                <div className="flex space-x-4 text-sm text-[var(--color-text)]/60 mt-1">
                  <span>{t('Amount')}: ${bid.totalAmount.toLocaleString()}</span>
                  <span>{t('Time')}: {bid.deliveryTimeDays} {t('days')}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Badge status={bid.status === 'accepted' ? 'completed' : (bid.status === 'rejected' ? 'failed' : 'pending')} text={bid.status} />
                {bid.status === 'under_review' && rfq?.status !== 'awarded' && (
                  <button 
                    onClick={() => handleAwardBid(bid.id)}
                    className="bg-green-500/10 text-green-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-500/20"
                  >
                    {t('Award')}
                  </button>
                )}
              </div>
            </div>
          ))}
          {bids.length === 0 && <p className="text-center text-[var(--color-text)]/40 py-8">{t('No bids submitted yet.')}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Strategic Sourcing')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Manage suppliers, RFQs, and competitive bidding')}</p>
        </div>
        <button 
          onClick={() => setIsRfqModalOpen(true)}
          className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all justify-center w-full md:w-auto"
        >
          <Plus size={20} />
          <span className="font-bold">{t('New RFQ')}</span>
        </button>
      </header>

      <div className="flex space-x-2 bg-[var(--color-surface)] p-2 rounded-2xl border border-[var(--color-text)]/10 overflow-x-auto w-full md:w-max">
        {(['rfqs', 'suppliers', 'bids'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-[var(--color-main)] text-white shadow-md' 
                : 'text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5'
            }`}
          >
            {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
          </button>
        ))}
      </div>

      <div className="pb-10">
        {activeTab === 'suppliers' && renderSuppliers()}
        {activeTab === 'rfqs' && renderRFQs()}
        {activeTab === 'bids' && renderBids()}
      </div>

      {/* RFQ Modal */}
      <Modal isOpen={isRfqModalOpen} onClose={() => setIsRfqModalOpen(false)} title={t('Create RFQ')}>
        <form onSubmit={handleCreateRFQ} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Title')}</label>
            <input required value={rfqForm.title} onChange={e => setRfqForm({...rfqForm, title: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:ring-2 focus:ring-[var(--color-main)]/20 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Description')}</label>
            <textarea value={rfqForm.description} onChange={e => setRfqForm({...rfqForm, description: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 outline-none h-24" />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Deadline')}</label>
            <input type="datetime-local" required value={rfqForm.deadline} onChange={e => setRfqForm({...rfqForm, deadline: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 outline-none" />
          </div>
          
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Required Items')}</label>
              <button type="button" onClick={handleAddRfqItem} className="text-[var(--color-main)] text-sm font-bold">+ {t('Add Item')}</button>
            </div>
            <div className="space-y-2">
              {rfqForm.items.map((item, idx) => (
                <div key={idx} className="flex space-x-2">
                  <select required value={item.rawMaterialId} onChange={e => handleUpdateRfqItem(idx, 'rawMaterialId', e.target.value)} className="flex-1 p-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-sm outline-none">
                    <option value="">{t('Select Material')}</option>
                    {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.name}</option>)}
                  </select>
                  <input type="number" required placeholder="Qty" value={item.quantity || ''} onChange={e => handleUpdateRfqItem(idx, 'quantity', parseFloat(e.target.value))} className="w-24 p-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-sm outline-none" />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl font-bold mt-4">
            {t('Publish RFQ')}
          </button>
        </form>
      </Modal>

      {/* Bid Modal */}
      <Modal isOpen={isBidModalOpen} onClose={() => setIsBidModalOpen(false)} title={t('Submit Bid')}>
        <form onSubmit={handleSubmitBid} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Supplier')}</label>
            <select required value={bidForm.supplierId} onChange={e => setBidForm({...bidForm, supplierId: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 outline-none">
              <option value="">{t('Select Supplier')}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Total Amount')}</label>
            <input type="number" required value={bidForm.totalAmount || ''} onChange={e => setBidForm({...bidForm, totalAmount: parseFloat(e.target.value)})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Delivery Time (Days)')}</label>
            <input type="number" required value={bidForm.deliveryTimeDays || ''} onChange={e => setBidForm({...bidForm, deliveryTimeDays: parseInt(e.target.value)})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase">{t('Notes')}</label>
            <textarea value={bidForm.notes} onChange={e => setBidForm({...bidForm, notes: e.target.value})} className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 outline-none h-24" />
          </div>
          <button type="submit" className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl font-bold mt-4">
            {t('Submit Bid')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
