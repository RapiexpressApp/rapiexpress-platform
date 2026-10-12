import { http, HttpResponse } from 'msw';

export const userFixture = (overrides: Record<string, unknown> = {}) => ({
  id: 'u1',
  email: 'ops@rapiexpress.com',
  name: 'Olga',
  lastName: 'Pérez',
  phone: '+58 412 1234567',
  role: 'OPERATIONS',
  isActive: true,
  createdAt: '2026-01-15T00:00:00.000Z',
  ...overrides,
});

export const usersListHandler = (
  items = [userFixture()],
  meta: { total?: number; onRequest?: (url: URL) => void } = {}
) =>
  http.get('*/api/users', ({ request }) => {
    const url = new URL(request.url);
    meta.onRequest?.(url);
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      total: meta.total ?? items.length,
    });
  });
