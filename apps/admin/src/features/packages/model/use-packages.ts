import type { PackageListParams } from '@rapiexpress/api-client/packages.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

export function usePackages(params: PackageListParams) {
  return useQuery({
    queryKey: queryKeys.packages.list(params),
    queryFn: () => packagesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
