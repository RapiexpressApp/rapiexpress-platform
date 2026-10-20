import type { MyPackage, MyPackageDetail } from '@rapiexpress/api-client/tracking.schemas';
import { http, HttpResponse } from 'msw';

export const PACKAGE_ID = '3f1c2a64-8b7e-4c5d-9a1b-2e4f6a8c0d12';

export const myPackageFixture = (overrides: Partial<MyPackage> = {}): MyPackage => ({
  id: PACKAGE_ID,
  warehouseNumber: 'WH-000123',
  trackingNumber: 'TBA123456789',
  status: 'WAREHOUSE',
  readyForPickup: false,
  weightLb: 1.5,
  weightKg: 0.68,
  category: 'FOUR_BY_FOUR',
  declaredValueUsd: 120.5,
  description: 'Audífonos inalámbricos',
  receivedAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

export const myPackageDetailFixture = (
  overrides: Partial<MyPackageDetail> = {}
): MyPackageDetail => ({
  ...myPackageFixture(),
  timeline: [{ status: 'WAREHOUSE', reachedAt: '2026-03-15T12:00:00.000Z' }],
  ...overrides,
});

interface ListMeta {
  total?: number;
  onRequest?: (url: URL) => void;
}

export const myPackagesListHandler = (items = [myPackageFixture()], meta: ListMeta = {}) =>
  http.get('*/api/me/packages', ({ request }) => {
    const url = new URL(request.url);
    meta.onRequest?.(url);
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      total: meta.total ?? items.length,
    });
  });

export const myPackagesBackendHandler = (packages: MyPackage[], onRequest?: (url: URL) => void) =>
  http.get('*/api/me/packages', ({ request }) => {
    const url = new URL(request.url);
    onRequest?.(url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const status = url.searchParams.get('status');
    const matching = status ? packages.filter((item) => item.status === status) : packages;
    return HttpResponse.json({
      items: matching.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: matching.length,
    });
  });

export const myPackageDetailHandler = (detail = myPackageDetailFixture()) =>
  http.get('*/api/me/packages/:id', ({ params }) =>
    params.id === detail.id
      ? HttpResponse.json(detail)
      : HttpResponse.json(
          { statusCode: 404, code: 'PACKAGE_NOT_FOUND', message: 'Package not found' },
          { status: 404 }
        )
  );
