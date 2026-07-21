import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';
import { Plus, Trash2, Edit2, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';

const CircularFlow = ({ stages }: { stages: any[] }) => {
  const { t } = useTranslation();
  const total = stages.length;
  const radius = total > 5 ? 130 : 100; 
  const containerSize = 440;
  
  if (total === 0) {
    return <p className="text-xs text-[var(--color-text)]/40 italic flex items-center justify-center h-full">{t('No stages defined')}</p>;
  }

  const sortedStages = [...stages].sort((a: any, b: any) => (a.stageOrder || a.stage_order || 0) - (b.stageOrder || b.stage_order || 0));

  return (
    <div className="relative w-full flex items-center justify-center my-6 pointer-events-none" style={{ height: `${containerSize}px` }}>
      {/* SVG for connecting lines */}
      <svg width={containerSize} height={containerSize} className="absolute z-0 overflow-visible">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-main)" opacity="0.6" />
          </marker>
        </defs>
        <g transform={`translate(${containerSize/2}, ${containerSize/2})`}>
          {sortedStages.map((_, i) => {
            if (i === total - 1 && total > 1) return null; // don't connect last back to first
            
            const angle1 = (i / total) * 2 * Math.PI - Math.PI / 2;
            const angle2 = ((i + 1) % total) / total * 2 * Math.PI - Math.PI / 2;
            const x1 = Math.cos(angle1) * radius;
            const y1 = Math.sin(angle1) * radius;
            const x2 = Math.cos(angle2) * radius;
            const y2 = Math.sin(angle2) * radius;
            
            return (
              <line 
                key={i} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="var(--color-main)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
                opacity="0.5"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </g>
      </svg>
      
      {/* Central icon */}
      <div className="absolute flex flex-col items-center justify-center text-[var(--color-main)]/10 z-0">
        <RefreshCw size={64} className="animate-[spin_40s_linear_infinite]" />
      </div>

      {sortedStages.map((stage, i) => {
        const angle = (i / total) * 2 * Math.PI - Math.PI / 2; // Start at top
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        // Calculate text position pushed further outward
        const textRadius = radius + 55;
        const textX = Math.cos(angle) * textRadius;
        const textY = Math.sin(angle) * textRadius;
        
        return (
          <React.Fragment key={stage.id || i}>
            <div 
              className="absolute flex flex-col items-center justify-center z-10"
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
                width: '60px',
                height: '60px'
              }}
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-main)] text-white flex items-center justify-center shadow-lg text-lg font-bold border-[3px] border-white dark:border-[var(--color-surface)] z-10">
                {i + 1}
              </div>
            </div>

            <div 
              className="absolute text-center leading-tight z-20 pointer-events-none flex flex-col items-center justify-center"
              style={{
                transform: `translate(${textX}px, ${textY}px)`,
                width: '130px'
              }}
            >
              <div className="bg-transparent inline-block p-1 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                <p className="text-[11px] font-bold text-[var(--color-text)] line-clamp-2" title={stage.stageName || stage.stage_name}>
                  {stage.stageName || stage.stage_name}
                </p>
                <p className="text-[10px] text-[var(--color-text)]/70 mt-0.5">
                  {stage.estimatedTimeMinutes || stage.estimated_time_minutes} {t('mins')}
                </p>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const WorkflowTemplates: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    stages: [] as Array<{ stageName: string, estimatedTimeMinutes: number, percentageWeight: number }>
  });

  useEffect(() => {
    fetchTemplates();
    const interval = setInterval(fetchTemplates, 5000); // Auto refresh to fetch stages
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  const fetchTemplates = async () => {
    if (!profile?.companyId) return;
    try {
      const data = await apiService.get<any[]>(`workflowTemplates?companyId=${profile.companyId}`);
      if (data) setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const data = await apiService.get<any>(`workflowTemplates/${id}`);
      if (data) {
        setForm({
          id: data.id,
          name: data.name,
          description: data.description || '',
          stages: data.stages || []
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await apiService.delete(`workflowTemplates/${id}`);
      await fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        stages: form.stages,
        companyId: profile?.companyId
      };
      
      if (form.id) {
        await apiService.put(`workflowTemplates/${form.id}`, payload);
      } else {
        await apiService.post('workflowTemplates', payload);
      }
      
      setIsModalOpen(false);
      setForm({ id: '', name: '', description: '', stages: [] });
      await fetchTemplates();
    } catch (err) {
      console.error("Error saving template:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Workflow Templates')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Standardized production steps and times')}</p>
        </div>
        <button 
          onClick={() => {
            setForm({ id: '', name: '', description: '', stages: [] });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
        >
          <Plus size={20} />
          <span className="font-bold">{t('New Template')}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
        {templates.map(t => (
          <div 
            key={t.id} 
            className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
            onClick={async () => {
              try {
                // Fetch fresh details just in case the list is stale
                const data = await apiService.get<any>(`workflowTemplates/${t.id}`);
                setDetailTemplate(data || t);
              } catch (err) {
                console.error("Failed to fetch details", err);
                setDetailTemplate(t);
              }
              setIsDetailModalOpen(true);
            }}
          >
            <h3 className="text-xl font-bold text-[var(--color-text)]">{t.name}</h3>
            <p className="text-sm text-[var(--color-text)]/50 mt-2">{t.description || t('No description provided')}</p>
            
            <div className="mt-6 flex-1 w-full">
              {/* Pass t as a property on the first stage just for the helper component to use if needed, or pass it explicitly */}
              <CircularFlow stages={(t.stages || []).map((s: any) => ({...s}))} />
            </div>
            
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-[var(--color-text)]/10" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleEdit(t.id); }}
                className="p-2 text-[var(--color-text)]/60 hover:text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-xl transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                className="p-2 text-[var(--color-text)]/60 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-[var(--color-text)]/20 rounded-3xl text-[var(--color-text)]/40">
            {t('No templates created yet. Create a workflow template to standardize your production stages.')}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? t("Edit Template") : t("New Workflow Template")}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Template Name')}</label>
            <input 
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={t("e.g. Standard Flour Milling")}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Description')}</label>
            <textarea 
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)] h-24 resize-none"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-[var(--color-text)]/10">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Standard Stages')}</label>
              <button 
                type="button"
                onClick={() => setForm({ ...form, stages: [...form.stages, { stageName: '', estimatedTimeMinutes: 0, percentageWeight: 0 }] })}
                className="text-xs text-[var(--color-main)] font-bold hover:underline flex items-center space-x-1"
              >
                <Plus size={14} /> <span>{t('Add Stage')}</span>
              </button>
            </div>
            
            {form.stages.map((stage, index) => (
              <div key={index} className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold bg-[var(--color-main)]/10 text-[var(--color-main)] px-2 py-1 rounded-md">{t('Stage')} {index + 1}</span>
                  <button type="button" onClick={() => {
                    const newStages = [...form.stages];
                    newStages.splice(index, 1);
                    setForm({ ...form, stages: newStages });
                  }} className="text-red-500 text-xs font-bold hover:underline">{t('Remove')}</button>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">{t('Stage Name *')}</label>
                  <input 
                    type="text" required placeholder={t("e.g. Milling")}
                    value={stage.stageName}
                    onChange={e => {
                      const newStages = [...form.stages];
                      newStages[index].stageName = e.target.value;
                      setForm({ ...form, stages: newStages });
                    }}
                    className="w-full p-2 text-sm bg-transparent border-b border-[var(--color-text)]/20 focus:border-[var(--color-main)] focus:outline-none text-[var(--color-text)]"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">{t('Est. Time (mins)')}</label>
                    <input 
                      type="number" min="0" placeholder={t("Optional")}
                      value={stage.estimatedTimeMinutes || ''}
                      onChange={e => {
                        const newStages = [...form.stages];
                        newStages[index].estimatedTimeMinutes = parseInt(e.target.value) || 0;
                        setForm({ ...form, stages: newStages });
                      }}
                      className="w-full p-2 text-sm bg-transparent border-b border-[var(--color-text)]/20 focus:border-[var(--color-main)] focus:outline-none text-[var(--color-text)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">{t('Weight (%)')}</label>
                    <input 
                      type="number" min="0" max="100" placeholder={t("Optional")}
                      value={stage.percentageWeight || ''}
                      onChange={e => {
                        const newStages = [...form.stages];
                        newStages[index].percentageWeight = parseFloat(e.target.value) || 0;
                        setForm({ ...form, stages: newStages });
                      }}
                      className="w-full p-2 text-sm bg-transparent border-b border-[var(--color-text)]/20 focus:border-[var(--color-main)] focus:outline-none text-[var(--color-text)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            disabled={submitting}
            type="submit"
            className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 disabled:opacity-50 transition-all"
          >
            {submitting ? t('Saving...') : t('Save Template')}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={t('Template Details')}>
        {detailTemplate && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/10">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Company')}</p>
                <p className="font-bold text-[var(--color-text)]">{detailTemplate.companyId || 'N/A'}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/10">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Created On')}</p>
                <p className="font-bold text-[var(--color-text)]">{detailTemplate.createdAt ? new Date(detailTemplate.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg text-[var(--color-text)] mb-4">{t('Production Stages')}</h4>
              
              <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/10 overflow-hidden">
                {detailTemplate.stages && detailTemplate.stages.length > 0 ? (
                  [...detailTemplate.stages].sort((a: any, b: any) => (a.stageOrder || a.stage_order || 0) - (b.stageOrder || b.stage_order || 0)).map((stage: any, index: number) => (
                    <React.Fragment key={stage.id || index}>
                      <div className="flex flex-col items-center group relative w-28">
                        <div className="w-14 h-14 rounded-full bg-[var(--color-main)] text-white flex items-center justify-center shadow-lg z-10 text-xl font-bold border-4 border-white dark:border-[var(--color-surface)]">
                          {index + 1}
                        </div>
                        <div className="mt-4 text-center w-full">
                          <p className="text-sm font-bold text-[var(--color-text)] leading-tight px-1 whitespace-normal" title={stage.stageName || stage.stage_name}>
                            {stage.stageName || stage.stage_name}
                          </p>
                          <div className="mt-2 inline-block bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-text)]/10">
                            <p className="text-[10px] font-mono text-[var(--color-text)]/60">
                              {stage.estimatedTimeMinutes || stage.estimated_time_minutes || 0}m
                            </p>
                            <p className="text-[10px] font-mono text-[var(--color-text)]/60 mt-0.5">
                              {stage.percentageWeight || stage.percentage_weight || 0}% {t('weight')}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < detailTemplate.stages.length - 1 && (
                        <div className="text-[var(--color-main)]/30 -mt-16 flex-shrink-0">
                          <ArrowRight size={32} />
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-[var(--color-text)]/50 italic">{t('No stages defined')}</p>
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t border-[var(--color-text)]/10 flex justify-end space-x-4">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-colors"
              >
                {t('Close')}
              </button>
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEdit(detailTemplate.id);
                }}
                className="bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[var(--color-main)]/90 flex items-center gap-2 transition-colors"
              >
                <Edit2 size={18} />
                Edit Template
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkflowTemplates;
