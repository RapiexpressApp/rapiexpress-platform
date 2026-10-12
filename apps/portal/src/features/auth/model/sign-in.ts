import type { QueryClient } from '@tanstack/react-query';

import { authApi } from '@/shared/api/auth.api';
import type { LoginPayload } from '@/shared/api/auth.schemas';
import { clearAccessToken } from '@/shared/api/token-store';

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
