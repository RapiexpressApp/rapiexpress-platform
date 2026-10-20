import type { MyPurchaseListParams } from '@rapiexpress/api-client/purchases.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { myPurchasesApi } from '@/shared/api/api';

export function useMyPurchases(params: MyPurchaseListParams) {
  return useQuery({
    queryKey: queryKeys.myPurchases.list(params),
    queryFn: () => myPurchasesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
