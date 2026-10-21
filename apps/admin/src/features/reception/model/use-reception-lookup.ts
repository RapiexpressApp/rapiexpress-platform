import { useMutation } from '@tanstack/react-query';

import { packagesApi } from '@/shared/api/api';

export function useReceptionLookup() {
  return useMutation({
    mutationFn: (trackingNumber: string) => packagesApi.lookup(trackingNumber),
  });
}
