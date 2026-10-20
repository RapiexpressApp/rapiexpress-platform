import type { UpdatePackagePayload } from '@rapiexpress/api-client/packages.schemas';
import { useMutation } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

import { useRefreshPackages } from './use-refresh-packages';

export function useUpdatePackage(id: string) {
  const refresh = useRefreshPackages();

  return useMutation({
    mutationFn: (payload: UpdatePackagePayload) => packagesApi.update(id, payload),
    onSuccess: refresh,
  });
}
