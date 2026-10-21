import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useQueryClient } from '@tanstack/react-query';

export function useRefreshPurchases() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all });
}
