import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { server } from '../test/server';
import { createApiClient } from './client.ts';
import { createMyPackagesApi } from './my-packages.api.ts';
import { queryKeys } from './query-keys.ts';
import { setAccessToken } from './token-store.ts';

const myPackagesApi = createMyPackagesApi(createApiClient({ baseURL: '/api' }));

const shipment = {
  id: 'k1',
  warehouseNumber: 'WH-000042',
  trackingNumber: '1Z999AA10123456784',
  status: 'WAREHOUSE',
  readyForPickup: false,
  weightLb: 2.5,
  weightKg: 1.13,
  category: 'MIGRANT',
  declaredValueUsd: 59.99,
  description: 'Running shoes',
  receivedAt: '2026-01-01T00:00:00.000Z',
};

const timeline = [
  { status: 'WAREHOUSE', reachedAt: '2026-01-01T00:00:00.000Z' },
  { status: 'SHIPPED', reachedAt: '2026-01-05T00:00:00.000Z' },
];

describe('myPackagesApi.list', () => {
  it('requests the page with its params and parses the response', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/me/packages', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [shipment], page: 3, pageSize: 5, total: 11 });
      })
    );

    const result = await myPackagesApi.list({ page: 3, pageSize: 5, status: 'SHIPPED' });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      page: '3',
      pageSize: '5',
      status: 'SHIPPED',
    });
    expect(result).toEqual({ items: [shipment], page: 3, pageSize: 5, total: 11 });
  });

  it('omits the status when it is not filtered', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/me/packages', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
      })
    );

    await myPackagesApi.list({ page: 1, pageSize: 20 });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({ page: '1', pageSize: '20' });
  });

  it('accepts a package without category, value or description', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/packages', () =>
        HttpResponse.json({
          items: [{ ...shipment, category: null, declaredValueUsd: null, description: null }],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    const result = await myPackagesApi.list({ page: 1, pageSize: 20 });

    expect(result.items[0]).toMatchObject({
      category: null,
      declaredValueUsd: null,
      description: null,
    });
  });

  it('rejects a status the customer is not supposed to see', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/packages', () =>
        HttpResponse.json({
          items: [{ ...shipment, status: 'IN_WAREHOUSE' }],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    await expect(myPackagesApi.list({ page: 1, pageSize: 20 })).rejects.toBeInstanceOf(ZodError);
  });
});

describe('myPackagesApi.get', () => {
  it('requests the package by id and parses it with its timeline', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/packages/k1', () =>
        HttpResponse.json({ ...shipment, status: 'SHIPPED', timeline })
      )
    );

    const result = await myPackagesApi.get('k1');

    expect(result).toEqual({ ...shipment, status: 'SHIPPED', timeline });
  });

  it('exposes readyForPickup while the package is at the agency', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/packages/k1', () =>
        HttpResponse.json({ ...shipment, status: 'AGENCY', readyForPickup: true, timeline })
      )
    );

    const result = await myPackagesApi.get('k1');

    expect(result).toMatchObject({ status: 'AGENCY', readyForPickup: true });
  });

  it('rejects a detail without the timeline', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/me/packages/k1', () => HttpResponse.json(shipment)));

    await expect(myPackagesApi.get('k1')).rejects.toBeInstanceOf(ZodError);
  });

  it('rejects a timeline step with an unknown status', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/me/packages/k1', () =>
        HttpResponse.json({
          ...shipment,
          timeline: [{ status: 'IN_BAG', reachedAt: '2026-01-01T00:00:00.000Z' }],
        })
      )
    );

    await expect(myPackagesApi.get('k1')).rejects.toBeInstanceOf(ZodError);
  });
});

describe('my packages query keys', () => {
  it('scopes list and detail keys under the myPackages root', () => {
    const params = { page: 1, pageSize: 20, status: 'CUSTOMS' as const };

    expect(queryKeys.myPackages.all).toEqual(['myPackages']);
    expect(queryKeys.myPackages.list(params)).toEqual(['myPackages', 'list', params]);
    expect(queryKeys.myPackages.detail('k1')).toEqual(['myPackages', 'detail', 'k1']);
    expect(queryKeys.myPackages.detail('k1').slice(0, 1)).toEqual(queryKeys.myPackages.all);
  });
});
