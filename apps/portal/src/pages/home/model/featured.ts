import type { MyPackage } from '@rapiexpress/api-client/tracking.schemas';

function receivedTime({ receivedAt }: MyPackage): number {
  const time = Date.parse(receivedAt);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function newestFirst(packages: MyPackage[]): MyPackage[] {
  return [...packages].sort((a, b) => receivedTime(b) - receivedTime(a));
}

export function pickFeaturedPackage(packages: MyPackage[]): MyPackage | undefined {
  const pending = newestFirst(packages.filter((item) => item.status !== 'DELIVERED'));
  return pending.find((item) => item.readyForPickup) ?? pending[0];
}
