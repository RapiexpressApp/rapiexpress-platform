import { describe, expect, it } from 'vitest';

import { myPackageFixture } from '@/test/packages-handlers';

import { pickFeaturedPackage } from './featured';

const pkg = (
  id: string,
  status: 'WAREHOUSE' | 'SHIPPED' | 'CUSTOMS' | 'AGENCY' | 'DELIVERED',
  receivedAt: string,
  readyForPickup = false
) => myPackageFixture({ id, status, receivedAt, readyForPickup });

describe('pickFeaturedPackage', () => {
  it('prefers a package that is ready for pickup over a newer one', () => {
    const ready = pkg('ready', 'AGENCY', '2026-03-01T12:00:00.000Z', true);
    const newer = pkg('newer', 'SHIPPED', '2026-03-20T12:00:00.000Z');

    expect(pickFeaturedPackage([newer, ready])?.id).toBe('ready');
  });

  it('takes the newest of several ready packages', () => {
    const older = pkg('older', 'AGENCY', '2026-03-01T12:00:00.000Z', true);
    const newest = pkg('newest', 'AGENCY', '2026-03-05T12:00:00.000Z', true);

    expect(pickFeaturedPackage([older, newest])?.id).toBe('newest');
  });

  it('falls back to the newest package that is not delivered', () => {
    const delivered = pkg('delivered', 'DELIVERED', '2026-03-20T12:00:00.000Z');
    const customs = pkg('customs', 'CUSTOMS', '2026-03-10T12:00:00.000Z');
    const warehouse = pkg('warehouse', 'WAREHOUSE', '2026-03-12T12:00:00.000Z');
    const atAgency = pkg('agency', 'AGENCY', '2026-03-11T12:00:00.000Z');

    expect(pickFeaturedPackage([delivered, customs, atAgency, warehouse])?.id).toBe('warehouse');
  });

  it('keeps the list order when two packages share a date', () => {
    const first = pkg('first', 'SHIPPED', '2026-03-10T12:00:00.000Z');
    const second = pkg('second', 'CUSTOMS', '2026-03-10T12:00:00.000Z');

    expect(pickFeaturedPackage([first, second])?.id).toBe('first');
  });

  it('ignores a ready flag on a delivered package', () => {
    const odd = pkg('odd', 'DELIVERED', '2026-03-20T12:00:00.000Z', true);
    const shipped = pkg('shipped', 'SHIPPED', '2026-03-10T12:00:00.000Z');

    expect(pickFeaturedPackage([odd, shipped])?.id).toBe('shipped');
  });

  it('returns nothing without packages or when all are delivered', () => {
    expect(pickFeaturedPackage([])).toBeUndefined();
    expect(
      pickFeaturedPackage([pkg('done', 'DELIVERED', '2026-03-20T12:00:00.000Z')])
    ).toBeUndefined();
  });

  it('sorts a package with an unreadable date last', () => {
    const broken = pkg('broken', 'SHIPPED', 'not-a-date');
    const valid = pkg('valid', 'SHIPPED', '2026-03-10T12:00:00.000Z');

    expect(pickFeaturedPackage([broken, valid])?.id).toBe('valid');
  });
});
