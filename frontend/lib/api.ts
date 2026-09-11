import { Job, Execution, TokenResponse, User } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.message || 'API request failed');
  }

  if (response.status === 204) {
    return null as any;
  }
  
  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string): Promise<TokenResponse> =>
      fetchWithAuth('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email: string, password: string): Promise<TokenResponse> =>
      fetchWithAuth('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: (): Promise<User> => fetchWithAuth('/api/auth/me'),
  },
  jobs: {
    list: (): Promise<Job[]> => fetchWithAuth('/api/jobs'),
    get: (id: string): Promise<Job> => fetchWithAuth(`/api/jobs/${id}`),
    create: (data: Partial<Job>): Promise<Job> => fetchWithAuth('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Job>): Promise<Job> => fetchWithAuth(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<void> => fetchWithAuth(`/api/jobs/${id}`, { method: 'DELETE' }),
    trigger: (id: string): Promise<Execution> => fetchWithAuth(`/api/jobs/${id}/trigger`, { method: 'POST' }),
  },
  executions: {
    list: (): Promise<Execution[]> => fetchWithAuth('/api/executions'),
    get: (id: string): Promise<Execution> => fetchWithAuth(`/api/executions/${id}`),
    cancel: (id: string): Promise<Execution> => fetchWithAuth(`/api/executions/${id}/cancel`, { method: 'POST' }),
    retry: (id: string): Promise<Execution> => fetchWithAuth(`/api/executions/${id}/retry`, { method: 'POST' }),
  }
};
