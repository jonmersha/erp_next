import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'emerald' | 'indigo' | 'amber' | 'rose' | 'blue';
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors = {
    emerald: 'bg-[var(--color-main)]/10 text-[var(--color-main)]',
    indigo: 'bg-[var(--color-main)]/10 text-[var(--color-main)]',
    amber: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
    rose: 'bg-rose-500/10 text-rose-600',
    blue: 'bg-blue-500/10 text-blue-600'
  };

  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-3xl shadow-sm border border-[var(--color-text)]/20 flex items-center space-x-4">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-serif font-bold text-[var(--color-text)]">{value}</p>
        {subtitle && <p className="text-xs text-[var(--color-text)]/40 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatsCard;
