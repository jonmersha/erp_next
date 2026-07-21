import React, { useState, useMemo } from 'react';
import { useProductionData } from '../hooks/useProductionData';
import { ProductionRun } from '../types';
import { createProductionRun, updateProductionProgress } from '../services/productionService';
import { transferProductionToWarehouse } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Factory as FactoryIcon, Play, CheckCircle, Clock, Plus, Settings, Loader2, ArrowRight, Search, Filter, TrendingUp, AlertCircle, Upload, Download } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/common/Badge';
import { ProductionTimeline } from '../components/production/ProductionTimeline';

const Production: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { factories, runs, plans, products, recipes, users, workflowTemplates, loading, refreshData } = useProductionData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ProductionRun | null>(null);
  const [progressModal, setProgressModal] = useState<{isOpen: boolean, runId: string, quantity: number, target: number} | null>(null);
  const [transferModal, setTransferModal] = useState<{isOpen: boolean, runId: string, productId: string, quantity: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const token = await auth.currentUser?.getIdToken() || '';
      const res = await fetch(`http://192.168.8.163:4000/api/production/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production_runs_template.csv`;
      a.click();
    } catch (e) {
      console.error(e);
      alert('Failed to download template');
    }
  };

  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.companyId) return;
    
    setIsUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', profile.companyId);

      const token = await auth.currentUser?.getIdToken() || '';
      const res = await fetch(`http://192.168.8.163:4000/api/production/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload CSV');
      }

      alert(t(`Production runs uploaded successfully!`));
      await refreshData();
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    } finally {
      setIsUploadingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [form, setForm] = useState({
    factoryId: '',
    productId: '',
    recipeId: '',
    quantity: 0,
    status: 'planned' as 'planned' | 'in_progress' | 'completed',
    startDate: new Date().toISOString().split('T')[0],
    workflowTemplateId: ''
  });

  const stats = useMemo(() => {
    const active = runs.filter(r => r.status === 'in_progress').length;
    const planned = runs.filter(r => r.status === 'planned').length;
    const completedToday = runs.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      return r.status === 'completed' && r.updatedAt?.startsWith(today);
    }).length;
    
    return { active, planned, completedToday };
  }, [runs]);

  const filteredRuns = useMemo(() => {
    return runs
      .filter(run => {
        const product = products.find(p => p.id === run.productId);
        const factory = factories.find(f => f.id === run.factoryId);
        const matchesSearch = 
          product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          factory?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          run.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || run.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Sort by status (in_progress first, then planned, then completed)
        const statusOrder = { in_progress: 0, planned: 1, completed: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        // Then by progress (descending)
        // Then by progress (descending)
        const getProgress = (r: ProductionRun) => r.calculatedProgress !== undefined ? r.calculatedProgress : (r.quantity > 0 ? (r.quantityProduced / r.quantity) * 100 : 0);
        const progressA = getProgress(a);
        const progressB = getProgress(b);
        return progressB - progressA;
      });
  }, [runs, products, factories, searchQuery, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProductionRun(form, profile);
      await refreshData();
      setIsModalOpen(false);
      setForm({
        factoryId: '',
        productId: '',
        recipeId: '',
        quantity: 0,
        status: 'planned',
        startDate: new Date().toISOString().split('T')[0],
        workflowTemplateId: ''
      });
    } catch (error) {
      console.error("Error creating production run:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateProgress = async (runId: string, quantity: number, status: string) => {
    try {
      await updateProductionProgress(runId, quantity, status as any);
      await refreshData();
    } catch (error) {
      console.error("Error updating production run:", error);
    }
  };

  const onTransferToWarehouse = async (productId: string, quantity: number, warehouseId: string) => {
    try {
      setSubmitting(true);
      await transferProductionToWarehouse(productId, quantity, warehouseId, profile);
      await refreshData();
      setTransferModal(null);
    } catch (error) {
      console.error("Error transferring production:", error);
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Production')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Manufacturing schedules and factory output')}</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center space-x-2 bg-[var(--color-bg)] border border-[var(--color-text)]/20 text-[var(--color-text)] px-4 py-3 rounded-2xl hover:bg-[var(--color-text)]/5 transition-all whitespace-nowrap"
            title={t('Download CSV Template')}
          >
            <Download size={18} />
            <span className="font-bold text-sm hidden md:inline">{t('Template')}</span>
          </button>
          
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUploadCsv} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCSV}
            className="flex items-center space-x-2 bg-[var(--color-surface)] border border-[var(--color-main)]/30 text-[var(--color-main)] px-4 py-3 rounded-2xl hover:bg-[var(--color-main)]/10 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {isUploadingCSV ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="font-bold text-sm hidden md:inline">{isUploadingCSV ? t('Uploading...') : t('Upload CSV')}</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all justify-center whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="font-bold hidden md:inline">{t('New Production Run')}</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Column (Primary) */}
        <div className="flex-1 space-y-8 w-full overflow-hidden">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Clock size={24} />
            </div>
            <Badge variant="info">{t('Active')}</Badge>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{stats.active}</p>
          <p className="text-sm text-[var(--color-text)]/40 mt-1">{t('Runs currently in progress')}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <TrendingUp size={24} />
            </div>
            <Badge variant="warning">{t('Planned')}</Badge>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{stats.planned}</p>
          <p className="text-sm text-[var(--color-text)]/40 mt-1">{t('Scheduled for future')}</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <CheckCircle size={24} />
            </div>
            <Badge variant="success">{t('Today')}</Badge>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{stats.completedToday}</p>
          <p className="text-sm text-[var(--color-text)]/40 mt-1">{t('Completed in last 24h')}</p>
        </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden">
            <div className="p-6 border-b border-[var(--color-text)]/20 flex flex-col items-center gap-4">
              <h3 className="font-serif font-bold text-xl text-[var(--color-text)] text-center">{t('Manufacturing Schedule')}</h3>
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 w-full max-w-2xl">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={18} />
                  <input 
                    type="text"
                    placeholder={t("Search runs...")}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-sm w-full"
                  />
                </div>
                <div className="flex items-center space-x-2 bg-[var(--color-bg)] px-3 py-2 rounded-xl border border-[var(--color-text)]/20 w-full md:w-auto">
                  <Filter size={16} className="text-[var(--color-text)]/40 shrink-0" />
                  <select 
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-sm font-medium text-[var(--color-text)] w-full md:w-auto"
                  >
                <option value="all">{t('All Status')}</option>
                <option value="planned">{t('Planned')}</option>
                <option value="in_progress">{t('In Progress')}</option>
                <option value="completed">{t('Completed')}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg)]/50 text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest">
                <th className="px-6 py-4">{t('Run ID')}</th>
                <th className="px-6 py-4">{t('Product & Recipe')}</th>
                <th className="px-6 py-4">{t('Factory')}</th>
                <th className="px-6 py-4">{t('Progress')}</th>
                <th className="px-6 py-4">{t('Start Date')}</th>
                <th className="px-6 py-4">{t('Status')}</th>
                <th className="px-6 py-4 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5 text-sm">
              {filteredRuns.map((run) => {
                const product = products.find(p => p.id === run.productId);
                const recipe = recipes.find(r => r.id === run.recipeId);
                const progress = run.calculatedProgress !== undefined ? Math.round(run.calculatedProgress) : (run.quantity > 0 ? Math.round((run.quantityProduced / run.quantity) * 100) : 0);
                
                return (
                  <tr key={run.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[var(--color-main)]">#{run.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text)]">{product?.name || t('Unknown Product')}</div>
                      <div className="text-xs text-[var(--color-text)]/40">{recipe?.name || t('No Recipe')}</div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text)]/60">
                      {factories.find(f => f.id === run.factoryId)?.name || t('Unknown Factory')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${
                              run.status === 'completed' ? 'bg-emerald-500' : 'bg-[var(--color-main)]'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-text)]/60 w-8">{progress}%</span>
                      </div>
                      <div className="text-[10px] text-[var(--color-text)]/30 mt-1 flex justify-between">
                        <span>{(run.quantityProduced || 0).toLocaleString()} / {(run.quantity || 0).toLocaleString()} {t('units')}</span>
                        {run.status !== 'completed' && (
                          <span className="text-[var(--color-main)]/60">{((run.quantity || 0) - (run.quantityProduced || 0)).toLocaleString()} {t('left')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text)]/60">{new Date(run.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        run.status === 'completed' ? 'success' : 
                        run.status === 'in_progress' ? 'info' : 'warning'
                      }>
                        {run.status.replace('_', ' ')}
                      </Badge>
                      {run.status === 'in_progress' && run.currentStageName && (
                        <div className="text-[10px] uppercase font-bold text-[var(--color-text)]/40 mt-2 truncate w-24">
                          {run.currentStageName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        {run.status === 'planned' && (
                          <button 
                            onClick={() => onUpdateProgress(run.id, 0, 'in_progress')}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Start Production"
                          >
                            <Play size={18} />
                          </button>
                        )}
                        {run.status === 'in_progress' && (
                          <button 
                            onClick={() => setProgressModal({isOpen: true, runId: run.id, quantity: run.quantityProduced, target: run.quantity})}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Update Progress"
                          >
                            <Clock size={18} />
                          </button>
                        )}
                        {run.status === 'completed' && (
                          <button 
                            onClick={() => setTransferModal({isOpen: true, runId: run.id, productId: run.productId, quantity: run.quantityProduced})}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Transfer to Warehouse"
                          >
                            <ArrowRight size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedRun(run)}
                          className="p-2 text-[var(--color-text)]/20 hover:text-[var(--color-text)]/40 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Settings size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRuns.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-text)]/40">
                    <div className="flex flex-col items-center">
                      <AlertCircle size={48} className="mb-4 opacity-20" />
                      <p className="font-medium">{t('No production runs found')}</p>
                      <p className="text-xs">{t('Try adjusting your search or filters')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

        {/* Right Column (Sidebar) */}
        <div className="w-full xl:w-80 flex flex-col gap-4 shrink-0">
          <h3 className="font-bold text-[var(--color-text)] uppercase tracking-widest text-xs mb-2 pl-2">
            {t('Factory Overviews')}
          </h3>
          <div className="flex flex-col gap-4">
        {factories.map(factory => {
          const factoryRuns = runs.filter(r => r.factoryId === factory.id);
          const activeRuns = factoryRuns.filter(r => r.status === 'in_progress');
          const factoryPlans = plans.filter(p => p.factoryId === factory.id);
          const totalPlanned = factoryPlans.reduce((acc, p) => acc + Number(p.totalQuantity || 0), 0);
          
          const totalProduced = activeRuns.reduce((acc, r) => acc + Number(r.quantityProduced || 0), 0);
          const totalTarget = activeRuns.reduce((acc, r) => acc + Number(r.quantity || 0), 0);
          const productionRate = totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0;

          return (
            <motion.div 
              key={factory.id}
              whileHover={{ y: -2 }}
              className="bg-[var(--color-surface)] p-5 rounded-3xl shadow-sm border border-[var(--color-text)]/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-main)]/5 rounded-full blur-xl -mr-10 -mt-10" />
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-[var(--color-main)]/10 rounded-2xl text-[var(--color-main)]">
                  <FactoryIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-text)] text-sm">{factory.name}</h3>
                  <p className="text-[10px] text-[var(--color-text)]/40 truncate w-40">{factory.location}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/40 block mb-1">{t('Total Target')}</span>
                    <span className="font-bold text-[var(--color-text)] text-sm">{totalTarget.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/40 block mb-1">{t('Finished')}</span>
                    <span className="font-bold text-[var(--color-text)] text-sm">{totalProduced.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">{t('Production Rate')}</span>
                    <span className="font-bold text-[10px] text-[var(--color-main)]">{productionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-text)]/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${productionRate}%` }}
                      className="h-full bg-[var(--color-main)] rounded-full"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-text)]/10 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">{t('Active Runs')}</span>
                  <Badge variant={activeRuns.length > 0 ? 'info' : 'default'}>{activeRuns.length}</Badge>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      </div>
      </div>

      <Modal isOpen={!!selectedRun} onClose={() => setSelectedRun(null)} title={t("Production Run Details")}>
        {selectedRun && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Run ID')}</p>
                <p className="font-mono font-bold text-[var(--color-main)]">#{selectedRun.id.slice(0, 12)}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Status')}</p>
                <Badge variant={
                  selectedRun.status === 'completed' ? 'success' : 
                  selectedRun.status === 'in_progress' ? 'info' : 'warning'
                }>
                  {selectedRun.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[var(--color-main)]/10 rounded-2xl text-[var(--color-main)]">
                  <FactoryIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">{t('Factory')}</p>
                  <p className="font-bold text-[var(--color-text)]">
                    {factories.find(f => f.id === selectedRun.factoryId)?.name || t('Unknown Factory')}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">{t('Product')}</p>
                  <p className="font-bold text-[var(--color-text)]">
                    {products.find(p => p.id === selectedRun.productId)?.name || t('Unknown Product')}
                  </p>
                </div>
              </div>

              {selectedRun.recipeId && (
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                    <Settings size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">{t('Recipe')}</p>
                    <p className="font-bold text-[var(--color-text)]">
                      {recipes.find(r => r.id === selectedRun.recipeId)?.name || t('Unknown Recipe')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[var(--color-bg)] p-6 rounded-3xl border border-[var(--color-text)]/20">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Production Progress')}</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {(selectedRun.quantityProduced || 0).toLocaleString()} / {(selectedRun.quantity || 0).toLocaleString()}
                    <span className="text-sm text-[var(--color-text)]/40 ml-2">{t('units')}</span>
                  </p>
                  {selectedRun.status !== 'completed' && (
                    <p className="text-xs text-[var(--color-main)]/60 mt-1">
                      {((selectedRun.quantity || 0) - (selectedRun.quantityProduced || 0)).toLocaleString()} {t('units remaining')}
                    </p>
                  )}
                </div>
                <p className="text-xl font-bold text-[var(--color-main)]">
                  {selectedRun.calculatedProgress !== undefined ? Math.round(selectedRun.calculatedProgress) : (selectedRun.quantity > 0 ? Math.round((selectedRun.quantityProduced / selectedRun.quantity) * 100) : 0)}%
                </p>
              </div>
              <div className="h-3 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedRun.calculatedProgress !== undefined ? selectedRun.calculatedProgress : (selectedRun.quantity > 0 ? (selectedRun.quantityProduced / selectedRun.quantity) * 100 : 0)}%` }}
                  className="h-full bg-[var(--color-main)] rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Start Date')}</p>
                <p className="font-medium text-[var(--color-text)]">{new Date(selectedRun.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">{t('Last Updated')}</p>
                <p className="font-medium text-[var(--color-text)]">
                  {selectedRun.updatedAt ? new Date(selectedRun.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {selectedRun.recipeId && recipes.find(r => r.id === selectedRun.recipeId)?.processingSteps && (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">{t('Processing Steps')}</p>
                <div className="space-y-2">
                  {recipes.find(r => r.id === selectedRun.recipeId)?.processingSteps.sort((a, b) => a.order - b.order).map((step, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-main)]/10 text-[var(--color-main)] flex items-center justify-center text-xs font-bold">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--color-text)]">{step.description}</p>
                        <p className="text-[10px] text-[var(--color-text)]/40">{step.durationMinutes} {t('minutes')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ProductionTimeline 
              run={selectedRun} 
              onStatusChange={(newStatus) => {
                setSelectedRun({ ...selectedRun, status: newStatus as any });
                refreshData();
              }} 
            />

            <div className="pt-4 flex space-x-3">
              <button 
                onClick={() => setSelectedRun(null)}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-all"
              >
                {t('Close')}
              </button>
              {selectedRun.status !== 'completed' && (
                <button 
                  onClick={() => {
                    setProgressModal({
                      isOpen: true, 
                      runId: selectedRun.id, 
                      quantity: selectedRun.quantityProduced, 
                      target: selectedRun.quantity
                    });
                    setSelectedRun(null);
                  }}
                  className="flex-1 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 transition-all"
                >
                  {t('Update Progress')}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("New Production Run")}>
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Target Factory')}</label>
            <select 
              required
              value={form.factoryId}
              onChange={e => setForm({ ...form, factoryId: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            >
              <option value="">{t('Select Factory')}</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Product')}</label>
              <select 
                required
                value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value, recipeId: '' })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              >
                <option value="">{t('Select Product')}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Recipe (Optional)')}</label>
              <select 
                value={form.recipeId}
                onChange={e => setForm({ ...form, recipeId: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              >
                <option value="">{t('Select Recipe')}</option>
                {recipes.filter(r => r.productId === form.productId).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Target Volume / Quantity')}</label>
              <input 
                type="number"
                required
                min="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Start Strategy')}</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as any })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              >
                <option value="planned">{t('Schedule for Later')}</option>
                <option value="in_progress">{t('Start Immediately')}</option>
              </select>
            </div>
          </div>

          {form.status === 'planned' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Schedule Date')}</label>
              <input 
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              />
            </div>
          )}
          
          <div className="space-y-1 pt-4 border-t border-[var(--color-text)]/10">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Workflow Template')}</label>
            <select 
              value={form.workflowTemplateId}
              onChange={e => setForm({ ...form, workflowTemplateId: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            >
              <option value="">{t('No Template (Skip Stages)')}</option>
              {workflowTemplates && workflowTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <button 
            disabled={submitting}
            type="submit"
            className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 disabled:opacity-50 transition-all"
          >
            {submitting ? t('Creating...') : form.status === 'in_progress' ? t('Start Production Now') : t('Schedule Production')}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!progressModal?.isOpen} onClose={() => setProgressModal(null)} title={t("Update Progress")}>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Produced Quantity')}</label>
            <div className="relative">
              <input 
                type="number"
                value={progressModal?.quantity || 0}
                max={progressModal?.target}
                onChange={e => setProgressModal(prev => prev ? {...prev, quantity: parseInt(e.target.value) || 0} : null)}
                className="w-full p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20 text-[var(--color-text)] text-2xl font-bold text-center"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20 font-bold">
                / {progressModal?.target}
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--color-bg)] p-4 rounded-2xl border border-[var(--color-text)]/20">
            <div className="flex justify-between text-xs font-bold text-[var(--color-text)]/40 uppercase mb-2">
              <span>{t('Completion')}</span>
              <span>{progressModal?.target && progressModal.target > 0 ? Math.round(((progressModal?.quantity || 0) / progressModal.target) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-main)] transition-all duration-500"
                style={{ width: `${progressModal?.target && progressModal.target > 0 ? Math.round(((progressModal?.quantity || 0) / progressModal.target) * 100) : 0}%` }}
              />
            </div>
          </div>

          <button 
            onClick={async () => {
              if(progressModal) {
                const newStatus = progressModal.quantity >= progressModal.target ? 'completed' : 'in_progress';
                await onUpdateProgress(progressModal.runId, progressModal.quantity, newStatus);
                setProgressModal(null);
              }
            }}
            disabled={submitting}
            className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 transition-all disabled:opacity-50"
          >
            {submitting ? t('Updating...') : t('Update Progress')}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!transferModal?.isOpen} onClose={() => setTransferModal(null)} title={t("Transfer to Warehouse")}>
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center space-x-3 text-emerald-600">
              <CheckCircle size={20} />
              <span className="font-bold">{t('Production Completed')}</span>
            </div>
            <p className="text-sm text-emerald-600/70 mt-1">
              {t('Ready to transfer')} {transferModal?.quantity} {t('units to inventory.')}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{t('Destination Warehouse')}</label>
            <select 
              id="warehouse-select"
              className="w-full p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20 text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20"
            >
              <option value="">{t('Select Warehouse')}</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name} {t('Warehouse')}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={async () => {
              const warehouseId = (document.getElementById('warehouse-select') as HTMLSelectElement).value;
              if(transferModal && warehouseId) {
                await onTransferToWarehouse(transferModal.productId, transferModal.quantity, warehouseId);
              }
            }}
            disabled={submitting}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {submitting ? t('Transferring...') : t('Confirm Transfer')}
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Production;

