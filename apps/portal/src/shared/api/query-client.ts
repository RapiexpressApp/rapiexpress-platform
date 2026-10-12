import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined;
          if (status !== undefined && status >= 400 && status < 500) return false;
          return failureCount < MAX_RETRIES;
        },
      },
    },
  });
}

export const queryClient = createQueryClient();
