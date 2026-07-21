import { apiService } from './apiService';
import { getAuth } from 'firebase/auth';

const downloadFile = async (endpoint: string, filename: string) => {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`http://192.168.8.163:4000/api/${endpoint}`, {
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

  const res = await fetch(`http://192.168.8.163:4000/api/${endpoint}`, {
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
