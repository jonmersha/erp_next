"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Role, RolePermissions } from '../types';
import { Plus, Edit2, Trash2, X, Shield, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const Roles: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<{name: string, description: string, permissions: RolePermissions}>({ name: '', description: '', permissions: {} });

  const modulesList = [
    { id: 'hr', label: t('Human Resources') },
    { id: 'users', label: t('User Management') },
    { id: 'roles', label: t('Roles & Permissions') },
    { id: 'settings', label: t('Company Settings') },
    { id: 'master_data', label: t('Master Data') },
    { id: 'planning', label: t('Production Planning') },
    { id: 'procurement', label: t('Procurement') },
    { id: 'inventory', label: t('Inventory') },
    { id: 'production', label: t('Production Runs') },
    { id: 'recipes', label: t('Recipes (BOM)') },
    { id: 'maintenance', label: t('Maintenance') },
    { id: 'logistics', label: t('Logistics') },
    { id: 'quality', label: t('Quality Control') },
    { id: 'sales', label: t('Sales') },
    { id: 'finance', label: t('Finance') }
  ];

  const handlePermissionChange = (moduleId: string, action: string, checked: boolean) => {
    setFormData(prev => {
      const modulePerms = prev.permissions[moduleId] || [];
      let newModulePerms;
      if (checked) {
        newModulePerms = [...modulePerms, action];
      } else {
        newModulePerms = modulePerms.filter(a => a !== action);
      }
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: newModulePerms
        }
      };
    });
  };

  useEffect(() => {
    fetchRoles();
  }, [profile?.companyId]);

  const fetchRoles = async () => {
    if (!profile?.companyId) return;
    try {
      const data = await apiService.get<Role[]>(`roles?companyId=${profile.companyId}`);
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return;

    try {
      if (editingRole) {
        await apiService.put(`roles/${editingRole.id}`, formData);
      } else {
        await apiService.post('roles', { ...formData, companyId: profile.companyId });
      }
      fetchRoles();
      setIsModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: {} });
    } catch (error) {
      console.error('Error saving role:', error);
      alert(t('Failed to save role. Name must be unique.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('Are you sure you want to delete this role?'))) {
      try {
        await apiService.delete(`roles/${id}`);
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '', permissions: role.permissions || {} });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: {} });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-main)]">{t('Roles & Permissions')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Manage system roles and custom access levels')}</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[var(--color-main)] text-white px-4 py-2 rounded-sm flex items-center space-x-2 hover:bg-[var(--color-main-hover)] transition-colors"
        >
          <Plus size={20} />
          <span>{t('Add Role')}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-sm shadow-sm border border-[var(--color-border)] overflow-hidden">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-bg)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text)]/60 uppercase tracking-wider">{t('Role Name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text)]/60 uppercase tracking-wider">{t('Description')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text)]/60 uppercase tracking-wider">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-[var(--color-bg)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Shield size={16} className="text-[var(--color-main)] mr-2" />
                      <div className="text-sm font-medium text-[var(--color-text)]">{role.name}</div>
                      {role.is_system && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                          {t('System')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--color-text)]/70">{role.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(role)}
                      className="text-[var(--color-main)] hover:text-[var(--color-main-hover)] mr-4 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[var(--color-text)]/50">
                    <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
                    {t('No roles found. Please add a role.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-surface)] rounded-sm shadow-xl p-6 w-full max-w-4xl border border-[var(--color-border)] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif font-bold text-[var(--color-text)]">
                  {editingRole ? t('Edit Role') : t('Add Role')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--color-text)]/50 hover:text-[var(--color-text)] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('Role Name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-[var(--color-border)] rounded-sm bg-[var(--color-bg)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-main)] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">{t('Description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border border-[var(--color-border)] rounded-sm bg-[var(--color-bg)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-main)] focus:outline-none"
                    rows={2}
                  />
                </div>
                
                <div className="mt-6">
                  <label className="block text-lg font-serif font-bold text-[var(--color-text)] mb-3">{t('Permissions Matrix')}</label>
                  <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-[var(--color-border)]">
                      <thead className="bg-[var(--color-surface)]">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-[var(--color-text)]/70 uppercase">{t('Module')}</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-[var(--color-text)]/70 uppercase">{t('Read Access')}</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-[var(--color-text)]/70 uppercase">{t('Write / Edit Access')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {modulesList.map(mod => {
                          const perms = formData.permissions[mod.id] || [];
                          return (
                            <tr key={mod.id} className="hover:bg-[var(--color-surface)]/50">
                              <td className="px-4 py-3 text-sm font-medium text-[var(--color-text)]">{mod.label}</td>
                              <td className="px-4 py-3 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={perms.includes('read') || perms.includes('write')} // write implies read often, but let's keep them explicit
                                  onChange={(e) => handlePermissionChange(mod.id, 'read', e.target.checked)}
                                  className="w-4 h-4 text-[var(--color-main)] border-[var(--color-border)] rounded focus:ring-[var(--color-main)]"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={perms.includes('write')}
                                  onChange={(e) => {
                                    handlePermissionChange(mod.id, 'write', e.target.checked);
                                    if (e.target.checked && !perms.includes('read')) {
                                      handlePermissionChange(mod.id, 'read', true); // Auto-check read if write is checked
                                    }
                                  }}
                                  className="w-4 h-4 text-[var(--color-main)] border-[var(--color-border)] rounded focus:ring-[var(--color-main)]"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-6 space-x-3 border-t border-[var(--color-border)] mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text)] rounded-sm hover:bg-[var(--color-bg)] transition-colors"
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-main)] text-white rounded-sm hover:bg-[var(--color-main-hover)] transition-colors"
                  >
                    {t('Save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Roles;
