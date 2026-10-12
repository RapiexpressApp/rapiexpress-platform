import { http, HttpResponse } from 'msw';

export const profileFixture = {
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

export const tokensFixture = (accessToken = 'access-1') => ({
  accessToken,
  tokenType: 'Bearer',
  expiresIn: 900,
});

export const unauthorized = () => new HttpResponse(null, { status: 401 });

export const meHandler = () =>
  http.get('*/api/auth/me', ({ request }) =>
    request.headers.get('authorization') ? HttpResponse.json(profileFixture) : unauthorized()
  );

export const refreshOkHandler = () =>
  http.post('*/api/auth/refresh', () => HttpResponse.json(tokensFixture()));

export const refreshFailHandler = () => http.post('*/api/auth/refresh', unauthorized);
