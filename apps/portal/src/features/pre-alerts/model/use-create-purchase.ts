import type { CreatePurchasePayload } from '@rapiexpress/api-client/purchases.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { myPurchasesApi } from '@/shared/api/api';

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchasePayload) => myPurchasesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myPurchases.all }),
  });
}
