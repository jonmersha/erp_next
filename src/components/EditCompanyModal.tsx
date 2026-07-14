import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Building2, MapPin, Phone, Mail, Image as ImageIcon } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useTranslation } from 'react-i18next';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ isOpen, onClose, company }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: company.name,
    address: company.address || '',
    phone: company.phone || '',
    email: company.email || '',
    logoUrl: company.logoUrl || '',
    bannerUrl: company.bannerUrl || '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: company.name,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      logoUrl: company.logoUrl || '',
      bannerUrl: company.bannerUrl || '',
    });
  }, [company]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size before processing (limit to 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      
      // Compress image
      const maxWidth = field === 'logoUrl' ? 400 : 1200;
      const maxHeight = field === 'logoUrl' ? 400 : 600;
      const quality = 0.7;

      const compressed = await compressImage(base64Str, maxWidth, maxHeight, quality);
      
      // Final check: if compressed string is still too large (> 500KB)
      if (compressed.length > 500 * 1024) {
        alert('Image is still too large after compression. Please use a smaller image.');
        return;
      }

      setFormData(prev => ({ ...prev, [field]: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (base64Str: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.updateDocument('companies', company.id, {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--color-surface)] rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--color-text)]/20"
          >
            <div className="p-8 border-b border-[var(--color-text)]/20 flex justify-between items-center bg-[var(--color-bg)]/30">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">Edit Company Profile</h2>
                <p className="text-sm text-[var(--color-text)]/40">Update your organization's public identity</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--color-text)]/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Visual Assets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Company Logo</label>
                  <div className="relative group">
                    <div className="w-32 h-32 bg-[var(--color-bg)] rounded-3xl flex items-center justify-center border-2 border-dashed border-[var(--color-text)]/10 overflow-hidden">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={40} className="text-[var(--color-text)]/20" />
                      )}
                      <label className="absolute inset-0 bg-[var(--color-text)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Upload className="text-white" size={24} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'logoUrl')} />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Banner Image</label>
                  <div className="relative group">
                    <div className="w-full h-32 bg-[var(--color-bg)] rounded-3xl flex items-center justify-center border-2 border-dashed border-[var(--color-text)]/10 overflow-hidden">
                      {formData.bannerUrl ? (
                        <img src={formData.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={40} className="text-[var(--color-text)]/20" />
                      )}
                      <label className="absolute inset-0 bg-[var(--color-text)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Upload className="text-white" size={24} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'bannerUrl')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={20} />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={20} />
                    <input
                      required
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={18} />
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text)]/40 uppercase tracking-widest">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text)]/20" size={18} />
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-[var(--color-text)]/60 hover:bg-[var(--color-text)]/5 transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-[var(--color-main)] text-white px-6 py-4 rounded-2xl font-bold hover:bg-[var(--color-main)]/80 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{t('Save Changes')}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditCompanyModal;
