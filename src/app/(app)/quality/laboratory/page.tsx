'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Beaker, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getQualityChecks, getQualityInspections, createQualityCheck, createQualityInspection, QualityCheck, QualityInspection } from '../../../../services/labService';
import Modal from '../../../../components/Modal';
import Badge from '../../../../components/common/Badge';

export default function LaboratoryPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'checks' | 'grain'>('checks');
  
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [checkForm, setCheckForm] = useState({
    referenceType: 'production_run',
    referenceId: '',
    itemId: '',
    status: 'passed',
    notes: ''
  });

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    weighbridgeLogId: '',
    moisture: '',
    protein: '',
    ash: '',
    gluten: '',
    notes: ''
  });

  useEffect(() => {
    if (profile?.companyId) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [checksData, inspectionsData] = await Promise.all([
        getQualityChecks(profile!.companyId),
        getQualityInspections(profile!.companyId)
      ]);
      setQualityChecks(checksData);
      setInspections(inspectionsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load laboratory data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createQualityCheck({
        companyId: profile!.companyId,
        inspectorId: profile!.id,
        checkDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        ...checkForm
      } as any);
      setIsCheckModalOpen(false);
      setCheckForm({ referenceType: 'production_run', referenceId: '', itemId: '', status: 'passed', notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to log quality check');
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      
      // Auto-determine status based on generic thresholds
      const moisture = parseFloat(inspectionForm.moisture);
      const protein = parseFloat(inspectionForm.protein);
      // Let's say moisture > 14 is rejected, protein < 11 is rejected.
      let status = 'Approved';
      if (moisture > 14.5 || protein < 10) {
        status = 'Rejected';
      }

      await createQualityInspection({
        companyId: profile!.companyId,
        inspectorId: profile!.id,
        status: status as any,
        weighbridgeLogId: inspectionForm.weighbridgeLogId,
        moisture,
        protein: parseFloat(inspectionForm.protein),
        ash: parseFloat(inspectionForm.ash),
        gluten: parseFloat(inspectionForm.gluten),
        notes: inspectionForm.notes
      });
      setIsInspectionModalOpen(false);
      setInspectionForm({ weighbridgeLogId: '', moisture: '', protein: '', ash: '', gluten: '', notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to log lab inspection');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <Beaker size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Laboratory Management')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Track quality checks and detailed grain lab inspections')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCheckModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-text)] border border-[var(--color-text)]/20 text-[var(--color-bg)] px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all text-sm"
          >
            <Plus size={16} />
            {t('Log QC Check')}
          </button>
          <button 
            onClick={() => setIsInspectionModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all text-sm"
          >
            <Plus size={16} />
            {t('Log Lab Test')}
          </button>
        </div>
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
          onClick={() => setActiveTab('checks')}
          className={`pb-4 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'checks' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          {t('Generic QC Checks')}
        </button>
        <button
          onClick={() => setActiveTab('grain')}
          className={`pb-4 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'grain' ? 'border-[var(--color-main)] text-[var(--color-main)]' : 'border-transparent text-[var(--color-text)]/50 hover:text-[var(--color-text)]'}`}
        >
          {t('Grain Lab Tests')}
        </button>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'checks' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Date')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Type')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Reference ID')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Notes')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)] mx-auto"></div>
                    </td>
                  </tr>
                ) : qualityChecks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[var(--color-text)]/40">
                      {t('No quality checks found.')}
                    </td>
                  </tr>
                ) : (
                  qualityChecks.map(check => (
                    <tr key={check.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="p-4 text-sm text-[var(--color-text)]/70">
                        {new Date(check.checkDate || check.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium uppercase text-xs text-[var(--color-text)]/60">
                        {check.referenceType.replace('_', ' ')}
                      </td>
                      <td className="p-4 font-mono text-sm text-[var(--color-text)]/80">
                        {check.referenceId.split('-')[0].toUpperCase()}
                      </td>
                      <td className="p-4 text-sm text-[var(--color-text)]/80 max-w-xs truncate">
                        {check.notes || '-'}
                      </td>
                      <td className="p-4">
                        <Badge 
                          status={check.status === 'passed' ? 'completed' : (check.status === 'failed' ? 'failed' : 'pending')} 
                          text={check.status.toUpperCase()} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)] border-b border-[var(--color-text)]/10">
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Date')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs">{t('Weighbridge Ref')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Moisture')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Protein')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Ash')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs text-right">{t('Gluten')}</th>
                  <th className="p-4 font-bold text-[var(--color-text)]/60 uppercase text-xs pl-8">{t('Decision')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-main)] mx-auto"></div>
                    </td>
                  </tr>
                ) : inspections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--color-text)]/40">
                      {t('No lab inspections found.')}
                    </td>
                  </tr>
                ) : (
                  inspections.map(insp => (
                    <tr key={insp.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                      <td className="p-4 text-sm text-[var(--color-text)]/70">
                        {new Date(insp.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono text-sm font-bold text-[var(--color-text)]/80">
                        {insp.weighbridgeLogId.split('-')[0].toUpperCase()}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {insp.moisture}%
                      </td>
                      <td className="p-4 text-right font-medium">
                        {insp.protein}%
                      </td>
                      <td className="p-4 text-right font-medium text-[var(--color-text)]/70">
                        {insp.ash}%
                      </td>
                      <td className="p-4 text-right font-medium text-[var(--color-text)]/70">
                        {insp.gluten}%
                      </td>
                      <td className="p-4 pl-8">
                        <Badge 
                          status={insp.status === 'Approved' ? 'completed' : (insp.status === 'Rejected' ? 'failed' : 'pending')} 
                          text={insp.status.toUpperCase()} 
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QC Check Modal */}
      <Modal isOpen={isCheckModalOpen} onClose={() => setIsCheckModalOpen(false)} title={t('Log QC Check')}>
        <form onSubmit={handleCreateCheck} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Reference Type')}</label>
            <select
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checkForm.referenceType}
              onChange={e => setCheckForm({...checkForm, referenceType: e.target.value})}
            >
              <option value="production_run">{t('Production Run')}</option>
              <option value="grn">{t('Goods Receipt Note (GRN)')}</option>
              <option value="inventory">{t('Inventory')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Reference ID (Run/GRN ID)')}</label>
            <input 
              type="text"
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checkForm.referenceId}
              onChange={e => setCheckForm({...checkForm, referenceId: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Item ID (Product)')}</label>
            <input 
              type="text"
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checkForm.itemId}
              onChange={e => setCheckForm({...checkForm, itemId: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Status')}</label>
            <select
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checkForm.status}
              onChange={e => setCheckForm({...checkForm, status: e.target.value})}
            >
              <option value="passed">{t('Passed')}</option>
              <option value="failed">{t('Failed')}</option>
              <option value="quarantined">{t('Quarantined')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Notes')}</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checkForm.notes}
              onChange={e => setCheckForm({...checkForm, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setIsCheckModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
              {t('Cancel')}
            </button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90">
              {t('Log QC Check')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Lab Inspection Modal */}
      <Modal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} title={t('Log Grain Lab Test')} size="lg">
        <form onSubmit={handleCreateInspection} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Weighbridge Log ID')}</label>
            <input 
              type="text"
              required
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] font-mono"
              value={inspectionForm.weighbridgeLogId}
              onChange={e => setInspectionForm({...inspectionForm, weighbridgeLogId: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Moisture (%)')}</label>
              <input 
                type="number" step="0.01" required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={inspectionForm.moisture}
                onChange={e => setInspectionForm({...inspectionForm, moisture: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Protein (%)')}</label>
              <input 
                type="number" step="0.01" required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={inspectionForm.protein}
                onChange={e => setInspectionForm({...inspectionForm, protein: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Ash (%)')}</label>
              <input 
                type="number" step="0.01" required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={inspectionForm.ash}
                onChange={e => setInspectionForm({...inspectionForm, ash: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Gluten (%)')}</label>
              <input 
                type="number" step="0.01" required
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={inspectionForm.gluten}
                onChange={e => setInspectionForm({...inspectionForm, gluten: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Additional Notes')}</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={inspectionForm.notes}
              onChange={e => setInspectionForm({...inspectionForm, notes: e.target.value})}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <button type="button" onClick={() => setIsInspectionModalOpen(false)} className="px-6 py-2 rounded-xl border border-[var(--color-text)]/10 font-bold hover:bg-[var(--color-text)]/5">
              {t('Cancel')}
            </button>
            <button type="submit" className="px-6 py-2 rounded-xl bg-[var(--color-main)] text-white font-bold hover:opacity-90">
              {t('Save Test Results')}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
