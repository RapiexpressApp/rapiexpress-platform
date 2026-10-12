import { type QueryClient, queryOptions } from '@tanstack/react-query';

import type { AuthApi } from './auth.api.ts';
import type { LoginPayload } from './auth.schemas.ts';
import { queryKeys } from './query-keys.ts';
import { clearAccessToken } from './token-store.ts';

const ME_STALE_TIME_MS = 5 * 60 * 1000;

export function createSession(authApi: AuthApi) {
  const meQueryOptions = queryOptions({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.me(),
    staleTime: ME_STALE_TIME_MS,
  });

  async function bootstrapSession(queryClient: QueryClient): Promise<boolean> {
    try {
      await authApi.refresh();
      await queryClient.fetchQuery(meQueryOptions);
      return true;
    } catch {
      clearAccessToken();
      return false;
    }
  }

  async function signIn(queryClient: QueryClient, payload: LoginPayload): Promise<void> {
    await authApi.login(payload);
    try {
      await queryClient.fetchQuery({ ...meQueryOptions, staleTime: 0 });
    } catch (error) {
      clearAccessToken();
      throw error;
    }
  }

  return { meQueryOptions, bootstrapSession, signIn };
}

export type Session = ReturnType<typeof createSession>;
