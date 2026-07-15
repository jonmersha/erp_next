
import { auth } from '../firebase';

export interface FetchOptions {
  orderByField?: string;
  orderDir?: 'asc' | 'desc';
  limitCount?: number;
}

class ApiService {
  private getBaseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000/api';
  }

  private async getHeaders(forceRefresh = false) {
    let token = await auth.currentUser?.getIdToken(forceRefresh);
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  private async handleFetch(url: string, options: RequestInit, retryCount = 0): Promise<any> {
    console.log(`Fetching: ${url}`, options);
    try {
      const response = await fetch(url, options);
      console.log(`Response status for ${url}:`, response.status);
      
      if (response.status === 401 && retryCount < 1) {
        console.warn('Received 401, forcing token refresh and retrying...');
        const headers = await this.getHeaders(true);
        return this.handleFetch(url, { ...options, headers }, retryCount + 1);
      }

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = `Failed with status ${response.status}: ${text}`;
        try {
          const parsed = JSON.parse(text);
          if (parsed.error) {
            errorMsg = parsed.error;
          }
        } catch(e) {}
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error) {
      console.error(`Catch error for ${url}:`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl()}/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl()}/${endpoint}`, {
      method: 'GET',
      headers,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl()}/${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl()}/${endpoint}`, {
      method: 'DELETE',
      headers,
    });
  }

  async fetchCollection<T>(collectionName: string, companyId: string, options?: FetchOptions): Promise<T[]> {
    const headers = await this.getHeaders();
    const url = `${this.getBaseUrl()}/${collectionName}?companyId=${companyId}`;
    try {
      return await this.handleFetch(url, { headers });
    } catch (error) {
      console.error(`fetchCollection error for ${url}:`, error);
      return [];
    }
  }

  async addDocument(collectionName: string, data: any) {
    const headers = await this.getHeaders();
    try {
      const response = await fetch(`${this.getBaseUrl()}/${collectionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async updateDocument(collectionName: string, docId: string, data: any) {
    const headers = await this.getHeaders();
    try {
      const response = await fetch(`${this.getBaseUrl()}/${collectionName}/${docId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async deleteDocument(collectionName: string, docId: string) {
    const headers = await this.getHeaders();
    try {
      const response = await fetch(`${this.getBaseUrl()}/${collectionName}/${docId}`, {
        method: 'DELETE',
        headers,
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async uploadFile(file: File): Promise<{ url: string }> {
    const token = await auth.currentUser?.getIdToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.getBaseUrl()}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed with status ${response.status}: ${text}`);
    }

    return await response.json();
  }
}

export const apiService = new ApiService();
