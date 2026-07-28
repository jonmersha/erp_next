import { apiService } from './apiService';
import { getAuth } from 'firebase/auth';
import { API_URL } from '../config';

const downloadFile = async (endpoint: string, filename: string) => {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL !== undefined ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '') : 'https://milkitest.besheger.com'}/api/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error('Failed to download backup');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const uploadFile = async (endpoint: string, file: File) => {
  const token = await getAuth().currentUser?.getIdToken();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL !== undefined ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '') : 'https://milkitest.besheger.com'}/api/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to restore backup');
  }

  return await res.json();
};

export const backupService = {
  exportSql: () => downloadFile('backup/sql', `backup-${new Date().toISOString().split('T')[0]}.sql`),
  importSql: (file: File) => uploadFile('backup/sql', file),
  exportCsv: () => downloadFile('backup/csv', `backup-csv-${new Date().toISOString().split('T')[0]}.zip`),
  importCsv: (file: File) => uploadFile('backup/csv', file),
};
