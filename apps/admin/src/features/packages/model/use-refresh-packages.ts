import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useQueryClient } from '@tanstack/react-query';

export function useRefreshPackages() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.packages.all });
}
