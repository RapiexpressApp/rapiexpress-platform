import { QueryClient } from '@tanstack/react-query';

import { getHttpStatus } from './http-error.ts';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = getHttpStatus(error);
          if (status !== undefined && status >= 400 && status < 500) return false;
          return failureCount < MAX_RETRIES;
        },
      },
    },
  });
}
