import { http, HttpResponse } from 'msw';

export const profileFixture = (role = 'ADMIN') => ({
  id: 'u1',
  email: 'staff@rapiexpress.com',
  name: 'Ana',
  lastName: 'Rojas',
  phone: '+58 412 1234567',
  kind: role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF',
  role,
  lockerCode: '',
  createdAt: '2026-01-01T00:00:00.000Z',
});

export const tokensFixture = (accessToken = 'access-1') => ({
  accessToken,
  tokenType: 'Bearer',
  expiresIn: 900,
});

export const unauthorized = () => new HttpResponse(null, { status: 401 });

export const meHandler = (role = 'ADMIN') =>
  http.get('*/api/auth/me', ({ request }) =>
    request.headers.get('authorization') ? HttpResponse.json(profileFixture(role)) : unauthorized()
  );

export const refreshOkHandler = () =>
  http.post('*/api/auth/refresh', () => HttpResponse.json(tokensFixture()));

export const refreshFailHandler = () => http.post('*/api/auth/refresh', unauthorized);

export const logoutHandler = () =>
  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 }));
