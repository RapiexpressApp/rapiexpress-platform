import type { StaffPurchaseListParams } from '@rapiexpress/api-client/purchases.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { purchasesApi } from '@/shared/api/api';

export function usePurchases(params: StaffPurchaseListParams) {
  return useQuery({
    queryKey: queryKeys.purchases.list(params),
    queryFn: () => purchasesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
