import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useQuery } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

export function usePackage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.packages.detail(id ?? ''),
    queryFn: () => packagesApi.get(id ?? ''),
    enabled: id !== undefined,
  });
}
