import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { server } from '../test/server';
import { createApiClient } from './client.ts';
import { setAccessToken } from './token-store.ts';
import { createUsersApi } from './users.api.ts';
import { createUserPayloadSchema } from './users.schemas.ts';

const usersApi = createUsersApi(createApiClient({ baseURL: '/api' }));

const user = {
  id: 'u1',
  email: 'ops@rapiexpress.com',
  name: 'Olga',
  lastName: 'Pérez',
  phone: '+58 412 1234567',
  role: 'OPERATIONS',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('usersApi.list', () => {
  it('requests the page with its params and parses the paginated response', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/users', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [user], page: 2, pageSize: 10, total: 11 });
      })
    );

    const result = await usersApi.list({ page: 2, pageSize: 10, search: 'olga' });

    expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
      page: '2',
      pageSize: '10',
      search: 'olga',
    });
    expect(result).toEqual({ items: [user], page: 2, pageSize: 10, total: 11 });
  });

  it('omits an empty search', async () => {
    setAccessToken('tok');
    let url: URL | undefined;
    server.use(
      http.get('*/api/users', ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
      })
    );

    await usersApi.list({ page: 1, pageSize: 20, search: '  ' });

    expect(url?.searchParams.has('search')).toBe(false);
  });

  it('rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/users', () => HttpResponse.json({ items: [{ id: 1 }] })));

    await expect(usersApi.list({ page: 1, pageSize: 20 })).rejects.toBeInstanceOf(ZodError);
  });
});

describe('usersApi.create', () => {
  const payload = {
    email: 'Ops@Rapiexpress.com ',
    password: 'secret-pass',
    name: ' Olga ',
    lastName: 'Pérez',
    phone: '+58 412 1234567',
    role: 'OPERATIONS' as const,
  };

  it('posts the normalized payload and returns the created user', async () => {
    setAccessToken('tok');
    let body: unknown;
    server.use(
      http.post('*/api/users', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...user, kind: null }, { status: 201 });
      })
    );

    const result = await usersApi.create(payload);

    expect(body).toEqual({
      ...payload,
      email: 'ops@rapiexpress.com',
      name: 'Olga',
    });
    expect(result.role).toBe('OPERATIONS');
  });

  it('rejects an invalid payload before hitting the network', async () => {
    await expect(usersApi.create({ ...payload, role: 'CUSTOMER' as never })).rejects.toBeInstanceOf(
      ZodError
    );
  });
});

describe('createUserPayloadSchema', () => {
  const valid = {
    email: 'ops@rapiexpress.com',
    password: 'secret-pass',
    name: 'Olga',
    lastName: 'Pérez',
    phone: '+58 412 1234567',
    role: 'WAREHOUSE',
  };

  it.each([
    ['email over 254 chars', { email: `${'a'.repeat(250)}@x.com` }],
    ['short password', { password: 'short' }],
    ['password over 128 chars', { password: 'p'.repeat(129) }],
    ['blank name', { name: '   ' }],
    ['name over 100 chars', { name: 'n'.repeat(101) }],
    ['blank last name', { lastName: '' }],
    ['malformed phone', { phone: 'abc' }],
    ['unknown role', { role: 'CUSTOMER' }],
  ])('rejects %s', (_label, override) => {
    expect(createUserPayloadSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it('accepts a valid payload', () => {
    expect(createUserPayloadSchema.safeParse(valid).success).toBe(true);
  });
});
