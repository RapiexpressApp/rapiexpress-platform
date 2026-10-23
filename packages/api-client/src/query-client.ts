import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { getHttpStatus } from './http-error.ts';

const MAX_RETRIES = 2;
const RATE_LIMITED = 429;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10_000;

function retryAfterMs(error: unknown): number | undefined {
  if (!isAxiosError(error)) return undefined;

  const headers = error.response?.headers;
  const raw = headers?.['retry-after-short'] ?? headers?.['retry-after'];
  const seconds = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return undefined;

  return seconds * 1000;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = getHttpStatus(error);
          if (status === RATE_LIMITED) return failureCount < MAX_RETRIES;
          if (status !== undefined && status >= 400 && status < 500) return false;
          return failureCount < MAX_RETRIES;
        },
        retryDelay: (failureCount, error) =>
          Math.min(retryAfterMs(error) ?? BASE_DELAY_MS * 2 ** failureCount, MAX_DELAY_MS),
      },
    },
  });
}
