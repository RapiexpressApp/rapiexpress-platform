import type { MyPackageListParams } from '@rapiexpress/api-client/tracking.schemas';

import { useMyPackages } from '@/features/shipments/model/use-my-packages';

import { useAgencyPackages, usePendingPreAlerts } from './home-queries';
import { combineStats, type HomeStats, type StatState } from './stats';

const countParams = (status: NonNullable<MyPackageListParams['status']>): MyPackageListParams => ({
  page: 1,
  pageSize: 1,
  status,
});

const SHIPPED_COUNT = countParams('SHIPPED');
const CUSTOMS_COUNT = countParams('CUSTOMS');

interface CountQuery {
  isError: boolean;
  data?: { total: number };
  refetch: () => unknown;
}

function toStat({ data, isError }: CountQuery): StatState {
  if (data) return { status: 'ready', value: data.total };
  return isError ? { status: 'error' } : { status: 'pending' };
}

function retryFailed(...queries: CountQuery[]) {
  for (const query of queries) if (query.isError) void query.refetch();
}

export function useHomeStats() {
  const shipped = useMyPackages(SHIPPED_COUNT);
  const customs = useMyPackages(CUSTOMS_COUNT);
  const agency = useAgencyPackages();
  const preAlerts = usePendingPreAlerts();

  const stats: HomeStats = {
    inTransit: combineStats(toStat(shipped), toStat(customs)),
    atAgency: toStat(agency),
    preAlerts: toStat(preAlerts),
  };

  const retry: Record<keyof HomeStats, () => void> = {
    inTransit: () => retryFailed(shipped, customs),
    atAgency: () => retryFailed(agency),
    preAlerts: () => retryFailed(preAlerts),
  };

  return { stats, retry };
}
