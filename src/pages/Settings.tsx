"use client";
import React, { useState, useEffect } from 'react';
import { getCompany, updateCompany } from '../services/companyService';
import { useAuth } from '../context/AuthContext';
import { Loader2, Save, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Company } from '../types';
import { ImageUpload } from '../components/common/ImageUpload';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!profile?.companyId) return;

    const fetchCompanyData = async () => {
      try {
        const data = await getCompany(profile.companyId);
        setCompany(data);
      } catch (error) {
        console.error("Error fetching company:", error);
        setErrorMsg('Failed to load company information.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [profile?.companyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateCompany(company.id, company);
      setSuccessMsg('Company information updated successfully!');
    } catch (error) {
      console.error("Error updating company:", error);
      setErrorMsg('Failed to update company information.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-[var(--color-main)]" />;
  if (!company) return <div className="text-center text-red-500">Failed to load company data.</div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h2 className="text-4xl font-serif font-bold text-[var(--color-main)] flex items-center gap-3">
          <Building2 size={36} />
          {t('Company Settings')}
        </h2>
        <p className="text-[var(--color-text)]/40 mt-1">Manage your company profile, contact details, and branding.</p>
      </header>

      <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6 text-[var(--color-text)]">
          {successMsg && (
            <div className="bg-green-100 text-green-800 p-4 rounded-xl border border-green-200">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-100 text-red-800 p-4 rounded-xl border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[var(--color-text)]/70">Company Name</label>
              <input
                type="text"
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl focus:outline-none focus:border-[var(--color-main)]"
                value={company.name || ''}
                onChange={e => setCompany({ ...company, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-[var(--color-text)]/70">Address</label>
              <input
                type="text"
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl focus:outline-none focus:border-[var(--color-main)]"
                value={company.address || ''}
                onChange={e => setCompany({ ...company, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[var(--color-text)]/70">Email</label>
              <input
                type="email"
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl focus:outline-none focus:border-[var(--color-main)]"
                value={company.email || ''}
                onChange={e => setCompany({ ...company, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[var(--color-text)]/70">Phone</label>
              <input
                type="text"
                className="w-full p-3 bg-[var(--color-bg)] border border-[var(--color-text)]/10 rounded-xl focus:outline-none focus:border-[var(--color-main)]"
                value={company.phone || ''}
                onChange={e => setCompany({ ...company, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="Logo Image"
                value={company.logoUrl || ''}
                onChange={url => setCompany({ ...company, logoUrl: url })}
              />
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="Banner Image"
                value={company.bannerUrl || ''}
                onChange={url => setCompany({ ...company, bannerUrl: url })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[var(--color-main)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-main)]/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {t('Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
