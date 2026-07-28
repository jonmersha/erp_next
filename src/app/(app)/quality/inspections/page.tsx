'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Search, Plus, AlertCircle, FileText, ClipboardList, Filter } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { 
  getQualityChecklists, QualityChecklist, createQualityChecklist, deleteQualityChecklist,
  getNCRs, NonConformanceReport, updateNCR,
  createInspection, updateInspection
} from '../../../../services/inspectionService';
import { getQualityChecks, QualityCheck } from '../../../../services/labService';
import Modal from '../../../../modals/Modal';
import Badge from '../../../../components/common/Badge';

export default function InspectionsPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'inspections' | 'checklists'>('inspections');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inspections, setInspections] = useState<QualityCheck[]>([]);
  const [checklists, setChecklists] = useState<QualityChecklist[]>([]);

  // Modals
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  const [checklistForm, setChecklistForm] = useState({ name: '', category: 'production', items: [{ text: '', required: true }] });
  
  const [inspectionForm, setInspectionForm] = useState({
    referenceType: 'production_run',
    referenceId: '',
    itemId: '',
    checklistId: '',
    results: {} as Record<number, boolean>,
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
      const [insp, cl] = await Promise.all([
        getQualityChecks(profile!.companyId),
        getQualityChecklists(profile!.companyId)
      ]);
      setInspections(insp);
      setChecklists(cl);
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createQualityChecklist({ ...checklistForm, companyId: profile!.companyId });
      setIsChecklistModalOpen(false);
      setChecklistForm({ name: '', category: 'production', items: [{ text: '', required: true }] });
      loadData();
    } catch (err) {
      alert('Failed to create checklist');
    }
  };

  const addChecklistItem = () => {
    setChecklistForm({ ...checklistForm, items: [...checklistForm.items, { text: '', required: true }] });
  };
  
  const updateChecklistItem = (index: number, text: string) => {
    const newItems = [...checklistForm.items];
    newItems[index].text = text;
    setChecklistForm({ ...checklistForm, items: newItems });
  };

  const handleStartInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const cl = checklists.find(c => c.id === inspectionForm.checklistId);
    if (!cl) return;

    let hasFailed = false;
    const formattedResults = cl.items.map((item, index) => {
      const passed = inspectionForm.results[index];
      if (item.required && !passed) hasFailed = true;
      return { text: item.text, passed: passed || false };
    });

    const status = hasFailed ? 'failed' : 'passed';

    try {
      await createInspection({
        companyId: profile!.companyId,
        inspectorId: profile!.id,
        referenceType: inspectionForm.referenceType as any,
        referenceId: inspectionForm.referenceId,
        itemId: inspectionForm.itemId,
        checkDate: new Date().toISOString(),
        status,
        notes: inspectionForm.notes,
        checklistResults: formattedResults
      });
      setIsInspectionModalOpen(false);
      setInspectionForm({ referenceType: 'production_run', referenceId: '', itemId: '', checklistId: '', results: {}, notes: '' });
      loadData();
      if (hasFailed) alert(t('Inspection failed. An NCR has been auto-generated.'));
    } catch (err) {
      alert('Failed to submit inspection');
    }
  };



  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Inspections')}</h1>
          <p className="text-[var(--color-text)]/60">{t('Quality checklists and Non-Conformance tracking.')}</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={() => setIsChecklistModalOpen(true)}
            className="flex items-center space-x-2 border border-[var(--color-main)] text-[var(--color-main)] px-4 py-2 rounded-xl hover:bg-[var(--color-main)]/10 transition-all"
          >
            <Plus size={20} />
            <span>{t('New Checklist')}</span>
          </button>
          <button 
            onClick={() => setIsInspectionModalOpen(true)}
            className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <CheckCircle2 size={20} />
            <span>{t('Start Inspection')}</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-[var(--color-text)]/10 mb-6">
        {[
          { id: 'inspections', label: t('Inspections'), icon: ClipboardList },
          { id: 'checklists', label: t('Checklist Templates'), icon: FileText }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[var(--color-main)] text-[var(--color-main)] font-semibold'
                : 'border-transparent text-[var(--color-text)]/60 hover:text-[var(--color-text)]'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[var(--color-text)]/60">{t('Loading...')}</div>
      ) : (
        <>
          {activeTab === 'inspections' && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--color-bg)] text-[var(--color-text)]/60">
                  <tr>
                    <th className="p-4">{t('Date')}</th>
                    <th className="p-4">{t('Reference Type')}</th>
                    <th className="p-4">{t('Reference ID')}</th>
                    <th className="p-4">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-text)]/10">
                  {inspections.map((insp) => (
                    <tr key={insp.id} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                      <td className="p-4">{new Date(insp.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 capitalize">{insp.referenceType.replace('_', ' ')}</td>
                      <td className="p-4">{insp.referenceId || '-'}</td>
                      <td className="p-4"><Badge status={insp.status as any} /></td>
                    </tr>
                  ))}
                  {inspections.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[var(--color-text)]/60">
                        {t('No inspections found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'checklists' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {checklists.map((cl) => (
                <div key={cl.id} className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl p-6 hover:border-[var(--color-main)]/30 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-[var(--color-text)] text-lg">{cl.name}</h3>
                    <Badge status="active" text={cl.category} />
                  </div>
                  <ul className="space-y-2 mb-4 text-sm text-[var(--color-text)]/80">
                    {cl.items.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{item.text} {item.required && <span className="text-red-500">*</span>}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => { if(confirm('Delete checklist?')) deleteQualityChecklist(cl.id).then(loadData) }}
                    className="text-red-500 text-sm hover:underline"
                  >
                    {t('Delete')}
                  </button>
                </div>
              ))}
            </div>
          )}

        </>
      )}

      {/* Checklist Creation Modal */}
      <Modal isOpen={isChecklistModalOpen} onClose={() => setIsChecklistModalOpen(false)} title={t('Create Checklist Template')}>
        <form onSubmit={handleCreateChecklist} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('Checklist Name')}</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checklistForm.name}
              onChange={e => setChecklistForm({...checklistForm, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('Category')}</label>
            <select
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={checklistForm.category}
              onChange={e => setChecklistForm({...checklistForm, category: e.target.value})}
            >
              <option value="production">Production</option>
              <option value="receiving">Receiving</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('Items')}</label>
            {checklistForm.items.map((item, idx) => (
              <div key={idx} className="flex space-x-2 mb-2">
                <input 
                  type="text"
                  className="flex-1 p-2 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] text-sm"
                  placeholder="Checklist criteria"
                  value={item.text}
                  onChange={e => updateChecklistItem(idx, e.target.value)}
                  required
                />
              </div>
            ))}
            <button type="button" onClick={addChecklistItem} className="text-[var(--color-main)] text-sm mt-2 flex items-center">
              <Plus size={16} /> {t('Add Item')}
            </button>
          </div>
          <button type="submit" className="w-full bg-[var(--color-main)] text-white py-3 rounded-xl font-medium mt-4">
            {t('Save Checklist')}
          </button>
        </form>
      </Modal>

      {/* Start Inspection Modal */}
      <Modal isOpen={isInspectionModalOpen} onClose={() => setIsInspectionModalOpen(false)} title={t('Perform Inspection')}>
        <form onSubmit={handleStartInspection} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('Reference Type')}</label>
              <select
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={inspectionForm.referenceType}
                onChange={e => setInspectionForm({...inspectionForm, referenceType: e.target.value})}
              >
                <option value="production_run">Production Run</option>
                <option value="grn">GRN (Receiving)</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('Reference ID')}</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
                value={inspectionForm.referenceId}
                onChange={e => setInspectionForm({...inspectionForm, referenceId: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('Checklist Template')}</label>
            <select
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
              value={inspectionForm.checklistId}
              onChange={e => {
                setInspectionForm({...inspectionForm, checklistId: e.target.value, results: {}});
              }}
              required
            >
              <option value="">{t('Select Checklist...')}</option>
              {checklists.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          {inspectionForm.checklistId && (
            <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 mt-4">
              <h4 className="font-bold text-sm mb-4">{t('Inspection Items')}</h4>
              {checklists.find(c => c.id === inspectionForm.checklistId)?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-[var(--color-text)]/5 last:border-0">
                  <span className="text-sm">{item.text} {item.required && <span className="text-red-500">*</span>}</span>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`item-${idx}`} 
                        checked={inspectionForm.results[idx] === true}
                        onChange={() => setInspectionForm(prev => ({...prev, results: {...prev.results, [idx]: true}}))}
                        required={item.required}
                      />
                      <span className="text-sm text-green-600 font-medium">Pass</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`item-${idx}`} 
                        checked={inspectionForm.results[idx] === false}
                        onChange={() => setInspectionForm(prev => ({...prev, results: {...prev.results, [idx]: false}}))}
                      />
                      <span className="text-sm text-red-600 font-medium">Fail</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">{t('Additional Notes')}</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)] h-24"
              value={inspectionForm.notes}
              onChange={e => setInspectionForm({...inspectionForm, notes: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-[var(--color-main)] text-white py-3 rounded-xl font-medium">
            {t('Submit Inspection')}
          </button>
        </form>
      </Modal>

    </div>
  );
}
