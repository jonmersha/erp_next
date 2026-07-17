'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';

export default function Page() {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-xl flex items-center justify-center">
          <Wrench size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--color-text)]">{t('Strategic Sourcing')}</h1>
          <p className="text-[var(--color-text)]/60">{t('This module is currently under construction.')}</p>
        </div>
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-text)]/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
        <Wrench size={48} className="text-[var(--color-text)]/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">{t('Coming Soon')}</h2>
        <p className="text-[var(--color-text)]/60 max-w-md mx-auto">
          {t('The Strategic Sourcing module is part of the roadmap and will be available in a future update.')}
        </p>
      </div>
    </div>
  );
}
