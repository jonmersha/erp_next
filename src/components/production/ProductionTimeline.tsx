import React, { useState, useEffect } from 'react';
import { ProductionEvent, ProductionRun, ProductionStage } from '../../types';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Play, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  run: ProductionRun;
  onStatusChange: (newStatus: string) => void;
}

export const ProductionTimeline: React.FC<Props> = ({ run, onStatusChange }) => {
  const { profile } = useAuth();
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States for updating a dynamic stage
  const [actualTimeMinutes, setActualTimeMinutes] = useState<number | ''>('');
  const [quantityProduced, setQuantityProduced] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    fetchStages();
    const interval = setInterval(fetchStages, 5000);
    return () => clearInterval(interval);
  }, [run.id]);

  const fetchStages = async () => {
    try {
      const data = await apiService.get<any[]>(`production/${run.id}/stages`);
      if (data) setStages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNextStage = () => {
    return stages.find(s => s.status !== 'completed');
  };

  const handleAction = async (stageId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      await apiService.put(`production/${run.id}/stages/${stageId}`, {
        status: 'completed',
        actualTimeMinutes: actualTimeMinutes || undefined,
        quantityProduced: quantityProduced || undefined,
        notes: notes || undefined,
        performedBy: profile?.uid
      });
      setActualTimeMinutes('');
      setQuantityProduced('');
      setNotes('');
      await fetchStages();
      // If this was the last stage, update run status to completed? We could just let it be.
    } catch (err: any) {
      setError(err.message || 'Failed to update stage');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[var(--color-main)]" /></div>;

  const nextStage = getNextStage();

  if (stages.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 mt-6 text-center">
        <p className="text-[var(--color-text)]/40 font-bold">No dynamic stages defined for this run.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] p-6 rounded-3xl border border-[var(--color-text)]/20 mt-6">
      <h4 className="font-bold text-[var(--color-text)] mb-6 uppercase tracking-widest text-xs">Production Lifecycle</h4>
      
      {error && (
        <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {stages.map((stage) => {
          const isCompleted = stage.status === 'completed';
          const isCurrent = nextStage?.id === stage.id;
          
          return (
            <div key={stage.id} className={`flex items-start space-x-4 ${!isCompleted && !isCurrent ? 'opacity-40' : ''}`}>
              <div className={`p-2 rounded-full mt-1 ${isCompleted ? 'bg-emerald-500/10 text-emerald-500' : isCurrent ? 'bg-[var(--color-main)]/10 text-[var(--color-main)]' : 'bg-[var(--color-text)]/5 text-[var(--color-text)]/40'}`}>
                {isCompleted ? <CheckCircle size={20} /> : <Play size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`font-bold ${isCompleted ? 'text-[var(--color-text)]' : isCurrent ? 'text-[var(--color-main)]' : 'text-[var(--color-text)]/40'}`}>
                      {stage.stageName}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-[var(--color-text)]/40">
                      Operator: {stage.assignedOperatorId || 'Any'} {stage.percentageWeight ? `| Weight: ${stage.percentageWeight}%` : ''}
                    </p>
                  </div>
                  {isCompleted && stage.updatedAt && (
                    <p className="text-xs font-mono text-[var(--color-text)]/40">
                      {new Date(stage.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                
                {isCompleted && (
                  <div className="mt-2 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/10 text-xs text-[var(--color-text)]/70 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stage.actualTimeMinutes && (
                      <div>
                        <span className="font-bold">Time Taken:</span> {stage.actualTimeMinutes} mins
                      </div>
                    )}
                    {stage.quantityProduced && (
                      <div>
                        <span className="font-bold">Units Produced:</span> {stage.quantityProduced}
                      </div>
                    )}
                    {stage.notes && (
                      <div className="col-span-2">
                        <span className="font-bold">Notes:</span> {stage.notes}
                      </div>
                    )}
                  </div>
                )}

                {isCurrent && (
                  <div className="mt-3 space-y-4 border-l-2 border-[var(--color-main)] pl-4 ml-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      <input 
                        type="number" 
                        placeholder="Time Taken (mins)" 
                        className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-sm" 
                        value={actualTimeMinutes}
                        onChange={e => setActualTimeMinutes(Number(e.target.value))} 
                      />
                      <input 
                        type="number" 
                        placeholder="Units Produced" 
                        className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-sm" 
                        value={quantityProduced}
                        onChange={e => setQuantityProduced(Number(e.target.value))} 
                      />
                      <input 
                        type="text" 
                        placeholder="Notes / Comments" 
                        className="w-full p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-text)]/20 text-sm md:col-span-1 col-span-2" 
                        value={notes}
                        onChange={e => setNotes(e.target.value)} 
                      />
                    </div>
                    
                    <button
                      onClick={() => handleAction(stage.id)}
                      disabled={submitting}
                      className="bg-[var(--color-main)] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[var(--color-main)]/90 transition-all disabled:opacity-50 w-full mt-4"
                    >
                      {submitting ? 'Processing...' : `Mark ${stage.stageName} Complete`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
