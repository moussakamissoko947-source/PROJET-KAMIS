import { User, StorageUsage, FileItem, AccountData, SentEmail } from '../types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg = data?.error || `Erreur serveur (${res.status})`;
    throw new ApiError(errorMsg, res.status, data?.code);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(data: { email: string; password: string; acceptTerms: boolean }) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return handleResponse<{ message: string; requiresVerification: boolean; email: string; activationLink?: string }>(res);
    },

    async verifyEmail(token: string) {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token })
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async devVerify(email: string) {
      const res = await fetch(`${API_BASE}/auth/dev-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async resendVerification(email: string) {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      return handleResponse<{ message: string; activationLink?: string }>(res);
    },

    async login(data: { email: string; password: string }) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return handleResponse<{ user: User; storage: StorageUsage; token?: string }>(res);
    },

    async logout() {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return handleResponse<{ success: boolean; message: string }>(res);
    },

    async me() {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });
      return handleResponse<{ user: User; storage: StorageUsage }>(res);
    },

    async requestPasswordReset(email: string) {
      const res = await fetch(`${API_BASE}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      return handleResponse<{ message: string }>(res);
    },

    async confirmPasswordReset(data: { token: string; newPassword: string }) {
      const res = await fetch(`${API_BASE}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return handleResponse<{ message: string }>(res);
    }
  },

  files: {
    async list(params?: {
      search?: string;
      category?: string;
      sortBy?: 'date' | 'name' | 'size';
      sortOrder?: 'asc' | 'desc';
    }) {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.category) query.set('category', params.category);
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

      const qs = query.toString();
      const res = await fetch(`${API_BASE}/files${qs ? `?${qs}` : ''}`, {
        credentials: 'include'
      });
      return handleResponse<{ files: FileItem[]; storage: StorageUsage }>(res);
    },

    async upload(file: File, onProgress?: (percent: number) => void): Promise<{ file: FileItem; storage: StorageUsage }> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.open('POST', `${API_BASE}/files/upload`);
        xhr.withCredentials = true;

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new ApiError(data.error || 'Erreur lors de l’envoi du fichier', xhr.status));
            }
          } catch {
            reject(new ApiError('Réponse serveur non valide', xhr.status));
          }
        };

        xhr.onerror = () => {
          reject(new ApiError('Erreur de connexion réseau lors du transfert', 0));
        };

        xhr.send(formData);
      });
    },

    getDownloadUrl(fileId: string): string {
      return `${API_BASE}/files/${fileId}/download`;
    },

    getPreviewUrl(fileId: string): string {
      return `${API_BASE}/files/${fileId}/preview`;
    },

    async delete(fileId: string) {
      const res = await fetch(`${API_BASE}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse<{ success: boolean; message: string; storage: StorageUsage }>(res);
    }
  },

  account: {
    async get() {
      const res = await fetch(`${API_BASE}/account`, {
        credentials: 'include'
      });
      return handleResponse<AccountData>(res);
    },

    async changePassword(data: { oldPassword: string; newPassword: string }) {
      const res = await fetch(`${API_BASE}/account/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      return handleResponse<{ message: string }>(res);
    },

    async deleteAccount() {
      const res = await fetch(`${API_BASE}/account`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return handleResponse<{ message: string }>(res);
    }
  },

  dev: {
    async getMailbox() {
      const res = await fetch(`${API_BASE}/dev/mailbox`, {
        credentials: 'include'
      });
      return handleResponse<{ emails: SentEmail[] }>(res);
    },

    async clearMailbox() {
      const res = await fetch(`${API_BASE}/dev/mailbox/clear`, {
        method: 'POST',
        credentials: 'include'
      });
      return handleResponse<{ success: boolean }>(res);
    }
  }
};
