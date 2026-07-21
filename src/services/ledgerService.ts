import { apiService } from './apiService';

export interface JournalEntry {
  id: string;
  date: string;
  accountType: string;
  amount: number;
  entryType: 'debit' | 'credit';
  referenceType: string;
  referenceId: string;
  description: string;
  createdAt: string;
}

export interface ManualEntryPayload {
  accountType: string;
  amount: number;
  entryType: 'debit' | 'credit';
}

export const getJournalEntries = async (companyId: string, filters?: { startDate?: string; endDate?: string; accountType?: string }) => {
  let url = `finance/journal-entries?companyId=${companyId}`;
  if (filters?.startDate) url += `&startDate=${filters.startDate}`;
  if (filters?.endDate) url += `&endDate=${filters.endDate}`;
  if (filters?.accountType) url += `&accountType=${filters.accountType}`;
  
  return apiService.get<JournalEntry[]>(url);
};

export const createManualJournalEntry = async (companyId: string, date: string, description: string, entries: ManualEntryPayload[]) => {
  return apiService.post<any>('finance/journal-entries', {
    companyId,
    date,
    description,
    entries
  });
};
