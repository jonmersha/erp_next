import React, { useState, useEffect } from 'react';
import { MaintenanceLog, Equipment } from '../types';
import { getMaintenanceLogs, addMaintenanceLog } from '../services/maintenanceService';
import { useAuth } from '../context/AuthContext';
import { Loader2, Plus, Wrench } from 'lucide-react';
import Modal from '../components/Modal';
import { useTranslation } from 'react-i18next';

const Maintenance: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState<Omit<MaintenanceLog, 'id'>>({
    equipmentId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    technician: '',
    cost: 0,
    companyId: '',
  });

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const data = await getMaintenanceLogs(profile.companyId);
        setLogs(data);
      } catch (error) {
        console.error("Error fetching maintenance logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    setNewLog(prev => ({ ...prev, companyId: profile.companyId }));
    
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  const handleAddLog = async () => {
    if (!profile?.companyId) return;
    await addMaintenanceLog(newLog);
    setIsModalOpen(false);
    getMaintenanceLogs(profile.companyId).then(setLogs);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-[var(--color-main)]" />;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Maintenance Management (CMMS)</h2>
        <p className="text-[var(--color-text)]/40 mt-1">Track equipment maintenance schedules, spare parts, and breakdown history.</p>
      </header>

      <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text)]">Maintenance Logs</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl"
          >
            <Plus size={16} />
            <span>{t('Log Maintenance')}</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map(log => (
            <div key={log.id} className="border border-[var(--color-text)]/20 p-6 rounded-2xl space-y-4">
              <div className="flex items-center space-x-3">
                <Wrench className="text-[var(--color-main)]" />
                <h4 className="font-bold text-lg text-[var(--color-text)]">{log.description}</h4>
              </div>
              <p className="text-sm text-[var(--color-text)]/60">Date: {log.date}</p>
              <p className="text-sm text-[var(--color-text)]/60">Technician: {log.technician}</p>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('Log Maintenance')}>
        <div className="space-y-4 text-[var(--color-text)]">
          <input
            type="text"
            placeholder="Description"
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl"
            value={newLog.description}
            onChange={e => setNewLog(prev => ({ ...prev, description: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Technician"
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl"
            value={newLog.technician}
            onChange={e => setNewLog(prev => ({ ...prev, technician: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Cost"
            className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded-xl"
            value={newLog.cost}
            onChange={e => setNewLog(prev => ({ ...prev, cost: Number(e.target.value) }))}
          />
          <button 
            onClick={handleAddLog}
            className="w-full bg-[var(--color-main)] text-white p-3 rounded-xl"
          >
            {t('Save Log')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Maintenance;
