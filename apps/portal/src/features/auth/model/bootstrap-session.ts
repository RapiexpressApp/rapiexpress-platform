import type { QueryClient } from '@tanstack/react-query';

import { authApi } from '@/shared/api/auth.api';
import { clearAccessToken } from '@/shared/api/token-store';

import { meQueryOptions } from './use-me';

export async function bootstrapSession(queryClient: QueryClient): Promise<boolean> {
  try {
    await authApi.refresh();
    await queryClient.fetchQuery(meQueryOptions);
    return true;
  } catch {
    clearAccessToken();
    return false;
  }
}
