import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { CostCenter, Budget, Expense } from '../../types';
import { 
  getCostCenters, createCostCenter, updateCostCenter,
  getBudgets, createBudget, updateBudget,
  getExpenses, createExpense, updateExpense, approveExpense 
} from '../../services/expenseService';
import { Loader2, Plus, CheckCircle, Clock, Edit2 } from 'lucide-react';

const OperationalCosts: React.FC = () => {
  const { t } = useTranslation();
  const { profile, hasRole, isAdmin } = useAuth();
  
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'expenses' | 'budgets' | 'costCenters'>('expenses');
  
  // Forms
  const [showNewCostCenter, setShowNewCostCenter] = useState(false);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

  // Edit State
  const [editCostCenterRecord, setEditCostCenterRecord] = useState<CostCenter | null>(null);
  const [editBudgetRecord, setEditBudgetRecord] = useState<Budget | null>(null);
  const [editExpenseRecord, setEditExpenseRecord] = useState<Expense | null>(null);
  
  const currentYear = new Date().getFullYear();

  const loadData = async () => {
    if (!profile?.companyId) return;
    setLoading(true);
    try {
      const [ccData, bData, eData] = await Promise.all([
        getCostCenters(profile.companyId),
        getBudgets(profile.companyId, currentYear),
        getExpenses(profile.companyId)
      ]);
      setCostCenters(ccData);
      setBudgets(bData);
      setExpenses(eData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.companyId]);

  const handleCreateCostCenter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      companyId: profile!.companyId
    };
    try {
      if (editCostCenterRecord) {
        await updateCostCenter(editCostCenterRecord.id, data);
        setEditCostCenterRecord(null);
      } else {
        await createCostCenter(data);
      }
      setShowNewCostCenter(false);
      loadData();
    } catch (err) {
      alert('Failed to save cost center');
    }
  };

  const handleCreateBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      costCenterId: formData.get('costCenterId') as string,
      fiscalYear: parseInt(formData.get('fiscalYear') as string),
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      companyId: profile!.companyId
    };
    try {
      if (editBudgetRecord) {
        await updateBudget(editBudgetRecord.id, data);
        setEditBudgetRecord(null);
      } else {
        await createBudget(data);
      }
      setShowNewBudget(false);
      loadData();
    } catch (err) {
      alert('Failed to save budget');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      costCenterId: formData.get('costCenterId') as string,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      companyId: profile!.companyId,
      createdBy: profile!.uid
    };
    try {
      if (editExpenseRecord) {
        await updateExpense(editExpenseRecord.id, data);
        setEditExpenseRecord(null);
      } else {
        await createExpense(data);
      }
      setShowNewExpense(false);
      loadData();
    } catch (err) {
      alert('Failed to save expense');
    }
  };

  const handleApprove = async (expenseId: string) => {
    try {
      await approveExpense(expenseId, profile!.uid!);
      loadData();
    } catch (err) {
      alert('Failed to approve expense');
    }
  };

  if (loading) return <Loader2 className="animate-spin text-[var(--color-main)]" />;

  const canApprove = isAdmin || hasRole('finance_manager') || hasRole('admin');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-[var(--color-text)]/10">
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`pb-4 px-6 font-bold ${activeTab === 'expenses' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}
        >
          {t('Expenses')}
        </button>
        <button 
          onClick={() => setActiveTab('budgets')}
          className={`pb-4 px-6 font-bold ${activeTab === 'budgets' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}
        >
          {t('Budgets')}
        </button>
        <button 
          onClick={() => setActiveTab('costCenters')}
          className={`pb-4 px-6 font-bold ${activeTab === 'costCenters' ? 'text-[var(--color-main)] border-b-2 border-[var(--color-main)]' : 'text-[var(--color-text)]/40 hover:text-[var(--color-text)]'}`}
        >
          {t('Cost Centers')}
        </button>
      </div>

      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl">{t('Recent Expenses')}</h3>
            <button onClick={() => setShowNewExpense(true)} className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl">
              <Plus size={16} /> <span>{t('Log Expense')}</span>
            </button>
          </div>
          
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-text)]/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--color-text)]/5">
                <tr className="text-[var(--color-text)]/50 text-sm">
                  <th className="p-4">{t('Date')}</th>
                  <th className="p-4">{t('Cost Center')}</th>
                  <th className="p-4">{t('Category')}</th>
                  <th className="p-4">{t('Amount')}</th>
                  <th className="p-4">{t('Status')}</th>
                  <th className="p-4">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/10">
                {expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-[var(--color-text)]/5">
                    <td className="p-4">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="p-4 font-bold">{exp.costCenterName}</td>
                    <td className="p-4">{exp.category}</td>
                    <td className="p-4 font-bold text-red-500">${exp.amount.toLocaleString()}</td>
                    <td className="p-4">
                      {exp.status === 'approved' ? (
                        <span className="flex items-center space-x-1 text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-full w-max">
                          <CheckCircle size={14} /> <span>{t('Approved')}</span>
                        </span>
                      ) : exp.status === 'pending' ? (
                        <span className="flex items-center space-x-1 text-amber-500 text-sm font-bold bg-amber-500/10 px-2 py-1 rounded-full w-max">
                          <Clock size={14} /> <span>{t('Pending')}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--color-text)]/50 capitalize">{exp.status}</span>
                      )}
                    </td>
                    <td className="p-4 space-x-2 flex items-center">
                      {exp.status === 'pending' && (
                        <button 
                          onClick={() => { setEditExpenseRecord(exp); setShowNewExpense(true); }}
                          className="text-blue-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1 mr-2"
                        >
                          <Edit2 size={14} /> {t('Edit')}
                        </button>
                      )}
                      {exp.status === 'pending' && canApprove && exp.createdBy !== profile?.uid && (
                        <button onClick={() => handleApprove(exp.id)} className="text-emerald-500 hover:text-emerald-600 font-bold text-sm">
                          {t('Approve')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl">{t('Budgets')} ({currentYear})</h3>
            <button onClick={() => setShowNewBudget(true)} className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl">
              <Plus size={16} /> <span>{t('Set Budget')}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map(b => {
              const utilized = expenses
                .filter(e => e.costCenterId === b.costCenterId && e.status === 'approved' && new Date(e.date).getFullYear() === b.fiscalYear)
                .reduce((sum, e) => sum + e.amount, 0);
              const percentage = Math.min((utilized / b.totalAmount) * 100, 100);
              
              return (
                <div key={b.id} className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg">{b.costCenterName}</h4>
                      <span className="bg-[var(--color-bg)] px-3 py-1 rounded-xl text-sm font-bold text-[var(--color-text)]/60 inline-block mt-2">
                        {b.fiscalYear}
                      </span>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => { setEditBudgetRecord(b); setShowNewBudget(true); }}
                        className="text-blue-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
                      >
                        <Edit2 size={14} /> {t('Edit')}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text)]/60">{t('Utilized')}: <strong className="text-[var(--color-text)]">${utilized.toLocaleString()}</strong></span>
                      <span className="text-[var(--color-text)]/60">{t('Budget')}: <strong className="text-[var(--color-text)]">${b.totalAmount.toLocaleString()}</strong></span>
                    </div>
                    <div className="w-full bg-[var(--color-bg)] rounded-full h-3 border border-[var(--color-text)]/10">
                      <div 
                        className={`h-full rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-xs font-bold text-[var(--color-text)]/40">
                      {percentage.toFixed(1)}% {t('used')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'costCenters' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-serif font-bold text-xl">{t('Cost Centers')}</h3>
            <button onClick={() => setShowNewCostCenter(true)} className="flex items-center space-x-2 bg-[var(--color-main)] text-white px-4 py-2 rounded-xl">
              <Plus size={16} /> <span>{t('New Cost Center')}</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {costCenters.map(cc => (
              <div key={cc.id} className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/10 shadow-sm relative">
                {isAdmin && (
                  <button 
                    onClick={() => { setEditCostCenterRecord(cc); setShowNewCostCenter(true); }}
                    className="absolute top-6 right-6 text-blue-500 hover:text-blue-600 font-bold text-sm flex items-center gap-1"
                  >
                    <Edit2 size={14} /> {t('Edit')}
                  </button>
                )}
                <div className="w-10 h-10 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center font-bold mb-4">
                  {cc.code}
                </div>
                <h4 className="font-bold text-lg mb-1">{cc.name}</h4>
                <p className="text-[var(--color-text)]/60 text-sm line-clamp-2">{cc.description || t('No description provided.')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewCostCenter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateCostCenter} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{editCostCenterRecord ? t('Edit Cost Center') : t('New Cost Center')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Name')}</label>
                <input name="name" required defaultValue={editCostCenterRecord?.name} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" placeholder="e.g. Marketing" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Code')}</label>
                <input name="code" required defaultValue={editCostCenterRecord?.code} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" placeholder="e.g. MKT-01" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Description')}</label>
                <textarea name="description" defaultValue={editCostCenterRecord?.description} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" rows={3} />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowNewCostCenter(false); setEditCostCenterRecord(null); }} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white rounded-xl font-bold">{editCostCenterRecord ? t('Save Changes') : t('Save')}</button>
            </div>
          </form>
        </div>
      )}

      {showNewBudget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateBudget} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{editBudgetRecord ? t('Edit Budget') : t('Set Budget')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Cost Center')}</label>
                <select name="costCenterId" required defaultValue={editBudgetRecord?.costCenterId} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Cost Center')}</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Fiscal Year')}</label>
                <input name="fiscalYear" type="number" required defaultValue={editBudgetRecord?.fiscalYear || currentYear} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Total Amount ($)')}</label>
                <input name="totalAmount" type="number" step="0.01" required defaultValue={editBudgetRecord?.totalAmount} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowNewBudget(false); setEditBudgetRecord(null); }} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white rounded-xl font-bold">{editBudgetRecord ? t('Save Changes') : t('Save')}</button>
            </div>
          </form>
        </div>
      )}

      {showNewExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateExpense} className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full">
            <h3 className="text-2xl font-bold font-serif mb-6">{editExpenseRecord ? t('Edit Expense') : t('Log Expense')}</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Cost Center')}</label>
                <select name="costCenterId" required defaultValue={editExpenseRecord?.costCenterId} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="">{t('Select Cost Center')}</option>
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Amount ($)')}</label>
                <input name="amount" type="number" step="0.01" required defaultValue={editExpenseRecord?.amount} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Date')}</label>
                <input name="date" type="date" required defaultValue={editExpenseRecord?.date ? new Date(editExpenseRecord.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Category')}</label>
                <select name="category" required defaultValue={editExpenseRecord?.category} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3">
                  <option value="Maintenance">Maintenance</option>
                  <option value="Travel">Travel</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Fleet/Logistics">Fleet/Logistics</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-text)]/60 mb-2">{t('Description')}</label>
                <textarea name="description" defaultValue={editExpenseRecord?.description} className="w-full bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl px-4 py-3" rows={2} />
              </div>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => { setShowNewExpense(false); setEditExpenseRecord(null); }} className="flex-1 py-3 border border-[var(--color-text)]/20 rounded-xl font-bold">{t('Cancel')}</button>
              <button type="submit" className="flex-1 py-3 bg-[var(--color-main)] text-white rounded-xl font-bold">{editExpenseRecord ? t('Save Changes') : t('Submit for Approval')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OperationalCosts;
