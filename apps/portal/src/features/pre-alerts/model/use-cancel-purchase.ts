import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { myPurchasesApi } from '@/shared/api/api';

export function useCancelPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => myPurchasesApi.cancel(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.myPurchases.all }),
  });
}
