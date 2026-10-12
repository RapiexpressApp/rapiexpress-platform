import type { CustomerListItem } from '@rapiexpress/api-client/customers.schemas';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import CustomersPage from './CustomersPage';

const customer: CustomerListItem = {
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

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="search">{location.search}</p>;
}

function customersListHandler(
  items = [customer],
  meta: { total?: number; onRequest?: (url: URL) => void } = {}
) {
  return http.get('*/api/customers', ({ request }) => {
    const url = new URL(request.url);
    meta.onRequest?.(url);
    return HttpResponse.json({
      items,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
      total: meta.total ?? items.length,
    });
  });
}

function renderPage(route = '/clientes') {
  server.use(refreshOkHandler(), meHandler('OPERATIONS'));
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/clientes" element={<CustomersPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}

describe('CustomersPage', () => {
  it('shows customer details and locker code', async () => {
    server.use(customersListHandler());

    renderPage();

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('MI-00001')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
  });

  it('renders a courier without a locker code safely', async () => {
    server.use(
      customersListHandler([{ ...customer, id: 'c2', kind: 'COURIER', lockerCode: null }])
    );

    renderPage();

    expect(await screen.findByText('Sin casillero')).toBeInTheDocument();
    expect(screen.getByText('Repartidor')).toBeInTheDocument();
  });

  it('shows loading then an empty state', async () => {
    server.use(customersListHandler([]));

    renderPage();

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    expect(await screen.findByText('Aún no hay clientes.')).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/customers', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ items: [customer], page: 1, pageSize: 20, total: 1 });
      })
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los clientes.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('MI-00001')).toBeInTheDocument();
  });

  it('debounces locker search into the URL and resets the page', async () => {
    const requests: URL[] = [];
    server.use(customersListHandler([customer], { onRequest: (url) => requests.push(url) }));

    renderPage('/clientes?page=3');
    await screen.findByText('MI-00001');
    const initial = requests.length;

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar clientes' }), 'MI-00001');

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?search=MI-00001'));
    await waitFor(() => expect(requests.length).toBeGreaterThan(initial));
    expect(requests.slice(initial)).toHaveLength(1);
    expect(requests.at(-1)?.searchParams.get('search')).toBe('MI-00001');
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  });

  it('reads page and pageSize from the URL and clamps invalid values', async () => {
    const requests: URL[] = [];
    server.use(
      customersListHandler([customer], { total: 300, onRequest: (url) => requests.push(url) })
    );

    renderPage('/clientes?page=0&pageSize=500');
    await screen.findByText('MI-00001');
    expect(requests[0]?.searchParams.get('page')).toBe('1');
    expect(requests[0]?.searchParams.get('pageSize')).toBe('100');
  });

  it('navigates pages through the URL and retains rows while loading', async () => {
    const requests: URL[] = [];
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('*/api/customers', async ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        if (url.searchParams.get('page') === '2') await gate;
        return HttpResponse.json({
          items: [customer],
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: 20,
          total: 45,
        });
      })
    );

    renderPage();
    await screen.findByText('Página 1 de 3');

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('page=2'));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('page')).toBe('2'));
    expect(screen.getByText('MI-00001')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Cargando listado' })).not.toBeInTheDocument();
    release();
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
  });

  it.each(['ADMIN', 'OPERATIONS'])('lets %s view customers through the panel', async (role) => {
    server.use(refreshOkHandler(), meHandler(role), customersListHandler());

    renderWithProviders(<AppRoutes />, { route: '/clientes' });

    expect(await screen.findByText('MI-00001')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });
});
