import axios, { AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * Central Axios instance.
 * - `VITE_API_BASE_URL` switches the app from the built-in mock layer to a real backend.
 * - JWT access token is attached automatically; 401 triggers a refresh-and-retry once.
 */
export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshing ??= useAuthStore.getState().refreshSession().finally(() => (refreshing = null));
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  status?: number;
  message: string;
  fields?: Record<string, string>;
}

export const extractApiError = (err: unknown): ApiError => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: Record<string, string> } | undefined;
    return {
      status: err.response?.status,
      message: data?.message ?? err.message ?? 'Unexpected server error',
      fields: data?.errors,
    };
  }
  return { message: err instanceof Error ? err.message : 'Unexpected error' };
};

/** Unwrap helper so services can return `data` directly. */
export const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> => p.then((r) => r.data);
