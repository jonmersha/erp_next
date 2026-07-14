import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    error: 'bg-rose-50 text-rose-600 border-rose-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    neutral: 'bg-black/5 text-black/40 border-black/20'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;
