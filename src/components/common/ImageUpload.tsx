import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { apiService } from '../../services/apiService';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, label, className = '' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const response = await apiService.uploadFile(file);
      onChange(response.url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-bold text-[var(--color-text)]/70">{label}</label>}
      
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="relative inline-block border border-[var(--color-text)]/10 rounded-xl overflow-hidden group">
            <img src={value} alt="Uploaded" className="max-h-48 max-w-full object-contain bg-[var(--color-bg)]" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200"
              >
                Change
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onChange(''); }}
                className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600"
                title="Remove image"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-text)]/20 rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-text)]/5 hover:border-[var(--color-main)] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-[var(--color-main)] mb-2" size={32} />
            ) : (
              <UploadCloud className="text-[var(--color-text)]/50 mb-2" size={32} />
            )}
            <span className="text-sm font-medium text-[var(--color-text)]/70">
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </span>
          </button>
        )}

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    </div>
  );
};
