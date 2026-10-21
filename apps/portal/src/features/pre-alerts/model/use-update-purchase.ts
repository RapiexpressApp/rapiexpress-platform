import type { UpdatePurchasePayload } from '@rapiexpress/api-client/purchases.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { myPurchasesApi } from '@/shared/api/api';

interface UpdatePurchaseVariables {
  id: string;
  payload: UpdatePurchasePayload;
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdatePurchaseVariables) => myPurchasesApi.update(id, payload),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.myPurchases.all }),
  });
}
