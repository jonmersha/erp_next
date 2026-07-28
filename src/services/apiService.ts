
import { auth } from '../firebase';
import { API_URL, AUTH_API_URL } from '../config';

export interface FetchOptions {
  orderByField?: string;
  orderDir?: 'asc' | 'desc';
  limitCount?: number;
}

class ApiService {
  private getBaseUrl(endpoint: string = '') {
    if (endpoint.startsWith('users') || endpoint.startsWith('/users')) {
      return AUTH_API_URL;
    }

    return API_URL;
  }

  private async getHeaders(forceRefresh = false) {
    const customToken = localStorage.getItem('erp_custom_token') || '';

    return {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Authorization': `Bearer ${customToken}`
    };
  }

  private async handleFetch(url: string, options: RequestInit, retryCount = 0): Promise<any> {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        console.warn('Received 401, session expired. Dispatching auth-expired event.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-expired'));
        }
        // Don't throw immediately if you want the event to handle it gracefully, but usually it's best to throw so the current promise chain rejects properly.
      }

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = `Failed with status ${response.status}: ${text}`;
        let existingId = null;
        try {
          const parsed = JSON.parse(text);
          if (parsed.existingId) {
            existingId = parsed.existingId;
          }
          if (parsed.error) {
            errorMsg = parsed.error;
            if (parsed.details) errorMsg += ` - ${parsed.details}`;
            if (parsed.sqlMessage) errorMsg += ` - SQL: ${parsed.sqlMessage}`;
          }
        } catch(e) {}
        
        const err = new Error(errorMsg);
        if (existingId) {
          (err as any).existingId = existingId;
        }
        throw err;
      }
      return await response.json();
    } catch (error) {
      console.error(`Catch error for ${url}:`, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl(endpoint)}/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl(endpoint)}/${endpoint}`, {
      method: 'GET',
      cache: 'no-store',
      headers,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl(endpoint)}/${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    return this.handleFetch(`${this.getBaseUrl(endpoint)}/${endpoint}`, {
      method: 'DELETE',
      headers,
    });
  }

  async fetchCollection<T>(collectionName: string, companyId: string, options?: FetchOptions): Promise<T[]> {
    const headers = await this.getHeaders();
    const url = `${this.getBaseUrl(collectionName)}/${collectionName}?companyId=${companyId}`;
    try {
      return await this.handleFetch(url, { headers, cache: 'no-store' });
    } catch (error) {
      console.error(`fetchCollection error for ${url}:`, error);
      return [];
    }
  }

  async addDocument(collectionName: string, data: any) {
    const headers = await this.getHeaders();
    try {
      const response = await fetch(`${this.getBaseUrl(collectionName)}/${collectionName}`, {
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
      const response = await fetch(`${this.getBaseUrl(collectionName)}/${collectionName}/${docId}`, {
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
      const response = await fetch(`${this.getBaseUrl(collectionName)}/${collectionName}/${docId}`, {
        method: 'DELETE',
        headers,
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async uploadFile(file: File): Promise<{ url: string }> {
    const customToken = typeof window !== 'undefined' ? localStorage.getItem('erp_custom_token') || '' : '';
    
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.getBaseUrl()}/upload`, {
      method: 'POST',
      headers: {
        ...(customToken ? { Authorization: `Bearer ${customToken}` } : {})
      },
      body: formData,
    });

    if (response.status === 401) {
      console.warn('Received 401 during upload, session expired. Dispatching auth-expired event.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-expired'));
      }
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Upload failed with status ${response.status}: ${text}`);
    }

    return await response.json();
  }

  getImageUrl(path: string | undefined): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = this.getBaseUrl().replace(/\/api\/?$/, '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

export const apiService = new ApiService();
