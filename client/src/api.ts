import axios from 'axios';
import type { App, DashboardStats, Database, Collection, DocumentPage, ServerConfig } from './types';

const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: (username: string, password: string) =>
    api.post<{ ok: boolean; username: string }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<{ username: string }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const apps = {
  list: () => api.get<App[]>('/apps'),
  get: (id: string) => api.get<App>(`/apps/${id}`),
  create: (data: { displayName: string; description?: string; color?: string }) =>
    api.post<App>('/apps', data),
  updateStatus: (id: string, status: App['status']) =>
    api.patch(`/apps/${id}/status`, { status }),
  update: (id: string, data: Partial<Pick<App, 'displayName' | 'description' | 'color'>>) =>
    api.patch(`/apps/${id}`, data),
  delete: (id: string) => api.delete(`/apps/${id}`),
  regeneratePassword: (id: string) =>
    api.post<{ ok: boolean; mongoPassword: string }>(`/apps/${id}/regenerate-password`),
};

export const config = {
  get: () => api.get<ServerConfig>('/config'),
};

export const stats = {
  get: () => api.get<DashboardStats>('/stats'),
};

export const databases = {
  list: () => api.get<Database[]>('/databases'),
  collections: (dbName: string) => api.get<Collection[]>(`/databases/${dbName}/collections`),
  documents: (dbName: string, colName: string, page = 1, limit = 20) =>
    api.get<DocumentPage>(`/databases/${dbName}/collections/${colName}/documents`, {
      params: { page, limit },
    }),
};

export default api;
