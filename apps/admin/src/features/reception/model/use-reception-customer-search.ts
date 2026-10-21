import { receptionCustomerSearchSchema } from '@rapiexpress/api-client/packages.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

export const RECEPTION_CUSTOMER_LIMIT = 10;

export function isSearchable(search: string): boolean {
  return receptionCustomerSearchSchema.safeParse(search).success;
}

export function useReceptionCustomerSearch(search: string) {
  const term = search.trim();

  return useQuery({
    queryKey: queryKeys.packages.receptionCustomers(term),
    queryFn: () => packagesApi.searchReceptionCustomers(term),
    enabled: isSearchable(term),
    placeholderData: keepPreviousData,
  });
}
