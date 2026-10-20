import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z, ZodError } from 'zod';

import { server } from '../test/server';
import { createApiClient } from './client.ts';
import { createMyPurchasesApi } from './purchases.api.ts';
import { createPurchasePayloadSchema, updatePurchasePayloadSchema } from './purchases.schemas.ts';
import { queryKeys } from './query-keys.ts';
import { setAccessToken } from './token-store.ts';

const myPurchasesApi = createMyPurchasesApi(createApiClient({ baseURL: '/api' }));

const purchase = {
  id: 'p1',
  store: 'Amazon',
  trackingNumber: '1Z999AA10123456784',
  description: 'Running shoes',
  declaredValueUsd: 59.99,
  estimatedWeightLb: 2.5,
  suggestedCategory: 'MIGRANT',
  status: 'PENDING_RECEPTION',
  createdAt: '2026-01-01T00:00:00.000Z',
  receivedAt: null,
  cancelledAt: null,
};

const payload = {
  store: 'Amazon',
  trackingNumber: '1Z999AA10123456784',
  description: 'Running shoes',
  declaredValueUsd: 59.99,
  estimatedWeightLb: 2.5,
  suggestedCategory: 'MIGRANT' as const,
};

describe('myPurchasesApi.list', () => {
  it('requests the page with its params and parses the response', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/me/purchases', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [purchase], page: 2, pageSize: 10, total: 11 });
      })
    );

    const result = await myPurchasesApi.list({
      page: 2,
      pageSize: 10,
      status: 'PENDING_RECEPTION',
    });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      page: '2',
      pageSize: '10',
      status: 'PENDING_RECEPTION',
    });
    expect(result).toEqual({ items: [purchase], page: 2, pageSize: 10, total: 11 });
  });

  it('omits the status when it is not filtered', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/me/purchases', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
      })
    );

    await myPurchasesApi.list({ page: 1, pageSize: 20 });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({ page: '1', pageSize: '20' });
  });

  it('accepts received and cancelled purchases with their dates', async () => {
    setAccessToken('tok');
    const received = {
      ...purchase,
      status: 'RECEIVED',
      receivedAt: '2026-01-03T00:00:00.000Z',
    };
    const cancelled = {
      ...purchase,
      id: 'p2',
      status: 'CANCELLED',
      cancelledAt: '2026-01-02T00:00:00.000Z',
    };
    server.use(
      http.get('*/api/me/purchases', () =>
        HttpResponse.json({ items: [received, cancelled], page: 1, pageSize: 20, total: 2 })
      )
    );

    const result = await myPurchasesApi.list({ page: 1, pageSize: 20 });

    expect(result.items[0]).toMatchObject({ status: 'RECEIVED', receivedAt: received.receivedAt });
    expect(result.items[1]).toMatchObject({
      status: 'CANCELLED',
      cancelledAt: cancelled.cancelledAt,
    });
  });

  it('rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/purchases', () =>
        HttpResponse.json({
          items: [{ ...purchase, status: 'ARCHIVED' }],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    await expect(myPurchasesApi.list({ page: 1, pageSize: 20 })).rejects.toBeInstanceOf(ZodError);
  });
});

describe('myPurchasesApi.get', () => {
  it('requests the purchase by id and parses it', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/me/purchases/p1', () => HttpResponse.json(purchase)));

    expect(await myPurchasesApi.get('p1')).toEqual(purchase);
  });

  it('rejects a purchase with a string amount', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/purchases/p1', () =>
        HttpResponse.json({ ...purchase, declaredValueUsd: '59.99' })
      )
    );

    await expect(myPurchasesApi.get('p1')).rejects.toBeInstanceOf(ZodError);
  });
});

describe('myPurchasesApi.create', () => {
  it('posts the normalized payload and returns the created purchase', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/me/purchases', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(purchase, { status: 201 });
      })
    );

    const result = await myPurchasesApi.create({
      ...payload,
      store: ' Amazon ',
      trackingNumber: ' 1z999-aa1 0123456784 ',
    });

    expect(body).toEqual(payload);
    expect(result.id).toBe('p1');
  });

  it('rejects an invalid payload before hitting the network', async () => {
    await expect(myPurchasesApi.create({ ...payload, declaredValueUsd: 0 })).rejects.toBeInstanceOf(
      ZodError
    );
  });
});

describe('myPurchasesApi.update', () => {
  it('patches only the provided fields', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.patch('*/api/me/purchases/p1', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...purchase, store: 'eBay' });
      })
    );

    const result = await myPurchasesApi.update('p1', { store: ' eBay ' });

    expect(body).toEqual({ store: 'eBay' });
    expect(result.store).toBe('eBay');
  });

  it('rejects an empty payload before hitting the network', async () => {
    await expect(myPurchasesApi.update('p1', {})).rejects.toBeInstanceOf(ZodError);
  });
});

describe('myPurchasesApi.cancel', () => {
  it('posts to the cancel endpoint and returns the cancelled purchase', async () => {
    setAccessToken('tok');
    let method: string | undefined;
    server.use(
      http.post('*/api/me/purchases/p1/cancel', ({ request }) => {
        method = request.method;
        return HttpResponse.json({
          ...purchase,
          status: 'CANCELLED',
          cancelledAt: '2026-01-02T00:00:00.000Z',
        });
      })
    );

    const result = await myPurchasesApi.cancel('p1');

    expect(method).toBe('POST');
    expect(result.status).toBe('CANCELLED');
  });
});

describe('createPurchasePayloadSchema', () => {
  it('accepts a valid payload and normalizes it', () => {
    const parsed = createPurchasePayloadSchema.parse({
      ...payload,
      store: '  Amazon  ',
      description: ' Running shoes ',
      trackingNumber: 'tba-3141 5926',
    });

    expect(parsed).toMatchObject({
      store: 'Amazon',
      description: 'Running shoes',
      trackingNumber: 'TBA31415926',
    });
  });

  it.each([
    ['blank store', { store: '   ' }],
    ['store over 120 chars', { store: 's'.repeat(121) }],
    ['blank description', { description: '' }],
    ['description over 500 chars', { description: 'd'.repeat(501) }],
    ['short tracking number', { trackingNumber: 'AB-12' }],
    ['tracking number with symbols', { trackingNumber: 'TRACK#12345' }],
    ['zero value', { declaredValueUsd: 0 }],
    ['value over the maximum', { declaredValueUsd: 100000.01 }],
    ['value with 3 decimals', { declaredValueUsd: 1.005 }],
    ['zero weight', { estimatedWeightLb: 0 }],
    ['weight over the maximum', { estimatedWeightLb: 1000.01 }],
    ['weight with 3 decimals', { estimatedWeightLb: 2.505 }],
    ['unknown category', { suggestedCategory: 'OTHER' }],
    ['null category', { suggestedCategory: null }],
  ])('rejects %s', (_label, override) => {
    expect(createPurchasePayloadSchema.safeParse({ ...payload, ...override }).success).toBe(false);
  });

  it('accepts the upper limits', () => {
    const result = createPurchasePayloadSchema.safeParse({
      ...payload,
      store: 's'.repeat(120),
      description: 'd'.repeat(500),
      declaredValueUsd: 100000,
      estimatedWeightLb: 1000,
    });

    expect(result.success).toBe(true);
  });

  it('can be extended by the apps', () => {
    const extended = createPurchasePayloadSchema.extend({ acceptTerms: z.literal(true) });

    expect(extended.safeParse({ ...payload, acceptTerms: true }).success).toBe(true);
    expect(extended.safeParse({ ...payload, acceptTerms: false }).success).toBe(false);
  });
});

describe('updatePurchasePayloadSchema', () => {
  it('accepts a partial payload', () => {
    expect(updatePurchasePayloadSchema.parse({ declaredValueUsd: 10 })).toEqual({
      declaredValueUsd: 10,
    });
  });

  it('rejects an empty payload', () => {
    expect(updatePurchasePayloadSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a null field because the backend never accepts it', () => {
    expect(updatePurchasePayloadSchema.safeParse({ store: null }).success).toBe(false);
  });

  it('rejects an invalid field', () => {
    expect(updatePurchasePayloadSchema.safeParse({ estimatedWeightLb: -1 }).success).toBe(false);
  });
});

describe('my purchases query keys', () => {
  it('scopes list and detail keys under the myPurchases root', () => {
    const params = { page: 1, pageSize: 20, status: 'PENDING_RECEPTION' as const };

    expect(queryKeys.myPurchases.all).toEqual(['myPurchases']);
    expect(queryKeys.myPurchases.list(params)).toEqual(['myPurchases', 'list', params]);
    expect(queryKeys.myPurchases.detail('p1')).toEqual(['myPurchases', 'detail', 'p1']);
    expect(queryKeys.myPurchases.detail('p1').slice(0, 1)).toEqual(queryKeys.myPurchases.all);
  });
});
