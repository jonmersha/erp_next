import React, { useState, useMemo } from 'react';
import { useProductionData } from '../hooks/useProductionData';
import { ProductionRun } from '../types';
import { createProductionRun, updateProductionProgress } from '../services/productionService';
import { transferProductionToWarehouse } from '../services/inventoryService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Factory as FactoryIcon, Play, CheckCircle, Clock, Plus, Settings, Loader2, ArrowRight, Search, Filter, TrendingUp, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import Badge from '../components/common/Badge';

const Production: React.FC = () => {
  const { profile } = useAuth();
  const { factories, runs, plans, products, recipes, loading, refreshData } = useProductionData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<ProductionRun | null>(null);
  const [progressModal, setProgressModal] = useState<{isOpen: boolean, runId: string, quantity: number, target: number} | null>(null);
  const [transferModal, setTransferModal] = useState<{isOpen: boolean, runId: string, productId: string, quantity: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [form, setForm] = useState({
    factoryId: '',
    productId: '',
    recipeId: '',
    quantity: 0,
    status: 'planned' as 'planned' | 'in_progress' | 'completed',
    startDate: new Date().toISOString().split('T')[0]
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
        const progressA = a.quantity > 0 ? a.quantityProduced / a.quantity : 0;
        const progressB = b.quantity > 0 ? b.quantityProduced / b.quantity : 0;
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
        startDate: new Date().toISOString().split('T')[0]
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
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">Production</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Manufacturing schedules and factory output</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-[var(--color-main)]/90 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={20} />
          <span className="font-bold">New Production Run</span>
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
              <Clock size={24} />
            </div>
            <Badge variant="info">Active</Badge>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{stats.active}</p>
          <p className="text-sm text-[var(--color-text)]/40 mt-1">Runs currently in progress</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <TrendingUp size={24} />
            </div>
            <Badge variant="warning">Planned</Badge>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{stats.planned}</p>
          <p className="text-sm text-[var(--color-text)]/40 mt-1">Scheduled for future</p>
        </div>
        <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <CheckCircle size={24} />
            </div>
            <Badge variant="success">Today</Badge>
          </div>
          <p className="text-3xl font-bold text-[var(--color-text)]">{stats.completedToday}</p>
          <p className="text-sm text-[var(--color-text)]/40 mt-1">Completed in last 24h</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
              whileHover={{ y: -5 }}
              className="bg-[var(--color-surface)] p-6 rounded-3xl shadow-sm border border-[var(--color-text)]/5"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-[var(--color-main)]/10 rounded-2xl text-[var(--color-main)]">
                  <FactoryIcon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-text)]">{factory.name}</h3>
                  <p className="text-xs text-[var(--color-text)]/40">{factory.location}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Planned Plan</span>
                  <span className="font-bold text-[var(--color-text)]">{totalPlanned.toLocaleString()} units</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Production Rate</span>
                  <span className="font-bold text-emerald-500">{productionRate}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Total Finished</span>
                  <span className="font-bold text-[var(--color-text)]">{totalProduced.toLocaleString()} units</span>
                </div>

                <div className="pt-4 border-t border-[var(--color-text)]/5 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Active Runs</span>
                  <span className="font-bold text-[var(--color-main)]">{activeRuns.length}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/5 overflow-hidden">
        <div className="p-6 border-b border-[var(--color-text)]/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">Manufacturing Schedule</h3>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={18} />
              <input 
                type="text"
                placeholder="Search runs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-sm w-full md:w-64"
              />
            </div>
            <div className="flex items-center space-x-2 bg-[var(--color-bg)] px-3 py-2 rounded-xl border border-[var(--color-text)]/5">
              <Filter size={16} className="text-[var(--color-text)]/40" />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-[var(--color-text)]/60 font-medium"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg)]/50 text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest">
                <th className="px-6 py-4">Run ID</th>
                <th className="px-6 py-4">Product & Recipe</th>
                <th className="px-6 py-4">Factory</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-text)]/5 text-sm">
              {filteredRuns.map((run) => {
                const product = products.find(p => p.id === run.productId);
                const recipe = recipes.find(r => r.id === run.recipeId);
                const progress = run.quantity > 0 ? Math.round((run.quantityProduced / run.quantity) * 100) : 0;
                
                return (
                  <tr key={run.id} className="hover:bg-[var(--color-text)]/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[var(--color-main)]">#{run.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[var(--color-text)]">{product?.name || 'Unknown Product'}</div>
                      <div className="text-xs text-[var(--color-text)]/40">{recipe?.name || 'No Recipe'}</div>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text)]/60">
                      {factories.find(f => f.id === run.factoryId)?.name || 'Unknown Factory'}
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
                        <span>{(run.quantityProduced || 0).toLocaleString()} / {(run.quantity || 0).toLocaleString()} units</span>
                        {run.status !== 'completed' && (
                          <span className="text-[var(--color-main)]/60">{((run.quantity || 0) - (run.quantityProduced || 0)).toLocaleString()} left</span>
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
                          <>
                            <button 
                              onClick={() => setProgressModal({isOpen: true, runId: run.id, quantity: run.quantityProduced, target: run.quantity})}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Update Progress"
                            >
                              <Clock size={18} />
                            </button>
                            <button 
                              onClick={() => onUpdateProgress(run.id, run.quantity, 'completed')}
                              className="p-2 text-[var(--color-main)] hover:bg-[var(--color-main)]/10 rounded-lg transition-colors"
                              title="Complete Production"
                            >
                              <CheckCircle size={18} />
                            </button>
                          </>
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
                      <p className="font-medium">No production runs found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedRun} onClose={() => setSelectedRun(null)} title="Production Run Details">
        {selectedRun && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">Run ID</p>
                <p className="font-mono font-bold text-[var(--color-main)]">#{selectedRun.id.slice(0, 12)}</p>
              </div>
              <div className="p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/5">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">Status</p>
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
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Factory</p>
                  <p className="font-bold text-[var(--color-text)]">
                    {factories.find(f => f.id === selectedRun.factoryId)?.name || 'Unknown Factory'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Product</p>
                  <p className="font-bold text-[var(--color-text)]">
                    {products.find(p => p.id === selectedRun.productId)?.name || 'Unknown Product'}
                  </p>
                </div>
              </div>

              {selectedRun.recipeId && (
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                    <Settings size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Recipe</p>
                    <p className="font-bold text-[var(--color-text)]">
                      {recipes.find(r => r.id === selectedRun.recipeId)?.name || 'Unknown Recipe'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[var(--color-bg)] p-6 rounded-3xl border border-[var(--color-text)]/5">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">Production Progress</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">
                    {(selectedRun.quantityProduced || 0).toLocaleString()} / {(selectedRun.quantity || 0).toLocaleString()}
                    <span className="text-sm text-[var(--color-text)]/40 ml-2">units</span>
                  </p>
                  {selectedRun.status !== 'completed' && (
                    <p className="text-xs text-[var(--color-main)]/60 mt-1">
                      {((selectedRun.quantity || 0) - (selectedRun.quantityProduced || 0)).toLocaleString()} units remaining
                    </p>
                  )}
                </div>
                <p className="text-xl font-bold text-[var(--color-main)]">
                  {selectedRun.quantity > 0 ? Math.round((selectedRun.quantityProduced / selectedRun.quantity) * 100) : 0}%
                </p>
              </div>
              <div className="h-3 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedRun.quantity > 0 ? (selectedRun.quantityProduced / selectedRun.quantity) * 100 : 0}%` }}
                  className="h-full bg-[var(--color-main)] rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">Start Date</p>
                <p className="font-medium text-[var(--color-text)]">{new Date(selectedRun.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40 mb-1">Last Updated</p>
                <p className="font-medium text-[var(--color-text)]">
                  {selectedRun.updatedAt ? new Date(selectedRun.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {selectedRun.recipeId && recipes.find(r => r.id === selectedRun.recipeId)?.processingSteps && (
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-text)]/40">Processing Steps</p>
                <div className="space-y-2">
                  {recipes.find(r => r.id === selectedRun.recipeId)?.processingSteps.sort((a, b) => a.order - b.order).map((step, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-main)]/10 text-[var(--color-main)] flex items-center justify-center text-xs font-bold">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--color-text)]">{step.description}</p>
                        <p className="text-[10px] text-[var(--color-text)]/40">{step.durationMinutes} minutes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex space-x-3">
              <button 
                onClick={() => setSelectedRun(null)}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-all"
              >
                Close
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
                  Update Progress
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Production Run">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Target Factory</label>
            <select 
              required
              value={form.factoryId}
              onChange={e => setForm({ ...form, factoryId: e.target.value })}
              className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
            >
              <option value="">Select Factory</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Product</label>
              <select 
                required
                value={form.productId}
                onChange={e => setForm({ ...form, productId: e.target.value, recipeId: '' })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Recipe (Optional)</label>
              <select 
                value={form.recipeId}
                onChange={e => setForm({ ...form, recipeId: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              >
                <option value="">Select Recipe</option>
                {recipes.filter(r => r.productId === form.productId).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Target Quantity</label>
              <input 
                type="number"
                required
                min="1"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Start Date</label>
              <input 
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 text-[var(--color-text)]"
              />
            </div>
          </div>
          <button 
            disabled={submitting}
            type="submit"
            className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-[var(--color-main)]/90 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Creating...' : 'Schedule Production'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!progressModal?.isOpen} onClose={() => setProgressModal(null)} title="Update Progress">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Produced Quantity</label>
            <div className="relative">
              <input 
                type="number"
                value={progressModal?.quantity || 0}
                max={progressModal?.target}
                onChange={e => setProgressModal(prev => prev ? {...prev, quantity: parseInt(e.target.value) || 0} : null)}
                className="w-full p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/5 text-[var(--color-text)] text-2xl font-bold text-center"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20 font-bold">
                / {progressModal?.target}
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--color-bg)] p-4 rounded-2xl border border-[var(--color-text)]/5">
            <div className="flex justify-between text-xs font-bold text-[var(--color-text)]/40 uppercase mb-2">
              <span>Completion</span>
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
            {submitting ? 'Updating...' : 'Update Progress'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!transferModal?.isOpen} onClose={() => setTransferModal(null)} title="Transfer to Warehouse">
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center space-x-3 text-emerald-600">
              <CheckCircle size={20} />
              <span className="font-bold">Production Completed</span>
            </div>
            <p className="text-sm text-emerald-600/70 mt-1">
              Ready to transfer {transferModal?.quantity} units to inventory.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Destination Warehouse</label>
            <select 
              id="warehouse-select"
              className="w-full p-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/5 text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20"
            >
              <option value="">Select Warehouse</option>
              {factories.map(f => (
                <option key={f.id} value={f.id}>{f.name} Warehouse</option>
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
            {submitting ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Production;

