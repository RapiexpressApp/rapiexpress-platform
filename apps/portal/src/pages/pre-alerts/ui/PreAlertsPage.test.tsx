import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { purchaseFixture, purchasesListHandler } from '@/test/purchases-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import PreAlertsPage from './PreAlertsPage';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="search">{location.search}</p>;
}

function renderPage(route = '/pre-alerts') {
  server.use(refreshOkHandler(), meHandler());
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/pre-alerts" element={<PreAlertsPage />} />
      </Routes>
      <LocationProbe />
    </>,
    { route }
  );
}

async function findList() {
  return within(await screen.findByRole('list', { name: 'Pre-alertas' }));
}

describe('PreAlertsPage list', () => {
  it('shows the heading and the document title', async () => {
    server.use(purchasesListHandler());

    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Pre-alertas' })).toBeInTheDocument();
    await findList();
    expect(document.title).toBe('Pre-alertas · Rapiexpress');
  });

  it('shows store, guide, description, amounts, category, status and date for each row', async () => {
    server.use(purchasesListHandler([purchaseFixture()]));

    renderPage();

    const list = await findList();
    expect(list.getByText('Amazon')).toBeInTheDocument();
    expect(list.getByText('Audífonos inalámbricos')).toBeInTheDocument();
    expect(list.getByText(/TBA123456789/)).toBeInTheDocument();
    expect(list.getByText(/USD 120,50/)).toBeInTheDocument();
    expect(list.getByText(/1,5 lb/)).toBeInTheDocument();
    expect(list.getByText(/4x4/)).toBeInTheDocument();
    expect(list.getByText('Por recibir')).toBeInTheDocument();
    expect(list.getByText(/15 mar 2026/)).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
  });

  it('labels every status and category in Spanish', async () => {
    server.use(
      purchasesListHandler([
        purchaseFixture({ id: 'p1', status: 'PENDING_RECEPTION', suggestedCategory: 'MIGRANT' }),
        purchaseFixture({
          id: 'p2',
          trackingNumber: 'TBA000000002',
          status: 'RECEIVED',
          suggestedCategory: 'COMMERCIAL',
        }),
        purchaseFixture({ id: 'p3', trackingNumber: 'TBA000000003', status: 'CANCELLED' }),
      ])
    );

    renderPage();

    const list = await findList();
    expect(list.getByText('Por recibir')).toBeInTheDocument();
    expect(list.getByText('Recibida')).toBeInTheDocument();
    expect(list.getByText('Cancelada')).toBeInTheDocument();
    expect(list.getByText(/G \(migrante\)/)).toBeInTheDocument();
    expect(list.getByText(/C \(comercial\)/)).toBeInTheDocument();
  });

  it('renders a table for wide screens with the same columns', async () => {
    server.use(purchasesListHandler());

    renderPage();
    await findList();

    const table = within(screen.getByRole('table', { name: 'Pre-alertas', hidden: true }));
    for (const header of [
      'Tienda',
      'Guía',
      'Valor declarado',
      'Peso estimado',
      'Categoría',
      'Estado',
      'Creada',
    ]) {
      expect(table.getByRole('columnheader', { name: header, hidden: true })).toBeInTheDocument();
    }
    expect(table.getByText('TBA123456789')).toBeInTheDocument();
  });

  it('shows a loading skeleton first', async () => {
    server.use(purchasesListHandler());

    renderPage();

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    await findList();
  });

  it('shows an empty state when the customer has no pre-alerts', async () => {
    server.use(purchasesListHandler([]));

    renderPage();

    expect(await screen.findByText(/Aún no tienes pre-alertas/)).toBeInTheDocument();
  });

  it('shows a filtered empty state that offers to see them all', async () => {
    const requests: URL[] = [];
    server.use(purchasesListHandler([], { onRequest: (url) => requests.push(url) }));

    renderPage('/pre-alerts?status=RECEIVED');

    expect(await screen.findByText('No tienes pre-alertas con este estado.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver todas' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('status')).toBe(false));
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/me/purchases', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ items: [purchaseFixture()], page: 1, pageSize: 10, total: 1 });
      })
    );

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar tus pre-alertas.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    const list = await findList();
    expect(list.getByText('Amazon')).toBeInTheDocument();
  });
});

describe('PreAlertsPage status filter', () => {
  it('starts on all statuses and sends no status to the API', async () => {
    const requests: URL[] = [];
    server.use(
      purchasesListHandler([purchaseFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderPage();
    await findList();

    expect(screen.getByRole('button', { name: 'Todas', pressed: true })).toBeInTheDocument();
    expect(requests[0]?.searchParams.has('status')).toBe(false);
    expect(requests[0]?.searchParams.get('pageSize')).toBe('10');
  });

  it('writes the chosen status to the URL, requests it and resets the page', async () => {
    const requests: URL[] = [];
    server.use(
      purchasesListHandler([purchaseFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderPage('/pre-alerts?page=3');
    await findList();

    await userEvent.click(screen.getByRole('button', { name: 'Recibidas' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?status=RECEIVED'));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe('RECEIVED'));
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
    expect(screen.getByRole('button', { name: 'Recibidas', pressed: true })).toBeInTheDocument();
  });

  it.each([
    ['Por recibir', 'PENDING_RECEPTION'],
    ['Recibidas', 'RECEIVED'],
    ['Canceladas', 'CANCELLED'],
  ])('filters by %s', async (label, status) => {
    const requests: URL[] = [];
    server.use(
      purchasesListHandler([purchaseFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderPage();
    await findList();

    await userEvent.click(screen.getByRole('button', { name: label }));

    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe(status));
  });

  it('reads the status and page from the URL', async () => {
    const requests: URL[] = [];
    server.use(
      purchasesListHandler([purchaseFixture()], {
        total: 45,
        onRequest: (url) => requests.push(url),
      })
    );

    renderPage('/pre-alerts?status=CANCELLED&page=2');
    await findList();

    expect(requests[0]?.searchParams.get('status')).toBe('CANCELLED');
    expect(requests[0]?.searchParams.get('page')).toBe('2');
    expect(screen.getByRole('button', { name: 'Canceladas', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument();
  });

  it('ignores an unknown status in the URL', async () => {
    const requests: URL[] = [];
    server.use(
      purchasesListHandler([purchaseFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderPage('/pre-alerts?status=BOGUS&page=0');
    await findList();

    expect(requests[0]?.searchParams.has('status')).toBe(false);
    expect(requests[0]?.searchParams.get('page')).toBe('1');
    expect(screen.getByRole('button', { name: 'Todas', pressed: true })).toBeInTheDocument();
  });

  it('removes the status from the URL when going back to all', async () => {
    server.use(purchasesListHandler());

    renderPage('/pre-alerts?status=RECEIVED');
    await findList();

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/));
  });
});

describe('PreAlertsPage pagination', () => {
  it('navigates pages through the URL', async () => {
    const requests: URL[] = [];
    server.use(
      purchasesListHandler([purchaseFixture()], {
        total: 25,
        onRequest: (url) => requests.push(url),
      })
    );

    renderPage();
    await screen.findByText('Página 1 de 3');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?page=2'));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('page')).toBe('2');
  });
});

describe('PreAlertsPage route', () => {
  it('is reachable inside the authenticated layout', async () => {
    server.use(refreshOkHandler(), meHandler(), purchasesListHandler());

    renderWithProviders(<AppRoutes />, { route: '/pre-alerts' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pre-alertas' })
    ).toBeInTheDocument();
    const list = await findList();
    expect(list.getByText('Amazon')).toBeInTheDocument();
  });
});
