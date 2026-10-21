import type { ReceivePackagePayload } from '@rapiexpress/api-client/packages.schemas';
import { queryKeys } from '@rapiexpress/api-client/query-keys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

export function useReceivePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReceivePackagePayload) => packagesApi.receive(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.packages.all }),
  });
}
