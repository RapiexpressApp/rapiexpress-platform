import { queryOptions, useQuery } from '@tanstack/react-query';

import { authApi } from '@/shared/api/auth.api';
import { queryKeys } from '@/shared/api/query-keys';

import { useSession } from './session-context';

const ME_STALE_TIME_MS = 5 * 60 * 1000;

export const meQueryOptions = queryOptions({
  queryKey: queryKeys.auth.me(),
  queryFn: () => authApi.me(),
  staleTime: ME_STALE_TIME_MS,
});

export function useMe() {
  const { status } = useSession();
  return useQuery({ ...meQueryOptions, enabled: status === 'authenticated' });
}
