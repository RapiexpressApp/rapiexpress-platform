import type { CreatePurchaseForCustomerPayload } from '@rapiexpress/api-client/purchases.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { purchasesApi } from '@/shared/api/api';

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseForCustomerPayload) => purchasesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all }),
  });
}
