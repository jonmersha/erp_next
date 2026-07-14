import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { createSupplier, updateSupplier } from '../../services/procurementService';
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
    certificate_url: '',
    is_authorized: false,
    status: 'inactive',
  });

  useEffect(() => {
    if (isOpen && supplier) {
      setForm({
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email || '',
        certificate_url: supplier.certificate_url || '',
        is_authorized: supplier.is_authorized || false,
        status: supplier.status || 'inactive',
      });
    } else if (isOpen) {
      setForm({
        name: '',
        contact: '',
        email: '',
        certificate_url: '',
        is_authorized: false,
        status: 'inactive',
      });
    }
  }, [isOpen, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (supplier) {
        await updateSupplier(supplier.id, form);
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
        <div>
          <label className="block text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest mb-1">Certificate / License URL</label>
          <input 
            type="url" 
            placeholder="https://..."
            className="w-full p-3 rounded-xl border border-[var(--color-text)]/10 bg-[var(--color-bg)]"
            value={form.certificate_url}
            onChange={e => setForm({...form, certificate_url: e.target.value})}
          />
        </div>
        <div className="flex space-x-6 pt-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="form-checkbox text-[var(--color-main)] rounded"
              checked={form.is_authorized}
              onChange={e => setForm({...form, is_authorized: e.target.checked})}
            />
            <span className="text-sm font-bold text-[var(--color-text)]">Authorized</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="form-checkbox text-[var(--color-main)] rounded"
              checked={form.status === 'active'}
              onChange={e => setForm({...form, status: e.target.checked ? 'active' : 'inactive'})}
            />
            <span className="text-sm font-bold text-[var(--color-text)]">Active</span>
          </label>
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
