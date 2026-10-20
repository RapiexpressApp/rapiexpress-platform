import type {
  PackageEvent,
  PackageIncident,
  PackageListItem,
  PackagePurchase,
  PackageStaffDetail,
  StaffUserSummary,
} from '@rapiexpress/api-client/packages.schemas';
import { http, HttpResponse } from 'msw';

import {
  customerSummaryFixture,
  packageDetailFixture,
  PURCHASE_ID,
  TRACKING_NUMBER,
} from './reception-handlers';

export const PACKAGE_ID = '3f2b8c1e-7d4a-4e9b-8c5f-2a1b3c4d5e6f';
export const INCIDENT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

export const staffUserFixture = (overrides: Partial<StaffUserSummary> = {}): StaffUserSummary => ({
  id: 'u-staff-1',
  name: 'Ana',
  lastName: 'Rojas',
  ...overrides,
});

export const packageListItemFixture = (
  overrides: Partial<PackageListItem> = {}
): PackageListItem => ({
  id: PACKAGE_ID,
  warehouseNumber: 'WH-000042',
  trackingNumber: TRACKING_NUMBER,
  status: 'IN_WAREHOUSE',
  customer: customerSummaryFixture(),
  weightLb: 2.5,
  weightKg: 1.13,
  category: 'MIGRANT',
  declaredValueUsd: 59.99,
  hasOpenIncident: false,
  createdAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

export const packageEventFixture = (overrides: Partial<PackageEvent> = {}): PackageEvent => ({
  fromStatus: null,
  toStatus: 'IN_WAREHOUSE',
  source: 'RECEPTION',
  actor: staffUserFixture(),
  occurredAt: '2026-03-15T12:00:00.000Z',
  ...overrides,
});

export const packageIncidentFixture = (
  overrides: Partial<PackageIncident> = {}
): PackageIncident => ({
  id: INCIDENT_ID,
  packageId: PACKAGE_ID,
  type: 'DAMAGED',
  reason: 'Caja aplastada al llegar',
  openedBy: staffUserFixture(),
  openedAt: '2026-03-16T12:00:00.000Z',
  resolvedBy: null,
  resolvedAt: null,
  resolutionNote: null,
  ...overrides,
});

export const packagePurchaseFixture = (
  overrides: Partial<PackagePurchase> = {}
): PackagePurchase => ({
  id: PURCHASE_ID,
  store: 'Amazon',
  trackingNumber: TRACKING_NUMBER,
  declaredValueUsd: 59.99,
  estimatedWeightLb: 2.5,
  suggestedCategory: 'MIGRANT',
  createdAt: '2026-03-10T12:00:00.000Z',
  ...overrides,
});

export const packageStaffDetailFixture = (
  overrides: Partial<PackageStaffDetail> = {}
): PackageStaffDetail => ({
  ...packageDetailFixture({
    id: PACKAGE_ID,
    customer: customerSummaryFixture(),
    category: 'MIGRANT',
    declaredValueUsd: 59.99,
    description: 'Zapatos deportivos',
    notes: 'Caja con una esquina golpeada',
    label: { warehouseNumber: 'WH-000042', customerName: 'Jane Doe', lockerCode: 'MI-00001' },
  }),
  purchase: null,
  events: [packageEventFixture()],
  allowedTransitions: [],
  openIncident: null,
  incidents: [],
  ...overrides,
});

export const packagesListHandler = (
  items: PackageListItem[] = [packageListItemFixture()],
  meta: { total?: number; onRequest?: (url: URL) => void } = {}
) =>
  http.get('*/api/packages', ({ request }) => {
    const url = new URL(request.url);
    meta.onRequest?.(url);
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      total: meta.total ?? items.length,
    });
  });

export const packageDetailHandler = (
  detail: PackageStaffDetail = packageStaffDetailFixture(),
  onRequest?: (url: URL) => void
) =>
  http.get('*/api/packages/:id', ({ request }) => {
    onRequest?.(new URL(request.url));
    return HttpResponse.json(detail);
  });

export const packageNotFoundHandler = () =>
  http.get('*/api/packages/:id', () =>
    HttpResponse.json(
      { statusCode: 404, code: 'PACKAGE_NOT_FOUND', message: 'Package not found' },
      { status: 404 }
    )
  );
