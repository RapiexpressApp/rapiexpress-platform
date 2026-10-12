import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { server } from '@/test/server';

import { authApi } from './auth.api';
import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';

const profile = {
  id: 'u1',
  email: 'jane@example.com',
  name: 'Jane',
  lastName: 'Doe',
  phone: '+58 412 1234567',
  kind: 'CUSTOMER',
  role: 'CUSTOMER',
  lockerCode: 'MI-00001',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('authApi', () => {
  beforeEach(() => clearAccessToken());

  it('login posts credentials and returns the token payload', async () => {
    let body: unknown;
    let clientType: string | null = null;
    server.use(
      http.post('*/api/auth/login', async ({ request }) => {
        body = await request.json();
        clientType = request.headers.get('x-client-type');
        return HttpResponse.json({ accessToken: 'a', tokenType: 'Bearer', expiresIn: 900 });
      })
    );

    const result = await authApi.login({ email: 'Jane@Example.com ', password: 'secret-pass' });

    expect(body).toEqual({ email: 'jane@example.com', password: 'secret-pass' });
    expect(clientType).toBe('web');
    expect(result).toEqual({ accessToken: 'a', tokenType: 'Bearer', expiresIn: 900 });
  });

  it('register posts the profile payload and returns the created user', async () => {
    let body: unknown;
    server.use(
      http.post('*/api/auth/register', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(profile, { status: 201 });
      })
    );

    const payload = {
      email: 'jane@example.com',
      password: 'secret-pass',
      name: ' Jane ',
      lastName: 'Doe',
      phone: '+58 412 1234567',
    };
    const result = await authApi.register(payload);

    expect(body).toEqual({ ...payload, name: 'Jane' });
    expect(result.lockerCode).toBe('MI-00001');
  });

  it('rejects an invalid register payload before hitting the network', async () => {
    await expect(
      authApi.register({
        email: 'nope',
        password: 'short',
        name: '',
        lastName: 'Doe',
        phone: 'abc',
      })
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('refresh posts to the refresh endpoint and stores the new token', async () => {
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({ accessToken: 'new', tokenType: 'Bearer', expiresIn: 900 })
      )
    );

    const result = await authApi.refresh();

    expect(result.accessToken).toBe('new');
    expect(getAccessToken()).toBe('new');
  });

  it('logout posts with the bearer token', async () => {
    setAccessToken('tok');
    let authorization: string | null = null;
    server.use(
      http.post('*/api/auth/logout', ({ request }) => {
        authorization = request.headers.get('authorization');
        return new HttpResponse(null, { status: 204 });
      })
    );

    await authApi.logout();

    expect(authorization).toBe('Bearer tok');
  });

  it('me returns the parsed profile', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/auth/me', () => HttpResponse.json(profile)));

    await expect(authApi.me()).resolves.toEqual(profile);
  });

  it('me rejects a response that does not match the contract', async () => {
    setAccessToken('tok');
    server.use(http.get('*/api/auth/me', () => HttpResponse.json({ id: 1 })));

    await expect(authApi.me()).rejects.toBeInstanceOf(ZodError);
  });
});
