import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '@/test/server';

import { apiClient } from './client';
import { onSessionExpired } from './session-events';
import { clearAccessToken, getAccessToken, setAccessToken } from './token-store';

const tokens = (accessToken: string) => ({
  accessToken,
  tokenType: 'Bearer',
  expiresIn: 900,
});

describe('api client', () => {
  beforeEach(() => clearAccessToken());

  it('sends the client type header and the bearer token', async () => {
    setAccessToken('token-1');
    let headers: Headers | undefined;
    server.use(
      http.get('*/api/ping', ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ ok: true });
      })
    );

    await apiClient.get('/ping');

    expect(headers?.get('authorization')).toBe('Bearer token-1');
    expect(headers?.get('x-client-type')).toBe('web');
  });

  it('omits the authorization header without a token', async () => {
    let headers: Headers | undefined;
    server.use(
      http.get('*/api/ping', ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({ ok: true });
      })
    );

    await apiClient.get('/ping');

    expect(headers?.has('authorization')).toBe(false);
  });

  it('refreshes once on 401 and retries the original request with the new token', async () => {
    setAccessToken('expired');
    const refresh = vi.fn(() => HttpResponse.json(tokens('fresh')));
    server.use(
      http.post('*/api/auth/refresh', refresh),
      http.get('*/api/private', ({ request }) =>
        request.headers.get('authorization') === 'Bearer fresh'
          ? HttpResponse.json({ data: 'secret' })
          : new HttpResponse(null, { status: 401 })
      )
    );

    const response = await apiClient.get('/private');

    expect(response.data).toEqual({ data: 'secret' });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('fresh');
  });

  it('shares a single refresh between concurrent 401s', async () => {
    setAccessToken('expired');
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return HttpResponse.json(tokens('fresh'));
    });
    server.use(
      http.post('*/api/auth/refresh', refresh),
      http.get('*/api/private/:id', ({ request, params }) =>
        request.headers.get('authorization') === 'Bearer fresh'
          ? HttpResponse.json({ id: params.id })
          : new HttpResponse(null, { status: 401 })
      )
    );

    const responses = await Promise.all([
      apiClient.get('/private/1'),
      apiClient.get('/private/2'),
      apiClient.get('/private/3'),
    ]);

    expect(responses.map((r) => r.data.id)).toEqual(['1', '2', '3']);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('retries with the current token without refreshing when another call already rotated it', async () => {
    setAccessToken('stale');
    const refresh = vi.fn(() => HttpResponse.json(tokens('unused')));
    server.use(
      http.post('*/api/auth/refresh', refresh),
      http.get('*/api/private', ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer stale') {
          setAccessToken('rotated');
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({ ok: true });
      })
    );

    const response = await apiClient.get('/private');

    expect(response.data).toEqual({ ok: true });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('clears the token, notifies and rejects with the original error when refresh fails', async () => {
    setAccessToken('expired');
    const expired = vi.fn();
    const unsubscribe = onSessionExpired(expired);
    server.use(
      http.post('*/api/auth/refresh', () => new HttpResponse(null, { status: 401 })),
      http.get('*/api/private', () => new HttpResponse(null, { status: 401 }))
    );

    await expect(apiClient.get('/private')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(getAccessToken()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('does not loop when the retried request is rejected again', async () => {
    setAccessToken('expired');
    const refresh = vi.fn(() => HttpResponse.json(tokens('fresh')));
    const attempts = vi.fn(() => new HttpResponse(null, { status: 401 }));
    server.use(http.post('*/api/auth/refresh', refresh), http.get('*/api/private', attempts));

    await expect(apiClient.get('/private')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(attempts).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('keeps the token when the refresh fails without a server response', async () => {
    setAccessToken('expired');
    const expired = vi.fn();
    const unsubscribe = onSessionExpired(expired);
    server.use(
      http.post('*/api/auth/refresh', () => HttpResponse.error()),
      http.get('*/api/private', () => new HttpResponse(null, { status: 401 }))
    );

    await expect(apiClient.get('/private')).rejects.toBeDefined();

    expect(getAccessToken()).toBe('expired');
    expect(expired).not.toHaveBeenCalled();
    unsubscribe();
  });

  it.each(['/auth/login', '/auth/register', '/auth/refresh'])(
    'does not trigger a refresh when %s answers 401',
    async (path) => {
      const refresh = vi.fn(() => HttpResponse.json(tokens('fresh')));
      server.use(
        http.post('*/api/auth/refresh', () => {
          refresh();
          return new HttpResponse(null, { status: 401 });
        }),
        http.post('*/api/auth/login', () => new HttpResponse(null, { status: 401 })),
        http.post('*/api/auth/register', () => new HttpResponse(null, { status: 401 }))
      );

      await expect(apiClient.post(path, {})).rejects.toMatchObject({
        response: { status: 401 },
      });

      expect(refresh).toHaveBeenCalledTimes(path === '/auth/refresh' ? 1 : 0);
    }
  );

  it('passes non-401 errors through untouched', async () => {
    server.use(http.get('*/api/boom', () => new HttpResponse(null, { status: 500 })));

    await expect(apiClient.get('/boom')).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
