"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { Loader2, User as UserIcon, Mail, Shield, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

const Profile: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setSubmitting(true);
    setMessage(null);
    try {
      await apiService.updateDocument('users', profile.uid, { 
        name,
        email: profile.email,
        roles: profile.roles,
        status: profile.status || 'active',
        companyId: profile.companyId
      });
      setMessage({ type: 'success', text: 'Profile updated successfully! Refreshing data...' });
      
      // Reload page to refresh profile context
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="animate-spin text-[var(--color-main)]" size={32} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <header>
        <h2 className="text-3xl font-serif font-bold text-[var(--color-main)]">{t('My Profile')}</h2>
        <p className="text-[var(--color-text)]/40 mt-1">{t('Manage your personal information')}</p>
      </header>

      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="p-8 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg)] to-[var(--color-surface)] flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[var(--color-main)] flex items-center justify-center text-white font-serif font-bold text-4xl shadow-md border-4 border-white dark:border-[var(--color-surface)]">
            {profile.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[var(--color-text)]">{profile.name}</h3>
            <div className="flex items-center gap-2 text-[var(--color-text)]/60 mt-1">
              <Mail size={16} />
              <span>{profile.email}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.roles && profile.roles.map(role => (
                <span key={role} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider bg-[var(--color-main)]/10 text-[var(--color-main)] border border-[var(--color-main)]/20">
                  <Shield size={10} />
                  {role.replace('_', ' ')}
                </span>
              ))}
              {(!profile.roles || profile.roles.length === 0) && (
                <span className="text-xs text-[var(--color-text)]/40 italic">No roles assigned</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <Loader2 size={18} />}
              {message.text}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30" size={20} />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl focus:outline-none focus:border-[var(--color-main)] focus:ring-4 focus:ring-[var(--color-main)]/10 transition-all font-medium text-[var(--color-text)]"
                placeholder="E.g., Jane Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--color-text)]/50 uppercase tracking-widest pl-1">Email Address</label>
            <div className="relative opacity-60 cursor-not-allowed">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/30" size={20} />
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-2xl transition-all font-medium text-[var(--color-text)] cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-[var(--color-text)]/40 pl-1">Email is linked to your Google Account and cannot be changed.</p>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <button 
              disabled={submitting || name.trim() === profile.name}
              type="submit"
              className="px-8 bg-[var(--color-main)] text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-[var(--color-main)]/20 hover:bg-[var(--color-main)]/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {submitting ? t('Saving...') : t('Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default Profile;
