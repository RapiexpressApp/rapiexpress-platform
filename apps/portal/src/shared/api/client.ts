import axios, { type AxiosError, type InternalAxiosRequestConfig, isAxiosError } from 'axios';

import type { TokenResponse } from './auth.schemas';
import { notifySessionExpired } from './session-events';
import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retried?: boolean;
  }
}

const REFRESH_PATH = '/auth/refresh';
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', REFRESH_PATH];

const config = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'x-client-type': 'web' },
};

export const apiClient = axios.create(config);
const refreshClient = axios.create(config);

let refreshInFlight: Promise<TokenResponse> | null = null;

export function refreshSession(): Promise<TokenResponse> {
  refreshInFlight ??= refreshClient
    .post<TokenResponse>(REFRESH_PATH)
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      return data;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function bearer(token: string | null): string | undefined {
  return token ? `Bearer ${token}` : undefined;
}

function shouldRefresh(
  error: AxiosError
): error is AxiosError & { config: InternalAxiosRequestConfig } {
  const request = error.config;
  if (error.response?.status !== 401 || !request || request._retried) return false;
  return !NO_REFRESH_PATHS.some((path) => request.url?.startsWith(path));
}

apiClient.interceptors.request.use((request) => {
  const header = bearer(getAccessToken());
  if (header) request.headers.set('Authorization', header);
  return request;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!isAxiosError(error) || !shouldRefresh(error)) throw error;

  const request = error.config;
  request._retried = true;

  const sent = request.headers.get('Authorization') ?? undefined;
  const current = bearer(getAccessToken());
  const rotatedByAnotherCall = current !== undefined && current !== sent;

  if (!rotatedByAnotherCall) {
    try {
      await refreshSession();
    } catch (refreshError) {
      if (isAxiosError(refreshError) && refreshError.response) {
        clearAccessToken();
        notifySessionExpired();
      }
      throw error;
    }
  }

  return apiClient.request(request);
});
