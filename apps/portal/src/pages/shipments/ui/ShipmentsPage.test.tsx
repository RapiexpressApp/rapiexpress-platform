import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AppRoutes } from '@/app/router/routes';
import { meHandler, refreshOkHandler } from '@/test/auth-handlers';
import { myPackageFixture, myPackagesListHandler, PACKAGE_ID } from '@/test/packages-handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { findShipmentsList, renderShipmentsPage } from '@/test/shipments-page';

describe('ShipmentsPage list', () => {
  it('shows the heading and the document title', async () => {
    server.use(myPackagesListHandler());

    renderShipmentsPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Mis envíos' })).toBeInTheDocument();
    await findShipmentsList();
    expect(document.title).toBe('Mis envíos · Rapiexpress');
  });

  it('shows warehouse number, guide, description, status, weight and received date', async () => {
    server.use(myPackagesListHandler([myPackageFixture()]));

    renderShipmentsPage();

    const list = await findShipmentsList();
    expect(list.getByRole('link', { name: 'WH-000123' })).toBeInTheDocument();
    expect(list.getByText(/TBA123456789/)).toBeInTheDocument();
    expect(list.getByText('Audífonos inalámbricos')).toBeInTheDocument();
    expect(list.getByText('Bodega')).toBeInTheDocument();
    expect(list.getByText(/1,5 lb/)).toBeInTheDocument();
    expect(list.getByText(/0,68 kg/)).toBeInTheDocument();
    expect(list.getByText(/15 mar 2026/)).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–1 de 1')).toBeInTheDocument();
  });

  it('labels every visible status in Spanish', async () => {
    server.use(
      myPackagesListHandler([
        myPackageFixture({ id: 'a', warehouseNumber: 'WH-1', status: 'WAREHOUSE' }),
        myPackageFixture({ id: 'b', warehouseNumber: 'WH-2', status: 'SHIPPED' }),
        myPackageFixture({ id: 'c', warehouseNumber: 'WH-3', status: 'CUSTOMS' }),
        myPackageFixture({ id: 'd', warehouseNumber: 'WH-4', status: 'AGENCY' }),
        myPackageFixture({ id: 'e', warehouseNumber: 'WH-5', status: 'DELIVERED' }),
      ])
    );

    renderShipmentsPage();

    const list = await findShipmentsList();
    for (const label of ['Bodega', 'Embarcado', 'Aduana', 'Agencia', 'Entregado']) {
      expect(list.getByText(label)).toBeInTheDocument();
    }
  });

  it('flags only the packages that are ready for pickup', async () => {
    server.use(
      myPackagesListHandler([
        myPackageFixture({
          id: 'a',
          warehouseNumber: 'WH-1',
          status: 'AGENCY',
          readyForPickup: true,
        }),
        myPackageFixture({ id: 'b', warehouseNumber: 'WH-2', status: 'AGENCY' }),
      ])
    );

    renderShipmentsPage();

    const list = await findShipmentsList();
    expect(list.getAllByText('Listo para retirar')).toHaveLength(1);
    const ready = list.getByRole('link', { name: 'WH-1' }).closest('li');
    expect(within(ready as HTMLElement).getByText('Listo para retirar')).toBeInTheDocument();
  });

  it('falls back when a package has no description', async () => {
    server.use(myPackagesListHandler([myPackageFixture({ description: null })]));

    renderShipmentsPage();

    const list = await findShipmentsList();
    expect(list.getByText('Sin descripción')).toBeInTheDocument();
  });

  it('renders a table for wide screens with the same columns', async () => {
    server.use(myPackagesListHandler());

    renderShipmentsPage();
    await findShipmentsList();

    const table = within(screen.getByRole('table', { name: 'Envíos', hidden: true }));
    for (const header of ['Paquete', 'Guía', 'Estado', 'Peso', 'Recibido']) {
      expect(table.getByRole('columnheader', { name: header, hidden: true })).toBeInTheDocument();
    }
    expect(table.getByText('TBA123456789')).toBeInTheDocument();
  });

  it('links each row to its detail page', async () => {
    server.use(myPackagesListHandler([myPackageFixture()]));

    renderShipmentsPage();

    const list = await findShipmentsList();
    const link = list.getByRole('link', { name: 'WH-000123' });
    expect(link).toHaveAttribute('href', `/shipments/${PACKAGE_ID}`);

    await userEvent.click(link);

    expect(await screen.findByText('Detalle del envío')).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent(`/shipments/${PACKAGE_ID}`);
  });

  it('shows a loading skeleton first', async () => {
    server.use(myPackagesListHandler());

    renderShipmentsPage();

    expect(screen.getByRole('status', { name: 'Cargando listado' })).toBeInTheDocument();
    await findShipmentsList();
  });

  it('explains when packages appear and offers to pre-alert a purchase', async () => {
    server.use(myPackagesListHandler([]));

    renderShipmentsPage();

    expect(await screen.findByText(/Aún no tienes envíos/)).toBeInTheDocument();
    expect(screen.getByText(/cuando recibamos tus paquetes/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pre-alertar una compra' })).toHaveAttribute(
      'href',
      '/pre-alerts?new=1'
    );
  });

  it('shows a filtered empty state that offers to see them all', async () => {
    const requests: URL[] = [];
    server.use(myPackagesListHandler([], { onRequest: (url) => requests.push(url) }));

    renderShipmentsPage('/shipments?status=DELIVERED');

    expect(await screen.findByText('No tienes envíos con este estado.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver todos' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/));
    await waitFor(() => expect(requests.at(-1)?.searchParams.has('status')).toBe(false));
  });

  it('shows an error with a working retry', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/me/packages', () => {
        calls += 1;
        return calls === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ items: [myPackageFixture()], page: 1, pageSize: 10, total: 1 });
      })
    );

    renderShipmentsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tus envíos.');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    const list = await findShipmentsList();
    expect(list.getByRole('link', { name: 'WH-000123' })).toBeInTheDocument();
  });
});

describe('ShipmentsPage status filter', () => {
  it('starts on all statuses and sends no status to the API', async () => {
    const requests: URL[] = [];
    server.use(
      myPackagesListHandler([myPackageFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderShipmentsPage();
    await findShipmentsList();

    expect(screen.getByRole('button', { name: 'Todos', pressed: true })).toBeInTheDocument();
    expect(requests[0]?.searchParams.has('status')).toBe(false);
    expect(requests[0]?.searchParams.get('pageSize')).toBe('10');
  });

  it('writes the chosen status to the URL, requests it and resets the page', async () => {
    const requests: URL[] = [];
    server.use(
      myPackagesListHandler([myPackageFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderShipmentsPage('/shipments?page=3');
    await findShipmentsList();

    await userEvent.click(screen.getByRole('button', { name: 'Aduana' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?status=CUSTOMS'));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe('CUSTOMS'));
    expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
    expect(screen.getByRole('button', { name: 'Aduana', pressed: true })).toBeInTheDocument();
  });

  it.each([
    ['Bodega', 'WAREHOUSE'],
    ['Embarcado', 'SHIPPED'],
    ['Aduana', 'CUSTOMS'],
    ['Agencia', 'AGENCY'],
    ['Entregado', 'DELIVERED'],
  ])('filters by %s', async (label, status) => {
    const requests: URL[] = [];
    server.use(
      myPackagesListHandler([myPackageFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderShipmentsPage();
    await findShipmentsList();

    await userEvent.click(screen.getByRole('button', { name: label }));

    await waitFor(() => expect(requests.at(-1)?.searchParams.get('status')).toBe(status));
  });

  it('reads the status and page from the URL', async () => {
    const requests: URL[] = [];
    server.use(
      myPackagesListHandler([myPackageFixture()], {
        total: 45,
        onRequest: (url) => requests.push(url),
      })
    );

    renderShipmentsPage('/shipments?status=AGENCY&page=2');
    await findShipmentsList();

    expect(requests[0]?.searchParams.get('status')).toBe('AGENCY');
    expect(requests[0]?.searchParams.get('page')).toBe('2');
    expect(screen.getByRole('button', { name: 'Agencia', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument();
  });

  it('ignores an unknown status in the URL', async () => {
    const requests: URL[] = [];
    server.use(
      myPackagesListHandler([myPackageFixture()], { onRequest: (url) => requests.push(url) })
    );

    renderShipmentsPage('/shipments?status=READY_FOR_PICKUP&page=0');
    await findShipmentsList();

    expect(requests[0]?.searchParams.has('status')).toBe(false);
    expect(requests[0]?.searchParams.get('page')).toBe('1');
    expect(screen.getByRole('button', { name: 'Todos', pressed: true })).toBeInTheDocument();
  });

  it('removes the status from the URL when going back to all', async () => {
    server.use(myPackagesListHandler());

    renderShipmentsPage('/shipments?status=SHIPPED');
    await findShipmentsList();

    await userEvent.click(screen.getByRole('button', { name: 'Todos' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/));
  });
});

describe('ShipmentsPage pagination', () => {
  it.each(['1e21', '99999999999', '10001', '1.5', '-2', 'abc'])(
    'falls back to the first page for the page %j',
    async (rawPage) => {
      const requests: URL[] = [];
      server.use(
        myPackagesListHandler([myPackageFixture()], { onRequest: (url) => requests.push(url) })
      );

      renderShipmentsPage(`/shipments?page=${rawPage}`);
      await findShipmentsList();

      expect(requests[0]?.searchParams.get('page')).toBe('1');
    }
  );

  it('navigates pages through the URL', async () => {
    const requests: URL[] = [];
    server.use(
      myPackagesListHandler([myPackageFixture()], {
        total: 25,
        onRequest: (url) => requests.push(url),
      })
    );

    renderShipmentsPage();
    await screen.findByText('Página 1 de 3');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('?page=2'));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('page')).toBe('2');
  });
});

describe('ShipmentsPage out-of-range page', () => {
  function pagedHandler(total: number, requests: URL[]) {
    return http.get('*/api/me/packages', ({ request }) => {
      const url = new URL(request.url);
      requests.push(url);
      const page = Number(url.searchParams.get('page'));
      const lastPage = Math.max(1, Math.ceil(total / 10));
      const items = page <= lastPage && total > 0 ? [myPackageFixture({ id: `p${page}` })] : [];
      return HttpResponse.json({ items, page, pageSize: 10, total });
    });
  }

  it('moves to the last page instead of showing an empty state', async () => {
    const requests: URL[] = [];
    server.use(pagedHandler(25, requests));

    renderShipmentsPage('/shipments?page=99');

    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toHaveTextContent('?page=3');
    expect(requests.at(-1)?.searchParams.get('page')).toBe('3');
    expect(screen.queryByText(/No tienes envíos/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Aún no tienes envíos/)).not.toBeInTheDocument();
  });

  it('moves to the first page and clears the param when there is nothing at all', async () => {
    const requests: URL[] = [];
    server.use(pagedHandler(0, requests));

    renderShipmentsPage('/shipments?page=3');

    expect(await screen.findByText(/Aún no tienes envíos/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/));
  });

  it('keeps the filter when it moves to the last page', async () => {
    const requests: URL[] = [];
    server.use(pagedHandler(12, requests));

    renderShipmentsPage('/shipments?status=SHIPPED&page=7');

    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
    expect(requests.at(-1)?.searchParams.get('status')).toBe('SHIPPED');
    expect(screen.getByTestId('search')).toHaveTextContent('status=SHIPPED');
    expect(screen.getByTestId('search')).toHaveTextContent('page=2');
  });
});

describe('ShipmentsPage route', () => {
  it('is reachable inside the authenticated layout from the sidebar', async () => {
    server.use(refreshOkHandler(), meHandler(), myPackagesListHandler());

    renderWithProviders(<AppRoutes />, { route: '/shipments' });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mis envíos' })
    ).toBeInTheDocument();
    const list = await findShipmentsList();
    expect(list.getByRole('link', { name: 'WH-000123' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mis envíos', hidden: true })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
