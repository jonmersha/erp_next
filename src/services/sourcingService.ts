import { auth } from '../firebase';

const API_URL = 'http://192.168.8.163:4000/api';

const getHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

export const fetchRFQs = async (companyId: string) => {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/sourcing/rfqs?companyId=${companyId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch RFQs');
  return res.json();
};

export const createRFQ = async (data: any) => {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/sourcing/rfqs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create RFQ');
  return res.json();
};

export const fetchBids = async (rfqId: string, companyId: string) => {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/sourcing/rfqs/${rfqId}/bids?companyId=${companyId}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch bids');
  return res.json();
};

export const submitBid = async (rfqId: string, data: any) => {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/sourcing/rfqs/${rfqId}/bids`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit bid');
  return res.json();
};

export const awardBid = async (rfqId: string, bidId: string, approverId: string) => {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}/sourcing/rfqs/${rfqId}/bids/${bidId}/award`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ approverId })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to award bid');
  }
  return res.json();
};
