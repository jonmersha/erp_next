import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  color?: 'emerald' | 'amber' | 'rose' | 'blue' | 'gray' | 'purple' | 'red';
  label?: string;
  leftIcon?: React.ReactNode;
  className?: string;
  status?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant, color, label, leftIcon, className = '', status }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    error: 'bg-rose-50 text-rose-600 border-rose-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    neutral: 'bg-black/5 text-black/40 border-black/20'
  };

  const colorMap: Record<string, string> = {
    emerald: variants.success,
    amber: variants.warning,
    rose: variants.error,
    red: variants.error,
    blue: variants.info,
    gray: variants.neutral,
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  let appliedClass = variants[variant || 'neutral'];
  if (color && colorMap[color]) {
    appliedClass = colorMap[color];
  }

  let finalLabel = label || children;
  if (status) {
    const s = status.toLowerCase();
    if (['approved', 'active', 'paid', 'received', 'completed'].includes(s)) {
      appliedClass = variants.success;
    } else if (['pending_approval', 'pending', 'draft'].includes(s)) {
      appliedClass = s === 'draft' ? variants.neutral : variants.warning;
    } else if (['rejected', 'cancelled', 'error'].includes(s)) {
      appliedClass = variants.error;
    } else if (['shipped', 'in_transit'].includes(s)) {
      appliedClass = variants.info;
    }
    if (!finalLabel) {
      finalLabel = status.replace(/_/g, ' ');
    }
  }

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center w-fit space-x-1 ${appliedClass} ${className}`}>
      {leftIcon && <span>{leftIcon}</span>}
      <span>{finalLabel}</span>
    </span>
  );
};

export default Badge;
