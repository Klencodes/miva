// config/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IUser } from '../types';
import { getStoredItem, USER_KEY, ENTITY_KEY } from '../hooks/useStore';

const BASE_URL = process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : 'https://miva-server.vercel.app/api');

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token + entity ID to every request
client.interceptors.request.use((config) => {
  const user = getStoredItem<IUser | null>(USER_KEY, null);
  const entity = getStoredItem<any>(ENTITY_KEY, null);

  if (user?.auth_token) config.headers.Authorization = `Bearer ${user.auth_token}`;
  
  const entityId = entity?.uuid || entity?.entity_id || entity?.id;
  if (entityId) config.headers['X-Entity'] = entityId;

  return config;
});

// Handle 401 → redirect to login
client.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem(USER_KEY);
    if (window.location.pathname !== '/account/login') {
      window.location.href = '/account/login?session=expired';
    }
  }
  return Promise.reject(error.response?.data || error);
});

const get  = <T>(url: string, config?: AxiosRequestConfig) => client.get<T>(url, config).then(r => r.data);
const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) => client.post<T>(url, data, config).then(r => r.data);
const put  = <T>(url: string, data?: any, config?: AxiosRequestConfig) => client.put<T>(url, data, config).then(r => r.data);
const patch = <T>(url: string, data?: any, config?: AxiosRequestConfig) => client.patch<T>(url, data, config).then(r => r.data);
const del  = <T>(url: string, config?: AxiosRequestConfig) => client.delete<T>(url, config).then(r => r.data);

// File upload with optional progress callback
const upload = <T>(url: string, file: File, fieldName = 'file', onProgress?: (pct: number) => void) => {
  const form = new FormData();
  form.append(fieldName, file);
  return client.post<T>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
  }).then(r => r.data);
};

// Auth helpers
const getUser   = () => getStoredItem<IUser | null>(USER_KEY, null);
const getEntity = () => getStoredItem<any>(ENTITY_KEY, null);
const clearAuth = () => { localStorage.removeItem(USER_KEY); localStorage.removeItem(ENTITY_KEY); };
// eslint-disable-next-line
export default { get, post, put, patch, del, upload, getUser, getEntity, clearAuth };
