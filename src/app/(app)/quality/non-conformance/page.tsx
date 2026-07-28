'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { getNCRs, NonConformanceReport, updateNCR } from '../../../../services/inspectionService';
import NCRKanbanColumn from '../../../../components/quality/NCRKanbanColumn';
import NCRModal from '../../../../modals/NCRModal';

export default function NonConformancePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isNCRModalOpen, setIsNCRModalOpen] = useState(false);
  const [selectedNCR, setSelectedNCR] = useState<NonConformanceReport | null>(null);

  useEffect(() => {
    if (profile?.companyId) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getNCRs(profile!.companyId);
      setNcrs(data);
    } catch (err: any) {
      setError('Failed to load NCRs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNCR = async (id: string, updates: Partial<NonConformanceReport>) => {
    await updateNCR(id, updates);
    setIsNCRModalOpen(false);
    setSelectedNCR(null);
    loadData();
  };

  const openNCR = (ncr: NonConformanceReport) => {
    setSelectedNCR(ncr);
    setIsNCRModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Non-Conformance Management')}</h1>
            <p className="text-[var(--color-text)]/60">{t('Track and resolve quality deviations via RCA, CAPA, and disposition workflows.')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-[var(--color-text)]/60">{t('Loading NCMRs...')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NCRKanbanColumn 
            status="open" 
            title={t('Open')} 
            ncrs={ncrs} 
            onOpenNCR={openNCR} 
          />
          <NCRKanbanColumn 
            status="investigating" 
            title={t('Investigating')} 
            ncrs={ncrs} 
            onOpenNCR={openNCR} 
          />
          <NCRKanbanColumn 
            status="resolved" 
            title={t('Resolved')} 
            ncrs={ncrs} 
            onOpenNCR={openNCR} 
          />
        </div>
      )}

      <NCRModal 
        isOpen={isNCRModalOpen} 
        onClose={() => setIsNCRModalOpen(false)} 
        ncr={selectedNCR} 
        onSave={handleUpdateNCR}
        currentUserId={profile?.id}
      />
    </div>
  );
}
