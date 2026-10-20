import { queryKeys } from '@rapiexpress/api-client/query-keys';
import type { MyPackageListParams } from '@rapiexpress/api-client/tracking.schemas';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { myPackagesApi } from '@/shared/api/api';

export function useMyPackages(params: MyPackageListParams) {
  return useQuery({
    queryKey: queryKeys.myPackages.list(params),
    queryFn: () => myPackagesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
