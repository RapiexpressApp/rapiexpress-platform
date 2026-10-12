import type { LoginPayload } from '@rapiexpress/api-client/auth.schemas';
import { clearAccessToken } from '@rapiexpress/api-client/token-store';
import type { QueryClient } from '@tanstack/react-query';

import { authApi } from '@/shared/api/api';

import { meQueryOptions } from './use-me';

export async function signIn(queryClient: QueryClient, payload: LoginPayload): Promise<void> {
  await authApi.login(payload);
  try {
    await queryClient.fetchQuery({ ...meQueryOptions, staleTime: 0 });
  } catch (error) {
    clearAccessToken();
    throw error;
  }
}
