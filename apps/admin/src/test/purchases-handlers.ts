import type { StaffPurchase } from '@rapiexpress/api-client/purchases.schemas';
import { http, HttpResponse } from 'msw';

import { customerSummaryFixture, PURCHASE_ID, TRACKING_NUMBER } from './reception-handlers';

export const staffPurchaseFixture = (overrides: Partial<StaffPurchase> = {}): StaffPurchase => ({
  id: PURCHASE_ID,
  store: 'Amazon',
  trackingNumber: TRACKING_NUMBER,
  description: 'Zapatos deportivos',
  declaredValueUsd: 59.99,
  estimatedWeightLb: 2.5,
  suggestedCategory: 'MIGRANT',
  status: 'PENDING_RECEPTION',
  createdAt: '2026-03-10T12:00:00.000Z',
  receivedAt: null,
  cancelledAt: null,
  customer: customerSummaryFixture(),
  ...overrides,
});

export const purchasesListHandler = (
  items: StaffPurchase[] = [staffPurchaseFixture()],
  meta: { total?: number; onRequest?: (url: URL) => void } = {}
) =>
  http.get('*/api/purchases', ({ request }) => {
    const url = new URL(request.url);
    meta.onRequest?.(url);
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      total: meta.total ?? items.length,
    });
  });
