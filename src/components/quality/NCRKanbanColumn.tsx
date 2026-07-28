import React from 'react';
import { AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';
import { NonConformanceReport } from '../../services/inspectionService';

interface NCRKanbanColumnProps {
  status: 'open' | 'investigating' | 'resolved';
  title: string;
  ncrs: NonConformanceReport[];
  onOpenNCR: (ncr: NonConformanceReport) => void;
}

export default function NCRKanbanColumn({ status, title, ncrs, onOpenNCR }: NCRKanbanColumnProps) {
  const columnNcrs = ncrs.filter(n => n.status === status);

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-text)]/10 shadow-sm min-h-[500px] flex flex-col">
      <h3 className="font-bold text-[var(--color-text)] border-b border-[var(--color-text)]/10 pb-3 mb-4 flex justify-between items-center">
        {title}
        <span className="bg-[var(--color-bg)] px-2.5 py-1 rounded-full text-xs text-[var(--color-text)]/60 font-medium">
          {columnNcrs.length}
        </span>
      </h3>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {columnNcrs.map(ncr => (
          <div 
            key={ncr.id} 
            className="bg-[var(--color-bg)] p-4 rounded-xl border border-[var(--color-text)]/10 cursor-pointer hover:border-[var(--color-main)]/50 transition-all shadow-sm group"
            onClick={() => onOpenNCR(ncr)}
          >
            <div className="flex justify-between items-start mb-3">
              <Badge status={ncr.severity === 'high' ? 'cancelled' : 'in_progress'} text={ncr.severity} />
              <span className="text-xs text-[var(--color-text)]/40 group-hover:text-[var(--color-text)]/60 transition-colors">
                {new Date(ncr.createdAt!).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text)] line-clamp-2 font-medium mb-2">{ncr.issueDescription}</p>
            <div className="flex items-center text-xs text-[var(--color-text)]/50 mt-2">
              <AlertCircle size={14} className="mr-1" />
              QC: {ncr.qualityCheckId.slice(0, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
