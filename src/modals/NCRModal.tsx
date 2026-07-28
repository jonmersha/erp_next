import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Badge from '../components/common/Badge';
import { NonConformanceReport } from '../services/inspectionService';

interface NCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  ncr: NonConformanceReport | null;
  onSave: (id: string, updates: Partial<NonConformanceReport>) => Promise<void>;
  currentUserId?: string;
}

export default function NCRModal({ isOpen, onClose, ncr, onSave, currentUserId }: NCRModalProps) {
  const { t } = useTranslation();

  const [ncrForm, setNcrForm] = useState({
    status: 'open',
    rcaDetails: '',
    capaDetails: '',
    disposition: 'pending',
    resolutionNotes: ''
  });

  useEffect(() => {
    if (ncr) {
      setNcrForm({
        status: ncr.status,
        rcaDetails: ncr.rcaDetails || '',
        capaDetails: ncr.capaDetails || '',
        disposition: ncr.disposition || 'pending',
        resolutionNotes: ncr.resolutionNotes || ''
      });
    }
  }, [ncr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncr) return;

    // Maker-Checker validation on frontend for resolved status
    if (ncrForm.status === 'resolved' && ncr.createdBy === currentUserId) {
      alert(t('Maker-Checker policy active: You cannot resolve an NCR that you created.'));
      return;
    }

    try {
      await onSave(ncr.id, {
        status: ncrForm.status as any,
        rcaDetails: ncrForm.rcaDetails,
        capaDetails: ncrForm.capaDetails,
        disposition: ncrForm.disposition as any,
        resolutionNotes: ncrForm.resolutionNotes,
        resolvedBy: currentUserId
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update NCR');
    }
  };

  if (!ncr) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('NCMR Details')}>
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pb-4 pr-2">
        
        {/* Phase 1: Identification */}
        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 text-sm">
          <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center">
            <span className="w-6 h-6 bg-[var(--color-main)] text-white rounded-full flex items-center justify-center mr-2 text-xs">1</span>
            {t('Phase 1: Identification')}
          </h4>
          <div className="space-y-2">
            <p><span className="text-[var(--color-text)]/60">{t('Created At')}:</span> {new Date(ncr.createdAt!).toLocaleString()}</p>
            <p><span className="text-[var(--color-text)]/60">{t('Severity')}:</span> <Badge status={ncr.severity === 'high' ? 'cancelled' : 'in_progress'} text={ncr.severity} /></p>
            <p><span className="text-[var(--color-text)]/60">{t('Quality Check ID')}:</span> {ncr.qualityCheckId}</p>
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-900/80">
              <strong>{t('Issue Description')}:</strong><br/>
              {ncr.issueDescription}
            </div>
          </div>
        </div>

        {/* Phase 2: RCA */}
        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 text-sm">
          <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center">
            <span className="w-6 h-6 bg-[var(--color-main)] text-white rounded-full flex items-center justify-center mr-2 text-xs">2</span>
            {t('Phase 2: Root Cause Analysis (RCA)')}
          </h4>
          <textarea 
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-surface)] h-24"
            placeholder={t('Describe the root cause of this non-conformance...')}
            value={ncrForm.rcaDetails}
            onChange={e => setNcrForm({...ncrForm, rcaDetails: e.target.value})}
          />
        </div>

        {/* Phase 3: CAPA */}
        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 text-sm">
          <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center">
            <span className="w-6 h-6 bg-[var(--color-main)] text-white rounded-full flex items-center justify-center mr-2 text-xs">3</span>
            {t('Phase 3: Corrective & Preventative Actions (CAPA)')}
          </h4>
          <textarea 
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-surface)] h-24"
            placeholder={t('What actions will be taken to correct and prevent this?')}
            value={ncrForm.capaDetails}
            onChange={e => setNcrForm({...ncrForm, capaDetails: e.target.value})}
          />
        </div>

        {/* Phase 4: Disposition */}
        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 text-sm">
          <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center">
            <span className="w-6 h-6 bg-[var(--color-main)] text-white rounded-full flex items-center justify-center mr-2 text-xs">4</span>
            {t('Phase 4: Disposition')}
          </h4>
          <select
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-surface)]"
            value={ncrForm.disposition}
            onChange={e => setNcrForm({...ncrForm, disposition: e.target.value})}
          >
            <option value="pending">Pending</option>
            <option value="quarantine">Quarantine</option>
            <option value="rework">Rework</option>
            <option value="disposal">Disposal</option>
            <option value="accept_as_is">Accept As-Is</option>
            <option value="return_to_vendor">Return to Vendor</option>
          </select>
        </div>

        {/* Phase 5: Resolution */}
        <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 text-sm">
          <h4 className="font-bold text-[var(--color-text)] mb-3 flex items-center">
            <span className="w-6 h-6 bg-[var(--color-main)] text-white rounded-full flex items-center justify-center mr-2 text-xs">5</span>
            {t('Phase 5: Final Resolution')}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('Status')}</label>
              <select
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-surface)]"
                value={ncrForm.status}
                onChange={e => setNcrForm({...ncrForm, status: e.target.value})}
              >
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('Resolution Notes')}</label>
              <textarea 
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-surface)] h-24"
                value={ncrForm.resolutionNotes}
                onChange={e => setNcrForm({...ncrForm, resolutionNotes: e.target.value})}
                required={ncrForm.status === 'resolved'}
                placeholder={t('Required if resolving...')}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-[var(--color-main)] text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
          {t('Save NCMR Update')}
        </button>
      </form>
    </Modal>
  );
}
