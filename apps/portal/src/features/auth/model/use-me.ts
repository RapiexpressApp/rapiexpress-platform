import { useSession } from '@rapiexpress/api-client/session-context';
import { useQuery } from '@tanstack/react-query';

import { session } from '@/shared/api/api';

export const meQueryOptions = session.meQueryOptions;

export function useMe() {
  const { status } = useSession();
  return useQuery({ ...meQueryOptions, enabled: status === 'authenticated' });
}
