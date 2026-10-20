import type { MyPurchaseListParams } from '@rapiexpress/api-client/purchases.schemas';
import type { MyPackageListParams } from '@rapiexpress/api-client/tracking.schemas';

import { useMyPurchases } from '@/features/pre-alerts/model/use-my-purchases';
import { useMyPackages } from '@/features/shipments/model/use-my-packages';

const RECENT_PARAMS: MyPackageListParams = { page: 1, pageSize: 5 };
const PENDING_PRE_ALERTS_PARAMS: MyPurchaseListParams = {
  page: 1,
  pageSize: 3,
  status: 'PENDING_RECEPTION',
};

export function useRecentPackages() {
  return useMyPackages(RECENT_PARAMS);
}

export function usePendingPreAlerts() {
  return useMyPurchases(PENDING_PRE_ALERTS_PARAMS);
}
