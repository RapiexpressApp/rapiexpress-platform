import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useQuery } from '@tanstack/react-query';

import { myPackagesApi } from '@/shared/api/api';

export function useMyPackage(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.myPackages.detail(id ?? ''),
    queryFn: () => myPackagesApi.get(id ?? ''),
    enabled: id !== undefined,
  });
}
