import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { server } from '../test/server';
import { createApiClient } from './client.ts';
import { createCustomersApi } from './customers.api.ts';
import { queryKeys } from './query-keys.ts';
import { setAccessToken } from './token-store.ts';

const customersApi = createCustomersApi(createApiClient({ baseURL: '/api' }));

const customer = {
  id: 'c1',
  email: 'jane@example.com',
  name: 'Jane',
  lastName: 'Doe',
  phone: '+58 412 1234567',
  kind: 'CUSTOMER',
  lockerCode: 'MI-00001',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('customersApi.list', () => {
  it('requests the page with its params and parses the response', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/customers', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [customer], page: 1, pageSize: 20, total: 1 });
      })
    );

    const result = await customersApi.list({ page: 1, pageSize: 20, search: 'MI-00001' });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      page: '1',
      pageSize: '20',
      search: 'MI-00001',
    });
    expect(result.items[0]?.lockerCode).toBe('MI-00001');
  });

  it('accepts couriers and a missing locker code', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/customers', () =>
        HttpResponse.json({
          items: [{ ...customer, kind: 'COURIER', lockerCode: null }],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    const result = await customersApi.list({ page: 1, pageSize: 20 });

    expect(result.items[0]).toMatchObject({ kind: 'COURIER', lockerCode: null });
  });

  it('rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(
      http.get('*/api/customers', () =>
        HttpResponse.json({
          items: [{ ...customer, kind: 'STAFF' }],
          page: 1,
          pageSize: 20,
          total: 1,
        })
      )
    );

    await expect(customersApi.list({ page: 1, pageSize: 20 })).rejects.toBeInstanceOf(ZodError);
  });
});

describe('customers query keys', () => {
  it('scopes list keys under the customers root', () => {
    const params = { page: 2, pageSize: 20, search: 'MI' };

    expect(queryKeys.customers.list(params)).toEqual(['customers', 'list', params]);
    expect(queryKeys.customers.list(params).slice(0, 1)).toEqual(queryKeys.customers.all);
  });
});
