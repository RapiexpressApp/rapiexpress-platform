import type { MyPackageListParams } from '@rapiexpress/api-client/tracking.schemas';

import { useMyPackages } from '@/features/shipments/model/use-my-packages';

const RECENT_PARAMS: MyPackageListParams = { page: 1, pageSize: 5 };

export function useRecentPackages() {
  return useMyPackages(RECENT_PARAMS);
}
