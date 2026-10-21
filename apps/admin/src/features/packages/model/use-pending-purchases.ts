import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import type { StaffPurchaseListParams } from '@rapiexpress/api-client/purchases.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { purchasesApi } from '@/shared/api/api';

import { pendingPurchasesSearch } from './pending-purchases';

export const PENDING_PURCHASES_PAGE_SIZE = 20;

export function usePendingPurchases(customer: CustomerSummary | null, typed: string) {
  const search = pendingPurchasesSearch(customer, typed);
  const params: StaffPurchaseListParams = {
    page: 1,
    pageSize: PENDING_PURCHASES_PAGE_SIZE,
    status: 'PENDING_RECEPTION',
    ...(search && { search }),
  };

  return useQuery({
    queryKey: queryKeys.purchases.list(params),
    queryFn: () => purchasesApi.list(params),
    placeholderData: keepPreviousData,
  });
}
