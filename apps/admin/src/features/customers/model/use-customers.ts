import type { ListParams } from '@rapiexpress/api-client/pagination';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { customersApi } from '@/shared/api/api';

export function useCustomers(params: ListParams) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customersApi.list(params),
    placeholderData: keepPreviousData,
  });
}
