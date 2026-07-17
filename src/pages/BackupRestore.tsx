"use client";
import React, { useState, useRef } from 'react';
import { Database, Download, Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { backupService } from '../services/backupService';

const BackupRestore: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<'sql' | 'csv' | null>(null);

  const sqlInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleExportSql = async () => {
    try {
      setLoading(true);
      setError(null);
      await backupService.exportSql();
      setSuccess(t('SQL backup downloaded successfully.'));
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setLoading(true);
      setError(null);
      await backupService.exportCsv();
      setSuccess(t('CSV backup downloaded successfully.'));
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSql = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await backupService.importSql(file);
      setSuccess(res.message || t('SQL backup restored successfully.'));
      setShowConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
      if (sqlInputRef.current) sqlInputRef.current.value = '';
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await backupService.importCsv(file);
      setSuccess(res.message || t('CSV backup restored successfully.'));
      setShowConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setLoading(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  };

  const triggerImport = (type: 'sql' | 'csv') => {
    if (type === 'sql') sqlInputRef.current?.click();
    else csvInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Backup & Restore')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Securely backup and restore your company database')}</p>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* SQL BACKUP */}
        <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-[var(--color-main)]/5">
            <Database size={160} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[var(--color-text)]">{t('SQL Backup')}</h3>
            </div>
            <p className="text-[var(--color-text)]/60 mb-8">{t('Export the complete database as an executable SQL file. This is the most reliable format for full restorations.')}</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleExportSql}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[var(--color-main)] text-[var(--color-bg)] px-6 py-3 rounded-2xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Download size={20} />
                {t('Export .sql')}
              </button>

              <button 
                onClick={() => setShowConfirm('sql')}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-text)]/20 px-6 py-3 rounded-2xl font-bold hover:bg-[var(--color-text)]/5 transition-all disabled:opacity-50"
              >
                <Upload size={20} />
                {t('Restore .sql')}
              </button>
            </div>
          </div>
        </div>

        {/* CSV BACKUP */}
        <div className="bg-[var(--color-surface)] p-8 rounded-3xl border border-[var(--color-text)]/20 shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-emerald-500/5">
            <FileText size={160} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[var(--color-text)]">{t('CSV Archive')}</h3>
            </div>
            <p className="text-[var(--color-text)]/60 mb-8">{t('Export all tables as individual CSV files packaged in a ZIP archive. Useful for data analysis in Excel.')}</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleExportCsv}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Download size={20} />
                {t('Export .zip (CSV)')}
              </button>

              <button 
                onClick={() => setShowConfirm('csv')}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-text)]/20 px-6 py-3 rounded-2xl font-bold hover:bg-[var(--color-text)]/5 transition-all disabled:opacity-50"
              >
                <Upload size={20} />
                {t('Restore .zip')}
              </button>
            </div>
          </div>
        </div>

      </div>

      <input type="file" ref={sqlInputRef} onChange={handleImportSql} accept=".sql" className="hidden" />
      <input type="file" ref={csvInputRef} onChange={handleImportCsv} accept=".zip" className="hidden" />

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-surface)] p-8 rounded-3xl max-w-md w-full border border-[var(--color-text)]/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold font-serif">{t('Warning: Data Loss')}</h3>
            </div>
            
            <p className="text-[var(--color-text)]/80 mb-6 leading-relaxed">
              {t('Restoring a database will overwrite your current company data. Any changes made since this backup was created will be permanently lost. This action cannot be undone.')}
            </p>
            <p className="text-[var(--color-text)] font-bold mb-8">
              {t('Are you absolutely sure you want to proceed?')}
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-[var(--color-text)]/20 hover:bg-[var(--color-text)]/5 transition-all font-bold"
              >
                {t('Cancel')}
              </button>
              <button 
                onClick={() => triggerImport(showConfirm)}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white hover:brightness-110 transition-all font-bold"
              >
                {t('Yes, Select File')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore;
