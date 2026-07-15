"use client";
import React from 'react';
import { Shield, Users, Database, Settings } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const Admin: React.FC = () => {
  const { t } = useTranslation();

  const adminTasks = [
    { name: t('HR Management'), path: '/hr', icon: Users, description: t('Manage employee records and payroll') },
    { name: t('User Management'), path: '/users', icon: Shield, description: t('Manage user access and roles') },
    { name: t('Roles & Permissions'), path: '/roles', icon: Shield, description: t('Manage system and custom roles') },
    { name: t('Master Data'), path: '/master-data', icon: Database, description: t('Manage structural entities') },
    { name: t('Company Settings'), path: '/settings', icon: Settings, description: t('Update company profile and contact info') },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-serif font-bold text-[var(--color-main)]">{t('Admin Panel')}</h2>
          <p className="text-[var(--color-text)]/40 mt-1">{t('Manage core application operations and settings')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminTasks.map((task) => (
          <Link
            key={task.name}
            to={task.path}
            className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 hover:border-[var(--color-main)]/50 transition-all group"
          >
            <div className="w-12 h-12 bg-[var(--color-main)]/10 text-[var(--color-main)] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <task.icon size={24} />
            </div>
            <h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{task.name}</h3>
            <p className="text-sm text-[var(--color-text)]/60 mt-1">{task.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Admin;
