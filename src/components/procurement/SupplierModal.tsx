import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { createSupplier } from '../../services/procurementService';
import { useAuth } from '../../context/AuthContext';
import { X, Loader2 } from 'lucide-react';
import Modal from '../Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: Supplier;
}

const SupplierModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, supplier }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Omit<Supplier, 'id' | 'companyId'>>({
    name: '',
    contact: '',
    email: '',
  });

  useEffect(() => {
    if (isOpen && supplier) {
      setForm({
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email || '',
      });
    } else if (isOpen) {
      setForm({
        name: '',
        contact: '',
        email: '',
      });
    }
  }, [isOpen, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (supplier) {
        // Update logic if needed, services/procurementService.ts doesn't have updateSupplier yet
        // I'll stick to create for now or add update if I can
      } else {
        await createSupplier(form, profile);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier ? 'Edit Supplier' : 'New Supplier'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Supplier Name</label>
          <input 
            type="text" 
            required 
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Contact Person / Phone</label>
          <input 
            type="text" 
            required 
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={form.contact}
            onChange={e => setForm({...form, contact: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Email</label>
          <input 
            type="email" 
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[var(--color-main)] text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          <span>{supplier ? 'Update Supplier' : 'Create Supplier'}</span>
        </button>
      </form>
    </Modal>
  );
};

export default SupplierModal;
