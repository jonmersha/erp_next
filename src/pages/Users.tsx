import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Company, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Users as UsersIcon, Shield, Mail, Search, Loader2, CheckCircle, XCircle, Plus, Trash2, Key, AlertCircle, ChevronDown } from 'lucide-react';
import Modal from '../components/Modal';
import StatsCard from '../components/common/StatsCard';
import { apiService } from '../services/apiService';
import { fetchCollection } from '../utils/firestore';
import { useTranslation } from 'react-i18next';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchData = async () => {
      try {
        const uData = await fetchCollection<UserProfile>('users', profile.companyId);
        setUsers(uData);
        const rData = await apiService.get<Role[]>(`roles?companyId=${profile.companyId}`);
        if (rData) setAvailableRoles(rData);
      } catch (err: any) {
        console.error('Error fetching users/roles:', err);
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile?.companyId]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = selectedUser?.uid || selectedUser?.id;
    if (!selectedUser || !userId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiService.updateDocument('users', userId, { 
        roles: selectedUser.roles,
        name: selectedUser.name,
        email: selectedUser.email,
        status: selectedUser.status || 'active',
        performedBy: profile?.uid
      });
      setIsModalOpen(false);
      const uData = await fetchCollection<UserProfile>('users', profile!.companyId);
      setUsers(uData);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };



  const handleDeleteUser = async (user: UserProfile) => {
    if (!profile?.companyId || !user.uid) return;
    if (!window.confirm(`Are you sure you want to delete user ${user.name}? This action cannot be undone.`)) return;
    try {
      await apiService.deleteDocument('users', user.uid);
      const uData = await fetchCollection<UserProfile>('users', profile.companyId);
      setUsers(uData);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const toggleRole = (role: UserRole) => {
    if (!selectedUser) return;
    const currentRoles = selectedUser.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    setSelectedUser({ ...selectedUser, roles: newRoles });
  };

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // Compute Metrics
  const activeAdmins = users.filter(u => u.roles?.includes('admin')).length;
  const uniqueRoles = new Set(users.flatMap(u => u.roles || [])).size;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-[var(--color-text)]/40">
        <Shield size={64} className="mb-6 opacity-20" />
        <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">Access Denied</h2>
        <p className="text-sm mt-2">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={48} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">User Management</h2>
          <p className="text-[var(--color-text)]/40 mt-1">Control system access, assign roles, and manage identity profiles.</p>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-sm flex items-center justify-between shadow-sm mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle size={18} />
                <span className="font-medium">{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 transition-colors p-1">
                <XCircle size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Users"
          value={users.length}
          icon={UsersIcon}
          color="indigo"
        />
        <StatsCard 
          title="Active Admins"
          value={activeAdmins}
          icon={Shield}
          color="emerald"
        />
        <StatsCard 
          title="Roles Assigned"
          value={uniqueRoles}
          icon={Key}
          color="amber"
        />
      </div>

      {/* Main Table Area */}
      <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-text)]/20 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--color-text)]/20 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-bg)]/20">
          <h3 className="font-serif font-bold text-lg text-[var(--color-text)] flex items-center gap-2">
            <UsersIcon size={20} className="text-[var(--color-main)]" />
            System Directory
          </h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20 focus:border-[var(--color-main)] text-sm text-[var(--color-text)] transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-[var(--color-text)]/30">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-serif font-bold">No Users Found</p>
              <p className="text-sm mt-1">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-bg)]/80 text-[10px] font-bold text-[var(--color-text)]/40 uppercase tracking-widest border-b border-[var(--color-text)]/20">
                  <th className="px-6 py-5">User Identity</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">System Roles</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-text)]/5 text-sm">
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr 
                      key={user.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-[var(--color-main)]/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-main)] to-indigo-600 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--color-text)] text-base">{user.name}</p>
                            <p className="text-xs text-[var(--color-text)]/50 flex items-center mt-0.5">
                              <Mail size={12} className="mr-1.5 opacity-50" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {user.status === 'inactive' ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                            Inactive
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {user.roles?.length ? user.roles.map(role => (
                            <span key={role} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider border ${
                              role === 'admin' 
                                ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                : 'bg-[var(--color-main)]/10 text-[var(--color-main)] border-[var(--color-main)]/20'
                            }`}>
                              {role.replace('_', ' ')}
                            </span>
                          )) : (
                            <span className="text-xs text-[var(--color-text)]/30 italic">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-3 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setError(null);
                              setSelectedUser({ ...user, roles: user.roles || [] });
                              setIsModalOpen(true);
                            }}
                            className="px-4 py-2 text-xs font-bold text-[var(--color-main)] bg-[var(--color-main)]/5 hover:bg-[var(--color-main)]/10 rounded-xl transition-colors"
                          >
                            {t('Edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Edit User Identity"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={selectedUser.name || ''}
                  onChange={e => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="w-full p-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl focus:outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={selectedUser.email || ''}
                  onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  className="w-full p-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl focus:outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">Account Status</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedUser({ ...selectedUser, status: 'active' })}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold ${
                    (!selectedUser.status || selectedUser.status === 'active')
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)]/40 border-[var(--color-text)]/20 hover:bg-[var(--color-bg)]'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser({ ...selectedUser, status: 'inactive' })}
                  className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold ${
                    selectedUser.status === 'inactive'
                      ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)]/40 border-[var(--color-text)]/20 hover:bg-[var(--color-bg)]'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">System Roles</label>
              <RoleDropdown 
                selectedRoles={selectedUser.roles || []} 
                toggleRole={toggleRole} 
                availableRoles={availableRoles} 
              />
            </div>

            <button 
              disabled={submitting}
              type="submit"
              className="w-full bg-[var(--color-main)] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[var(--color-main)]/20 hover:bg-[var(--color-main)]/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex justify-center items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : null}
              {submitting ? t('Saving Changes...') : t('Save Profile')}
            </button>
          </form>
        )}
      </Modal>


    </motion.div>
  );
};

const RoleDropdown = ({ selectedRoles, toggleRole, availableRoles }: { selectedRoles: string[], toggleRole: (r: string) => void, availableRoles: Role[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl focus:outline-none flex justify-between items-center transition-all hover:border-[var(--color-main)]"
      >
        <span className="font-medium text-sm text-[var(--color-text)]">
          {selectedRoles.length > 0 ? `${selectedRoles.length} roles selected: ${selectedRoles.join(', ')}` : 'Select Roles...'}
        </span>
        <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {availableRoles.length === 0 && (
            <div className="p-4 text-sm text-[var(--color-text)]/50 text-center">No roles available. Create roles in Admin Panel.</div>
          )}
          {availableRoles.map(role => (
            <div 
              key={role.id}
              onClick={() => toggleRole(role.name)}
              className="px-4 py-3 hover:bg-[var(--color-bg)] cursor-pointer flex items-center gap-3 border-b border-[var(--color-border)]/50 last:border-0 transition-colors"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedRoles.includes(role.name) ? 'bg-[var(--color-main)] border-[var(--color-main)]' : 'border-[var(--color-text)]/30'}`}>
                {selectedRoles.includes(role.name) && <CheckCircle size={14} className="text-white" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--color-text)]">{role.name}</span>
                {role.description && <span className="text-xs text-[var(--color-text)]/50">{role.description}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
