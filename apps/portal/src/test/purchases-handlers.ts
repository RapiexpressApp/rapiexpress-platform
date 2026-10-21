import { http, HttpResponse } from 'msw';

export interface PurchaseFixture {
  id: string;
  store: string;
  trackingNumber: string;
  description: string;
  declaredValueUsd: number;
  estimatedWeightLb: number;
  suggestedCategory: 'FOUR_BY_FOUR' | 'MIGRANT' | 'COMMERCIAL';
  status: 'PENDING_RECEPTION' | 'RECEIVED' | 'CANCELLED';
  createdAt: string;
  receivedAt: string | null;
  cancelledAt: string | null;
}

export const purchaseFixture = (overrides: Partial<PurchaseFixture> = {}): PurchaseFixture => ({
  id: 'p1',
  store: 'Amazon',
  trackingNumber: 'TBA123456789',
  description: 'Audífonos inalámbricos',
  declaredValueUsd: 120.5,
  estimatedWeightLb: 1.5,
  suggestedCategory: 'FOUR_BY_FOUR',
  status: 'PENDING_RECEPTION',
  createdAt: '2026-03-15T12:00:00.000Z',
  receivedAt: null,
  cancelledAt: null,
  ...overrides,
});

interface ListMeta {
  total?: number;
  onRequest?: (url: URL) => void;
}

export const purchasesListHandler = (items = [purchaseFixture()], meta: ListMeta = {}) =>
  http.get('*/api/me/purchases', ({ request }) => {
    const url = new URL(request.url);
    meta.onRequest?.(url);
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 10),
      total: meta.total ?? items.length,
    });
  });
