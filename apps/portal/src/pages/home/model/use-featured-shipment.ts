import type { MyPackageDetail } from '@rapiexpress/api-client/tracking.schemas';

import { useMyPackage } from '@/features/shipments/model/use-my-package';

import { pickFeaturedPackage } from './featured';
import { useAgencyPackages, useRecentPackages } from './home-queries';

export type FeaturedState = { retry: () => void } & (
  | { kind: 'pending' }
  | { kind: 'none' }
  | { kind: 'error' }
  | { kind: 'ready'; detail: MyPackageDetail }
);

export function useFeaturedShipment(): FeaturedState {
  const recent = useRecentPackages();
  const agency = useAgencyPackages();
  const sources = [recent, agency];
  const picked = pickFeaturedPackage([
    ...(recent.data?.items ?? []),
    ...(agency.data?.items ?? []),
  ]);
  const detail = useMyPackage(picked?.id);

  const retry = () => {
    for (const query of [...sources, detail]) if (query.isError) void query.refetch();
  };

  const sourceFailed = sources.some((query) => query.isError && !query.data);
  if (sourceFailed || (picked && detail.isError)) return { kind: 'error', retry };
  if (sources.some((query) => !query.data)) return { kind: 'pending', retry };
  if (!picked) return { kind: 'none', retry };
  if (!detail.data) return { kind: 'pending', retry };
  return { kind: 'ready', detail: detail.data, retry };
}
