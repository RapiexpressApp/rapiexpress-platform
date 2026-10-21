import type { CustomerSummary } from '@rapiexpress/api-client/customers.schemas';
import type {
  ExistingPackage,
  PackageDetail,
  ReceptionLookup,
  ReceptionMatch,
} from '@rapiexpress/api-client/packages.schemas';
import { http, HttpResponse } from 'msw';

export const TRACKING_NUMBER = '1Z999AA10123456784';
export const CUSTOMER_ID = '5f1c6e43-8f0e-4a39-a5d3-0d6f2f5a7f10';
export const OTHER_CUSTOMER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
export const PURCHASE_ID = '0b9c0f3a-6d2e-4e0b-9a43-1c7f6a2d9e55';
export const OTHER_PURCHASE_ID = '7c2d9b1e-3a4f-4b6c-8d5e-9f0a1b2c3d4e';

export const customerSummaryFixture = (
  overrides: Partial<CustomerSummary> = {}
): CustomerSummary => ({
  id: CUSTOMER_ID,
  name: 'Jane',
  lastName: 'Doe',
  lockerCode: 'MI-00001',
  ...overrides,
});

export const receptionMatchFixture = (overrides: Partial<ReceptionMatch> = {}): ReceptionMatch => ({
  purchaseId: PURCHASE_ID,
  customer: customerSummaryFixture(),
  store: 'Amazon',
  trackingNumber: TRACKING_NUMBER,
  description: 'Zapatos deportivos',
  declaredValueUsd: 59.99,
  estimatedWeightLb: 2.5,
  suggestedCategory: 'MIGRANT',
  createdAt: '2026-03-10T12:00:00.000Z',
  ...overrides,
});

export const existingPackageFixture = (
  overrides: Partial<ExistingPackage> = {}
): ExistingPackage => ({
  id: 'k0',
  warehouseNumber: 'WH-000041',
  status: 'SHIPPED',
  customerId: null,
  createdAt: '2026-03-12T12:00:00.000Z',
  ...overrides,
});

export const receptionLookupFixture = (
  overrides: Partial<ReceptionLookup> = {}
): ReceptionLookup => ({
  trackingNumber: TRACKING_NUMBER,
  existingPackages: [],
  matches: [],
  ...overrides,
});

export const packageDetailFixture = (overrides: Partial<PackageDetail> = {}): PackageDetail => ({
  id: 'k1',
  warehouseNumber: 'WH-000042',
  trackingNumber: TRACKING_NUMBER,
  status: 'IN_WAREHOUSE',
  customer: null,
  purchaseId: null,
  weightLb: 2.5,
  weightKg: 1.13,
  packageType: 'NORMAL',
  category: null,
  declaredValueUsd: null,
  description: null,
  notes: null,
  duplicateConfirmed: false,
  createdAt: '2026-03-15T12:00:00.000Z',
  label: { warehouseNumber: 'WH-000042', customerName: null, lockerCode: null },
  ...overrides,
});

export const lookupHandler = (
  lookup: ReceptionLookup = receptionLookupFixture(),
  onRequest?: (url: URL) => void
) =>
  http.get('*/api/packages/reception/lookup', ({ request }) => {
    onRequest?.(new URL(request.url));
    return HttpResponse.json(lookup);
  });

export const receiveHandler = (
  detail: PackageDetail = packageDetailFixture(),
  onRequest?: (body: Record<string, unknown>) => void
) =>
  http.post('*/api/packages', async ({ request }) => {
    onRequest?.((await request.json()) as Record<string, unknown>);
    return HttpResponse.json(detail, { status: 201 });
  });

export const receiveErrorHandler = (status: number, body: Record<string, unknown>) =>
  http.post('*/api/packages', () => HttpResponse.json(body, { status }));

export const customerSearchHandler = (
  customers: CustomerSummary[] = [customerSummaryFixture()],
  onRequest?: (url: URL) => void
) =>
  http.get('*/api/packages/reception/customers', ({ request }) => {
    onRequest?.(new URL(request.url));
    return HttpResponse.json(customers);
  });
