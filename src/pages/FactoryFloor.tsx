import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { ProductionRun } from '../types';
import { useInventoryData } from '../hooks/useInventoryData';
import { CheckCircle, AlertCircle, RotateCw, PackageCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FactoryFloor: React.FC = () => {
  const { profile } = useAuth();
  const { warehouses, materials, loading } = useInventoryData();
  const [runs, setRuns] = useState<ProductionRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'milling' | 'packaging'>('milling');

  // Milling State
  const [extractionRate, setExtractionRate] = useState('');
  const [downtime, setDowntime] = useState('');
  const [notes, setNotes] = useState('');

  // Packaging State
  const [sacksProduced, setSacksProduced] = useState('');
  const [selectedSackId, setSelectedSackId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveRuns();
  }, []);

  const fetchActiveRuns = async () => {
    try {
      const data = await apiService.get<ProductionRun[]>(`production?companyId=${profile?.companyId}`);
      if (data) {
        setRuns(data.filter(r => r.status === 'in_progress' || r.status === 'planned'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRunId) {
      setError('Please select an Active Run ID');
      return;
    }
    
    if (activeTab === 'packaging' && (!selectedSackId || !selectedWarehouseId)) {
      setError('Please select a Sack Material and Destination Warehouse');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = activeTab === 'milling' 
        ? {
            extractionRate: Number(extractionRate),
            downtimeMinutes: Number(downtime),
            maintenanceNotes: notes,
          }
        : {
            sacksProduced: Number(sacksProduced),
            sacksConsumed: Number(sacksProduced), // 1 sack per product unit
            sackItemId: selectedSackId,
            warehouseId: selectedWarehouseId
          };

      await apiService.addDocument(`production/${selectedRunId}/events`, {
        eventType: activeTab,
        payload,
        performedBy: profile?.uid,
      });
      
      setSuccess(true);
      
      if (activeTab === 'milling') {
        setExtractionRate('');
        setDowntime('');
        setNotes('');
      } else {
        setSacksProduced('');
        setSelectedSackId('');
        setSelectedWarehouseId('');
      }
      setSelectedRunId('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center space-x-4">
          <div className="p-4 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-2xl">
            {activeTab === 'milling' ? <RotateCw size={40} /> : <PackageCheck size={40} />}
          </div>
          <div>
            <h1 className="text-4xl font-black text-[var(--color-text)] tracking-tight">Factory Floor</h1>
            <p className="text-lg text-[var(--color-text)]/50 mt-1 font-medium">Input Station for Factory Operators</p>
          </div>
        </header>

        <div className="flex space-x-4 mb-8">
          <button 
            onClick={() => setActiveTab('milling')}
            className={`flex-1 py-4 text-xl font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 ${activeTab === 'milling' ? 'bg-[var(--color-main)] text-white shadow-xl shadow-[var(--color-main)]/20' : 'bg-[var(--color-surface)] text-[var(--color-text)]/50 hover:bg-[var(--color-surface)]/80'}`}
          >
            <RotateCw size={24} /> <span>Milling Log</span>
          </button>
          <button 
            onClick={() => setActiveTab('packaging')}
            className={`flex-1 py-4 text-xl font-bold rounded-2xl transition-all flex items-center justify-center space-x-2 ${activeTab === 'packaging' ? 'bg-[var(--color-main)] text-white shadow-xl shadow-[var(--color-main)]/20' : 'bg-[var(--color-surface)] text-[var(--color-text)]/50 hover:bg-[var(--color-surface)]/80'}`}
          >
            <PackageCheck size={24} /> <span>Packaging Log</span>
          </button>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-emerald-500 text-white rounded-3xl flex items-center space-x-4 shadow-xl shadow-emerald-500/20"
            >
              <CheckCircle size={32} />
              <span className="text-xl font-bold">Data successfully logged to ERP!</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 bg-rose-500 text-white rounded-3xl flex items-center space-x-4 shadow-xl shadow-rose-500/20"
            >
              <AlertCircle size={32} />
              <span className="text-xl font-bold">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[var(--color-surface)] rounded-[3rem] p-10 border border-[var(--color-text)]/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-3">
              <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                Active Production Run ID
              </label>
              <select 
                value={selectedRunId}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="w-full h-20 px-6 text-xl bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] font-bold transition-all"
              >
                <option value="">-- Tap to Select Run --</option>
                {runs.map(r => (
                  <option key={r.id} value={r.id}>
                    Run #{r.id.slice(0, 8)} - {r.quantity} units ({r.status})
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'milling' ? (
              <>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                      Extraction Rate (%)
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      value={extractionRate}
                      onChange={(e) => setExtractionRate(e.target.value)}
                      placeholder="e.g. 78.5"
                      className="w-full h-20 px-6 text-2xl font-bold bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] transition-all placeholder:text-[var(--color-text)]/20"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                      Machine Downtime (Minutes)
                    </label>
                    <input 
                      type="number"
                      value={downtime}
                      onChange={(e) => setDowntime(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full h-20 px-6 text-2xl font-bold bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] transition-all placeholder:text-[var(--color-text)]/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                    Maintenance Notes (Optional)
                  </label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Log any jams, filter changes, or issues here..."
                    className="w-full h-40 p-6 text-xl font-medium bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] transition-all resize-none placeholder:text-[var(--color-text)]/20"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                    Sacks Produced
                  </label>
                  <input 
                    type="number"
                    value={sacksProduced}
                    onChange={(e) => setSacksProduced(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full h-20 px-6 text-2xl font-bold bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] transition-all placeholder:text-[var(--color-text)]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                      Empty Sack Material (To Consume)
                    </label>
                    <select 
                      value={selectedSackId}
                      onChange={(e) => setSelectedSackId(e.target.value)}
                      className="w-full h-20 px-6 text-xl bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] font-bold transition-all"
                    >
                      <option value="">-- Select Material --</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.id.slice(0, 8)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm uppercase tracking-widest font-bold text-[var(--color-text)]/60">
                      Destination Warehouse (For Finished Goods)
                    </label>
                    <select 
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full h-20 px-6 text-xl bg-[var(--color-bg)] rounded-2xl border-2 border-[var(--color-text)]/10 focus:border-[var(--color-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-main)]/10 text-[var(--color-text)] font-bold transition-all"
                    >
                      <option value="">-- Select Warehouse --</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit"
              disabled={submitting || loading}
              className="w-full h-24 bg-[var(--color-main)] text-white text-2xl font-black uppercase tracking-widest rounded-3xl hover:bg-[var(--color-main)]/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-[var(--color-main)]/20"
            >
              {submitting ? 'Submitting Data...' : `Log ${activeTab === 'milling' ? 'Milling' : 'Packaging'} Data`}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FactoryFloor;
